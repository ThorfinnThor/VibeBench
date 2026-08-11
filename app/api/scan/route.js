import { lookup } from "node:dns/promises";
import net from "node:net";
import { analyzeHtml, analyzeManifest } from "../../../lib/analyze-html.mjs";
import { buildV03FeatureMap, scoreV03 } from "../../../lib/development-v0_3-candidate.mjs";
import { extractSameOriginAssets, extractSameOriginManifest } from "../../../lib/extract-assets.mjs";
import { collectPortablePageMetrics } from "../../../lib/portable-page-metrics.mjs";
import {
  auditSecurity,
  buildRecommendations,
  collectProductionExtendedMetrics,
  explainScore,
  getScoreBand
} from "../../../lib/production-v0_4-features.mjs";
import { classifyScanError } from "../../../lib/result-presentation.mjs";
import candidateModel from "../../../outputs/development_v0_4/vibebench_development_v0_4_candidate_model.json";

export const runtime = "nodejs";
export const maxDuration = 20;

const MAX_HTML_BYTES = 1_500_000;
const MAX_ASSET_BYTES = 300_000;
const MAX_MANIFEST_BYTES = 100_000;
const MAX_REDIRECTS = 5;
const MAX_ASSET_REDIRECTS = 3;

function normalizeUrl(value) {
  const input = String(value || "").trim();
  if (!input || input.length > 2048) throw new Error("Bitte eine gültige öffentliche URL eingeben.");
  const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Nur öffentliche HTTP- und HTTPS-URLs werden unterstützt.");
  url.username = "";
  url.password = "";
  url.hash = "";
  return url;
}

function isPrivateIp(address) {
  if (net.isIPv4(address)) {
    const [a, b] = address.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  const value = address.toLowerCase();
  return value === "::1" || value === "::" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb") || value.startsWith("::ffff:127.") || value.startsWith("::ffff:10.") || value.startsWith("::ffff:192.168.");
}

async function validatePublicHost(url) {
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) throw new Error("Lokale und private Adressen werden nicht gescannt.");
  const addresses = await lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) throw new Error("Die URL verweist auf eine lokale oder private Adresse.");
}

async function fetchPublicHtml(initialUrl) {
  let current = initialUrl;
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    await validatePublicHost(current);
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(12_000),
      headers: { "user-agent": "VibeBench/0.1 (+public website evidence scan)", accept: "text/html,application/xhtml+xml" }
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`Weiterleitung ohne Ziel (HTTP ${response.status}).`);
      current = new URL(location, current);
      if (!["http:", "https:"].includes(current.protocol)) throw new Error("Unsichere Weiterleitung wurde blockiert.");
      continue;
    }
    if (!response.ok) throw new Error(`Website antwortet mit HTTP ${response.status}.`);
    const contentType = response.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) throw new Error("Die URL liefert keine HTML-Seite.");
    const declaredSize = Number(response.headers.get("content-length") || 0);
    if (declaredSize > MAX_HTML_BYTES) throw new Error("Die HTML-Antwort ist für den sicheren Schnellscan zu groß.");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_HTML_BYTES) throw new Error("Die HTML-Antwort ist für den sicheren Schnellscan zu groß.");
    const headers = Object.fromEntries(response.headers.entries());
    return { html: new TextDecoder().decode(bytes), url: current.toString(), status: response.status, headers };
  }
  throw new Error("Zu viele Weiterleitungen.");
}

async function readLimitedText(response, maxBytes) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Response body unavailable.");
  const chunks = [];
  let total = 0;
  let truncated = false;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    const remaining = maxBytes - total;
    if (value.byteLength > remaining) {
      chunks.push(value.subarray(0, remaining));
      total += remaining;
      truncated = true;
      await reader.cancel();
      break;
    }
    chunks.push(value);
    total += value.byteLength;
  }
  if (total === maxBytes && !truncated) {
    const { done } = await reader.read();
    truncated = !done;
    if (truncated) await reader.cancel();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { text: new TextDecoder().decode(bytes), bytes: bytes.byteLength, truncated };
}

async function fetchSameOriginText(initialUrl, requiredOrigin, { accept, contentTypePattern, maxBytes }) {
  let current = initialUrl;
  for (let redirect = 0; redirect <= MAX_ASSET_REDIRECTS; redirect += 1) {
    if (current.origin !== requiredOrigin) throw new Error("Cross-origin asset redirect blocked.");
    await validatePublicHost(current);
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(6_000),
      headers: { "user-agent": "VibeBench/0.1 (+public website evidence scan)", accept }
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Asset redirect without location.");
      current = new URL(location, current);
      continue;
    }
    if (!response.ok) throw new Error(`Asset HTTP ${response.status}.`);
    const contentType = response.headers.get("content-type") || "";
    if (contentType && !contentTypePattern.test(contentType)) {
      throw new Error("Unsupported asset content type.");
    }
    return readLimitedText(response, maxBytes);
  }
  throw new Error("Too many asset redirects.");
}

function fetchPublicAsset(initialUrl, requiredOrigin) {
  return fetchSameOriginText(initialUrl, requiredOrigin, {
    accept: "text/css,text/javascript,application/javascript,application/ecmascript,text/plain",
    contentTypePattern: /javascript|ecmascript|text\/css|text\/plain|application\/octet-stream/i,
    maxBytes: MAX_ASSET_BYTES
  });
}

function fetchPublicManifest(initialUrl, requiredOrigin) {
  return fetchSameOriginText(initialUrl, requiredOrigin, {
    accept: "application/manifest+json,application/json,text/plain",
    contentTypePattern: /manifest\+json|application\/json|text\/json|text\/plain/i,
    maxBytes: MAX_MANIFEST_BYTES
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const inputUrl = normalizeUrl(body?.url);
    const fetched = await fetchPublicHtml(inputUrl);
    const assetCandidates = extractSameOriginAssets({ html: fetched.html, baseUrl: fetched.url });
    const manifestUrl = extractSameOriginManifest({ html: fetched.html, baseUrl: fetched.url });
    const requiredOrigin = new URL(fetched.url).origin;
    const [assetResults, manifestResult] = await Promise.all([
      Promise.allSettled(assetCandidates.map(async (asset) => ({
        ...asset,
        ...await fetchPublicAsset(new URL(asset.url), requiredOrigin)
      }))),
      manifestUrl ? fetchPublicManifest(new URL(manifestUrl), requiredOrigin).catch(() => null) : Promise.resolve(null)
    ]);
    const fetchedAssets = assetResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);
    const assetText = fetchedAssets.map((asset) => asset.text).join("\n");
    const analysis = analyzeHtml({ ...fetched, assetText });
    const manifestAnalysis = analyzeManifest(manifestResult?.text || "");
    analysis.manifestEvidence = manifestAnalysis.evidence;
    analysis.metrics.sameOriginAssets = fetchedAssets.length;
    analysis.metrics.assetBytes = fetchedAssets.reduce((total, asset) => total + asset.bytes, 0);
    analysis.metrics.assetFetchErrors = assetResults.length - fetchedAssets.length;
    analysis.metrics.truncatedAssets = fetchedAssets.filter((asset) => asset.truncated).length;
    const pageMetrics = collectPortablePageMetrics({ html: fetched.html, assets: assetCandidates, fetchedAssets });
    const extendedMetrics = collectProductionExtendedMetrics(fetched.html, assetText);
    const featureMap = buildV03FeatureMap({
      sample_id: fetched.url,
      stack_signals: analysis.stackSignals,
      direct_evidence: analysis.directEvidence,
      context_evidence: analysis.contextEvidence,
      header_evidence: analysis.headerEvidence,
      structural_hints: analysis.structuralHints,
      page_metrics: pageMetrics,
      extended_metrics: extendedMetrics,
      asset_scan: {
        requested: assetCandidates.length,
        fetched: fetchedAssets.length
      }
    });
    const probability = scoreV03(candidateModel, featureMap);
    const score = Math.round(probability * 100);
    const scoreContributions = explainScore(candidateModel, featureMap);
    const security = auditSecurity(fetched.url, fetched.headers);
    const recommendations = buildRecommendations({ analysis, pageMetrics, extendedMetrics, security });
    return Response.json({
      ok: true,
      requestedUrl: inputUrl.toString(),
      resolvedUrl: fetched.url,
      httpStatus: fetched.status,
      analyzedAt: new Date().toISOString(),
      assetScan: {
        candidates: assetCandidates.length,
        fetched: fetchedAssets.length,
        errors: assetResults.length - fetchedAssets.length,
        bytes: analysis.metrics.assetBytes,
        truncated: analysis.metrics.truncatedAssets
      },
      manifestScan: {
        linked: Boolean(manifestUrl),
        fetched: Boolean(manifestResult),
        validJson: manifestAnalysis.validJson,
        bytes: manifestResult?.bytes || 0,
        truncated: manifestResult?.truncated || false
      },
      vibeScore: {
        score,
        probability,
        band: getScoreBand(score),
        threshold: Math.round(candidateModel.training.threshold * 100),
        aboveValidatedThreshold: probability >= candidateModel.training.threshold,
        meaning: "Ähnlichkeit der öffentlich sichtbaren Website-Muster mit dem validierten VibeBench-Korpus.",
        caveat: "Kein Prozentanteil AI-generierten Codes und kein Beweis für die Autorenschaft."
      },
      scoreDrivers: {
        raises: scoreContributions.filter((item) => item.direction === "raises").slice(0, 5),
        lowers: scoreContributions.filter((item) => item.direction === "lowers").slice(0, 4)
      },
      security,
      recommendations,
      model: {
        version: "v0.4",
        independentHoldout: 100,
        precision: 0.824,
        recall: 0.857,
        f1: 0.84
      },
      ...analysis,
      warning: "Der 0–100-Score misst Ähnlichkeit mit dem validierten Korpus. Er ist kein Prozentanteil AI-generierten Codes und kein Beweis für Autorenschaft."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Der Scan ist fehlgeschlagen.";
    const technicalOutcome = classifyScanError(error);
    return Response.json({ ok: false, error: message, technicalOutcome }, { status: technicalOutcome.responseStatus });
  }
}
