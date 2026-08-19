import { createHash, timingSafeEqual } from "node:crypto";
import { explainScore } from "./production-v0_4-features.mjs";
import { buildTopFixPack } from "./protected-report-enhancements.mjs";
import { inspectPublicLaunchSurface } from "./public-launch-check.mjs";

export const ADMIN_PREVIEW_HEADER = "x-vibefootprint-admin-preview-key";
export const MIN_ADMIN_PREVIEW_KEY_LENGTH = 24;

function digest(value) {
  return createHash("sha256").update(String(value), "utf8").digest();
}

export function adminPreviewAuthorization(providedKey, configuredKey) {
  const requested = typeof providedKey === "string" && providedKey.length > 0;
  const configured = typeof configuredKey === "string" && configuredKey.length >= MIN_ADMIN_PREVIEW_KEY_LENGTH;
  if (!requested) return { requested: false, configured, authorized: false };
  if (!configured) return { requested: true, configured: false, authorized: false };
  return { requested: true, configured: true, authorized: timingSafeEqual(digest(providedKey), digest(configuredKey)) };
}

export function buildAdminReport({
  model,
  features,
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
  manifestLinked,
  manifestFetched,
  target,
  analyzedAt,
  html,
  headers
}) {
  const drivers = explainScore(model, features).filter((driver) => driver.summaryVisible);
  const scoreDrivers = {
    raises: drivers.filter((driver) => driver.direction === "raises").slice(0, 8),
    lowers: drivers.filter((driver) => driver.direction === "lowers").slice(0, 8)
  };
  const publicContext = "Public HTML, response headers and a bounded selection of same-origin assets.";
  return {
    schemaVersion: "admin-report-v1",
    generatedAt: analyzedAt,
    target,
    summary: {
      vibeScore: { score, band: scoreBand },
      securityScore: security.score,
      evidenceCoverage
    },
    scoreDrivers,
    recommendations,
    security: { score: security.score, checks: security.checks },
    fixPacks: {
      en: buildTopFixPack({ findings: recommendations, target, analyzedAt, evidenceBreadth: evidenceCoverage.level, publicContext, locale: "en" }),
      de: buildTopFixPack({ findings: recommendations, target, analyzedAt, evidenceBreadth: evidenceCoverage.level, publicContext, locale: "de" })
    },
    launchCheck: inspectPublicLaunchSurface({ html, headers }),
    evidence: {
      directEvidence: analysis.directEvidence,
      contextEvidence: analysis.contextEvidence,
      headerEvidence: analysis.headerEvidence,
      manifestEvidence: analysis.manifestEvidence,
      stackSignals: analysis.stackSignals,
      structuralHints: analysis.structuralHints,
      scanMetrics: analysis.metrics,
      pageMetrics,
      extendedMetrics,
      assetScan: {
        discovered: assetSelection.discovered.total,
        selected: assetCandidates.length,
        fetched: fetchedAssets.length,
        failed: assetCandidates.length - fetchedAssets.length
      },
      manifestScan: { linked: manifestLinked, fetched: manifestFetched }
    },
    boundary: {
      source: "Public surface only",
      rawSourceIncluded: false,
      affectsAuthorship: false,
      note: "This protected diagnostic report does not establish code origin, generated-code share, authorship or causality."
    }
  };
}
