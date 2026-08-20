import { randomUUID } from "node:crypto";
import { ADMIN_PREVIEW_HEADER, adminPreviewAuthorization, buildAdminReport } from "../../../lib/admin-report.mjs";
import { analyzeHtml, analyzeManifest } from "../../../lib/analyze-html.mjs";
import { readLimitedText } from "../../../lib/bounded-response.mjs";
import { buildV03FeatureMap, scoreV03 } from "../../../lib/development-v0_3-candidate.mjs";
import { extractSameOriginManifest, selectSameOriginAssets } from "../../../lib/extract-assets.mjs";
import { describeEvidenceCoverage } from "../../../lib/evidence-coverage.mjs";
import { pinnedPublicFetch } from "../../../lib/pinned-public-fetch.mjs";
import { collectPortablePageMetrics } from "../../../lib/portable-page-metrics.mjs";
import { buildPublicCategoryOverview, summarizeSecurityChecks } from "../../../lib/public-report-summary.mjs";
import { normalizePublicUrl } from "../../../lib/public-url-policy.mjs";
import {
  auditSecurity,
  buildRecommendations,
  collectProductionExtendedMetrics,
  getScoreBand
} from "../../../lib/production-v0_4-features.mjs";
import { classifyScanError } from "../../../lib/result-presentation.mjs";
import { publicReportAccess, REPORT_ACCESS_MODE, resolveReportAccessMode } from "../../../lib/report-access-mode.mjs";
import { acquireRedirectTargetAdmission, acquireScanAdmission, scanAdmissionIdentity, scanTargetIdentity } from "../../../lib/scan-admission.mjs";
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

function combinedSignal(...signals) {
  return AbortSignal.any(signals.filter(Boolean));
}

async function fetchPublicHtml(initialUrl, signal, reserveTarget) {
  let current = initialUrl;
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    current = normalizePublicUrl(current.toString());
    reserveTarget(current);
    const response = await pinnedPublicFetch(current, {
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
    const response = await pinnedPublicFetch(current, {
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
  const responseHeaders = { "x-vibebench-request-id": requestId, "x-vibebench-api-version": SCAN_API_VERSION, "cache-control": "private, no-store, max-age=0" };
  let releaseAdmission = () => {};
  const releaseRedirectAdmissions = [];
  try {
    const reportMode = resolveReportAccessMode(process.env.VIBEFOOTPRINT_REPORT_MODE);
    const adminAuthorization = adminPreviewAuthorization(request.headers.get(ADMIN_PREVIEW_HEADER), process.env.VIBEFOOTPRINT_ADMIN_PREVIEW_KEY);
    if (adminAuthorization.requested && !adminAuthorization.authorized) {
      console.warn(JSON.stringify({ event: "admin_access_denied", requestId, configured: adminAuthorization.configured }));
      return Response.json({
        apiVersion: SCAN_API_VERSION,
        ok: false,
        requestId,
        technicalOutcome: {
          code: "admin_access_denied",
          title: "Admin-Zugriff abgelehnt",
          summary: "Der geschützte Testzugang konnte nicht autorisiert werden.",
          action: "Zugangsdaten und Serverkonfiguration prüfen.",
          retryable: false
        }
      }, { status: 401, headers: responseHeaders });
    }
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 4_096) throw new Error("Die Scan-Anfrage ist zu groß.");
    let body;
    try {
      const requestBody = await readLimitedText(request, 4_096);
      if (requestBody.truncated) throw new Error("request_too_large");
      body = JSON.parse(requestBody.text);
    } catch {
      throw new Error("Ungültige JSON-Anfrage.");
    }
    const inputUrl = normalizePublicUrl(assertScanRequestBody(body));
    const initialTargetId = scanTargetIdentity(inputUrl);
    const reservedTargetIds = new Set([initialTargetId]);
    releaseAdmission = acquireScanAdmission({ clientId: scanAdmissionIdentity(request), targetId: initialTargetId });
    const reserveTarget = (targetUrl) => {
      const targetId = scanTargetIdentity(targetUrl);
      if (reservedTargetIds.has(targetId)) return;
      releaseRedirectAdmissions.push(acquireRedirectTargetAdmission({ targetId }));
      reservedTargetIds.add(targetId);
    };
    const signal = combinedSignal(request.signal, deadline);
    const fetched = await fetchPublicHtml(inputUrl, signal, reserveTarget);
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
    const similarityRatio = scoreV03(candidateModel, featureMap);
    const score = Math.round(similarityRatio * 100);
    const security = auditSecurity(fetched.url, fetched.headers);
    const recommendations = buildRecommendations({ analysis, pageMetrics, extendedMetrics, security });
    const categoryOverview = buildPublicCategoryOverview({ recommendations, securityChecks: security.checks });
    const evidenceCoverage = describeEvidenceCoverage({
      assetCandidates: assetCandidates.length,
      discoveredAssets: assetSelection.discovered.total,
      fetchedAssets: fetchedAssets.length,
      truncatedAssets: analysis.metrics.truncatedAssets,
      manifestLinked: Boolean(manifestUrl),
      manifestFetched: Boolean(manifestResult)
    });
    if (evidenceCoverage.level === "limited") throw new Error("Auswertungsbreite unzureichend für einen belastbaren Score.");
    const analyzedAt = new Date().toISOString();
    const scoreBand = getScoreBand(score);
    const payload = {
      apiVersion: SCAN_API_VERSION,
      ok: true,
      requestId,
      requestedUrl: inputUrl.toString(),
      resolvedUrl: fetched.url,
      httpStatus: fetched.status,
      analyzedAt,
      vibeScore: {
        score,
        band: scoreBand,
        meaning: "Ähnlichkeit der öffentlich sichtbaren Website-Muster mit dem eingefrorenen VibeFootprint-Referenzkorpus.",
        caveat: "Der Wert misst weder den Anteil generierten Codes noch die Autorenschaft."
      },
      evidenceCoverage,
      security: { score: security.score, counts: summarizeSecurityChecks(security.checks) },
      categoryOverview,
      reportAccess: publicReportAccess(reportMode)
    };
    const fullReportEnabled = reportMode === REPORT_ACCESS_MODE.FREE_TEST || adminAuthorization.authorized;
    if (fullReportEnabled) {
      payload.adminReport = buildAdminReport({
        model: candidateModel,
        features: featureMap,
        score,
        scoreBand,
        security,
        recommendations,
        evidenceCoverage,
        analysis,
        pageMetrics,
        extendedMetrics,
        assetSelection,
        assetCandidates,
        fetchedAssets,
        manifestLinked: Boolean(manifestUrl),
        manifestFetched: Boolean(manifestResult),
        target: fetched.url,
        analyzedAt,
        html: fetched.html,
        headers: fetched.headers
      });
    }
    console.info(JSON.stringify({ event: "scan_completed", requestId, durationMs: Date.now() - startedAt, htmlBytes: fetched.htmlBytes, assetBytes: analysis.metrics.assetBytes, redirectsAllowed: MAX_REDIRECTS, outcome: "success", modelVersion: release.model.version, reportMode, adminPreview: adminAuthorization.authorized }));
    return Response.json(payload, { headers: responseHeaders });
  } catch (error) {
    const technicalOutcome = classifyScanError(error);
    console.warn(JSON.stringify({ event: "scan_failed", requestId, durationMs: Date.now() - startedAt, outcome: technicalOutcome.code, retryable: technicalOutcome.retryable }));
    return Response.json({ apiVersion: SCAN_API_VERSION, ok: false, requestId, technicalOutcome }, { status: technicalOutcome.responseStatus, headers: responseHeaders });
  } finally {
    releaseRedirectAdmissions.reverse().forEach((release) => release());
    releaseAdmission();
  }
}
