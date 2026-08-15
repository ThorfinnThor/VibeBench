import { lookup } from "node:dns/promises";
import { randomUUID } from "node:crypto";
import net from "node:net";
import { analyzeHtml, analyzeManifest } from "../../../lib/analyze-html.mjs";
import { readLimitedText } from "../../../lib/bounded-response.mjs";
import { buildV03FeatureMap, scoreV03 } from "../../../lib/development-v0_3-candidate.mjs";
import { extractSameOriginManifest, selectSameOriginAssets } from "../../../lib/extract-assets.mjs";
import { describeEvidenceCoverage } from "../../../lib/evidence-coverage.mjs";
import { collectPortablePageMetrics } from "../../../lib/portable-page-metrics.mjs";
import { assertPublicAddresses, normalizePublicUrl } from "../../../lib/public-url-policy.mjs";
import {
  auditSecurity,
  buildRecommendations,
  collectProductionExtendedMetrics,
  explainScore,
  getScoreBand
} from "../../../lib/production-v0_4-features.mjs";
import { classifyScanError } from "../../../lib/result-presentation.mjs";
import {
  assertEligibleHtmlDocument,
  assertScanRequestBody,
  assertSupportedTextEncoding,
  assertV04DocumentSemantics,
  parseMediaType
} from "../../../lib/scan-response-policy.mjs";
import { SCAN_API_VERSION } from "../../../lib/scan-contract.mjs";
import candidateModel from "../../../outputs/development_v0_4/vibebench_development_v0_4_candidate_model.json";
import release from "../../../release/v0.4.json";

export const runtime = "nodejs";
export const maxDuration = 20;

const MAX_HTML_BYTES = 1_500_000;
const MAX_ASSET_BYTES = 300_000;
const MAX_MANIFEST_BYTES = 100_000;
const MAX_REDIRECTS = 5;
const MAX_ASSET_REDIRECTS = 3;

async function validatePublicHost(url) {
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) throw new Error("Lokale und private Adressen werden nicht gescannt.");
  if (net.isIP(host)) {
    assertPublicAddresses([{ address: host }]);
    return;
  }
  let timeout;
  const addresses = await Promise.race([
    lookup(host, { all: true, verbatim: true }),
    new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("DNS lookup timeout.")), 4_000); })
  ]).finally(() => clearTimeout(timeout));
  assertPublicAddresses(addresses);
}

function combinedSignal(...signals) {
  return AbortSignal.any(signals.filter(Boolean));
}

async function fetchPublicHtml(initialUrl, signal) {
  let current = initialUrl;
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    current = normalizePublicUrl(current.toString());
    await validatePublicHost(current);
    const response = await fetch(current, {
      redirect: "manual",
      signal: combinedSignal(signal, AbortSignal.timeout(12_000)),
      headers: { "user-agent": release.userAgent, accept: "text/html,application/xhtml+xml" }
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
    if (!["text/html", "application/xhtml+xml"].includes(parseMediaType(contentType))) throw new Error("Die URL liefert keine HTML-Seite.");
    assertSupportedTextEncoding(contentType);
    const declaredSize = Number(response.headers.get("content-length") || 0);
    if (declaredSize > MAX_HTML_BYTES) throw new Error("Die HTML-Antwort ist für den sicheren Schnellscan zu groß.");
    const body = await readLimitedText(response, MAX_HTML_BYTES);
    if (body.truncated) throw new Error("Die HTML-Antwort ist für den sicheren Schnellscan zu groß.");
    assertEligibleHtmlDocument({ status: response.status, headers: response.headers, html: body.text });
    assertV04DocumentSemantics(body.text);
    const headers = Object.fromEntries(response.headers.entries());
    return { html: body.text, htmlBytes: body.bytes, url: current.toString(), status: response.status, headers };
  }
  throw new Error("Zu viele Weiterleitungen.");
}

async function fetchSameOriginText(initialUrl, requiredOrigin, { accept, allowedMediaTypes, maxBytes, signal }) {
  let current = initialUrl;
  for (let redirect = 0; redirect <= MAX_ASSET_REDIRECTS; redirect += 1) {
    current = normalizePublicUrl(current.toString());
    if (current.origin !== requiredOrigin) throw new Error("Cross-origin asset redirect blocked.");
    await validatePublicHost(current);
    const response = await fetch(current, {
      redirect: "manual",
      signal: combinedSignal(signal, AbortSignal.timeout(6_000)),
      headers: { "user-agent": release.userAgent, accept }
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Asset redirect without location.");
      current = new URL(location, current);
      continue;
    }
    if (!response.ok) throw new Error(`Asset HTTP ${response.status}.`);
    const contentType = response.headers.get("content-type") || "";
    if (!allowedMediaTypes.includes(parseMediaType(contentType))) throw new Error("Unsupported asset content type.");
    assertSupportedTextEncoding(contentType);
    const body = await readLimitedText(response, maxBytes);
    if (body.truncated) throw new Error("Asset response exceeds byte limit.");
    return body;
  }
  throw new Error("Too many asset redirects.");
}

function fetchPublicAsset(asset, requiredOrigin, signal) {
  const scriptTypes = ["text/javascript", "application/javascript", "application/ecmascript", "text/ecmascript"];
  return fetchSameOriginText(new URL(asset.url), requiredOrigin, {
    accept: asset.kind === "stylesheet" ? "text/css" : "text/javascript,application/javascript,application/ecmascript",
    allowedMediaTypes: asset.kind === "stylesheet" ? ["text/css"] : scriptTypes,
    maxBytes: MAX_ASSET_BYTES,
    signal
  });
}

function fetchPublicManifest(initialUrl, requiredOrigin, signal) {
  return fetchSameOriginText(initialUrl, requiredOrigin, {
    accept: "application/manifest+json,application/json,text/plain",
    allowedMediaTypes: ["application/manifest+json", "application/json"],
    maxBytes: MAX_MANIFEST_BYTES,
    signal
  });
}

export async function POST(request) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const deadline = AbortSignal.timeout(18_000);
  const responseHeaders = { "x-vibebench-request-id": requestId, "x-vibebench-api-version": SCAN_API_VERSION };
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 4_096) throw new Error("Die Scan-Anfrage ist zu groß.");
    let body;
    try {
      body = await request.json();
    } catch {
      throw new Error("Ungültige JSON-Anfrage.");
    }
    const inputUrl = normalizePublicUrl(assertScanRequestBody(body));
    const signal = combinedSignal(request.signal, deadline);
    const fetched = await fetchPublicHtml(inputUrl, signal);
    signal.throwIfAborted();
    const assetSelection = selectSameOriginAssets({ html: fetched.html, baseUrl: fetched.url });
    const assetCandidates = assetSelection.assets;
    const manifestUrl = extractSameOriginManifest({ html: fetched.html, baseUrl: fetched.url });
    const requiredOrigin = new URL(fetched.url).origin;
    const [assetResults, manifestResult] = await Promise.all([
      Promise.allSettled(assetCandidates.map(async (asset) => ({
        ...asset,
        ...await fetchPublicAsset(asset, requiredOrigin, signal)
      }))),
      manifestUrl ? fetchPublicManifest(new URL(manifestUrl), requiredOrigin, signal).catch(() => null) : Promise.resolve(null)
    ]);
    signal.throwIfAborted();
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
    const evidenceCoverage = describeEvidenceCoverage({
      assetCandidates: assetCandidates.length,
      discoveredAssets: assetSelection.discovered.total,
      fetchedAssets: fetchedAssets.length,
      truncatedAssets: analysis.metrics.truncatedAssets,
      manifestLinked: Boolean(manifestUrl),
      manifestFetched: Boolean(manifestResult)
    });
    if (evidenceCoverage.level === "limited") throw new Error("Auswertungsbreite unzureichend für einen belastbaren Score.");
    const payload = {
      apiVersion: SCAN_API_VERSION,
      ok: true,
      requestId,
      requestedUrl: inputUrl.toString(),
      resolvedUrl: fetched.url,
      httpStatus: fetched.status,
      analyzedAt: new Date().toISOString(),
      assetScan: {
        discovered: assetSelection.discovered.total,
        selected: assetSelection.selected.total,
        ignoredByCap: assetSelection.ignoredByCap,
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
        raises: scoreContributions.filter((item) => item.summaryVisible && item.direction === "raises").slice(0, 5),
        lowers: scoreContributions.filter((item) => item.summaryVisible && item.direction === "lowers").slice(0, 4),
        unit: "relative-logit-contribution",
        baseLogit: candidateModel.intercept
      },
      evidenceCoverage,
      security,
      recommendations,
      model: {
        version: release.model.version,
        releaseStatus: release.status,
        independentHoldout: release.confirmation.total,
        successfulHoldoutScans: release.confirmation.successful,
        technicalCoverage: release.confirmation.coverage,
        precision: release.confirmation.precision,
        recall: release.confirmation.recall,
        f1: release.confirmation.f1
      },
      ...analysis,
      warning: "Der 0–100-Index misst unkalibrierte Ähnlichkeit mit dem validierten Korpus. Er ist keine AI-Wahrscheinlichkeit, kein Prozentanteil AI-generierten Codes und kein Beweis für Autorenschaft."
    };
    console.info(JSON.stringify({ event: "scan_completed", requestId, durationMs: Date.now() - startedAt, htmlBytes: fetched.htmlBytes, assetBytes: analysis.metrics.assetBytes, redirectsAllowed: MAX_REDIRECTS, outcome: "success", modelVersion: release.model.version }));
    return Response.json(payload, { headers: responseHeaders });
  } catch (error) {
    const technicalOutcome = classifyScanError(error);
    console.warn(JSON.stringify({ event: "scan_failed", requestId, durationMs: Date.now() - startedAt, outcome: technicalOutcome.code, retryable: technicalOutcome.retryable }));
    return Response.json({ apiVersion: SCAN_API_VERSION, ok: false, requestId, technicalOutcome }, { status: technicalOutcome.responseStatus, headers: responseHeaders });
  }
}
