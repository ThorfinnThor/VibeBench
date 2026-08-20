export const SCAN_API_VERSION = "3";

const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const text = (value, max = 4_000) => typeof value === "string" && value.length > 0 && value.length <= max;
const bounded = (value, min, max) => finite(value) && value >= min && value <= max;
const boolean = (value) => typeof value === "boolean";
const safeHttpUrl = (value) => {
  if (!text(value, 2_048)) return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
};
const arrayOf = (value, predicate) => Array.isArray(value) && value.every(predicate);
const nonNegativeInteger = (value) => Number.isInteger(value) && value >= 0;
const coverageScope = (value) => object(value) && value.html === "fetched" && ["assetsDiscovered", "assetsSelected", "assetCandidates", "assetsFetched", "assetErrors", "truncatedAssets"].every((key) => nonNegativeInteger(value[key])) && value.assetsSelected === value.assetCandidates && value.assetsSelected <= value.assetsDiscovered && boolean(value.manifestLinked) && boolean(value.manifestFetched);
const evidenceCoverage = (value) => object(value) && ["broad", "standard", "limited"].includes(value.level) && text(value.label) && text(value.summary) && value.affectsScore === false && coverageScope(value.scope);
const scoreBand = (value) => object(value) && ["low", "light", "medium", "high", "very-high"].includes(value.id) && text(value.label) && text(value.shortLabel) && text(value.summary);
const securityCounts = (value) => object(value) && ["pass", "review", "missing"].every((key) => nonNegativeInteger(value[key]));
const categoryOverviewItem = (value) => object(value) && ["security", "design", "engineering", "accessibility", "content"].includes(value.id) && nonNegativeInteger(value.issueCount) && ["attention", "review", "no-observed-issue"].includes(value.status);
const reportAccess = (value) => object(value) && (
  (value.status === "locked" && value.previewOnly === true && value.entitlementRequired === true)
  || (value.status === "testing" && value.previewOnly === false && value.entitlementRequired === false)
);
const forbiddenDetailedKeys = ["adminReport", "assetScan", "manifestScan", "scoreDrivers", "recommendations", "model", "directEvidence", "directEvidenceCount", "directBuilderCount", "contextEvidence", "headerEvidence", "manifestEvidence", "stackSignals", "structuralHints", "metrics", "warning"];

export function parseScanPayload(value) {
  if (!object(value) || value.apiVersion !== SCAN_API_VERSION || typeof value.ok !== "boolean") return null;
  if (value.ok) {
    if (!text(value.requestId, 128) || !safeHttpUrl(value.requestedUrl) || !safeHttpUrl(value.resolvedUrl) || !nonNegativeInteger(value.httpStatus) || !text(value.analyzedAt, 64) || Number.isNaN(Date.parse(value.analyzedAt))) return null;
    if (!object(value.vibeScore) || ["probability", "threshold", "aboveValidatedThreshold"].some((key) => key in value.vibeScore) || !bounded(value.vibeScore.score, 0, 100) || !scoreBand(value.vibeScore.band) || !text(value.vibeScore.meaning) || !text(value.vibeScore.caveat)) return null;
    if (!object(value.security) || !bounded(value.security.score, 0, 100) || !securityCounts(value.security.counts)) return null;
    if (value.evidenceCoverage !== undefined && !evidenceCoverage(value.evidenceCoverage)) return null;
    if (!arrayOf(value.categoryOverview, categoryOverviewItem) || value.categoryOverview.length !== 5 || new Set(value.categoryOverview.map((item) => item.id)).size !== 5) return null;
    if (!reportAccess(value.reportAccess)) return null;
    if (forbiddenDetailedKeys.some((key) => key in value)) return null;
  } else {
    if (value.requestId !== undefined && !text(value.requestId, 128)) return null;
    if (!object(value.technicalOutcome) || !text(value.technicalOutcome.code) || !text(value.technicalOutcome.title) || !text(value.technicalOutcome.summary) || !text(value.technicalOutcome.action) || !boolean(value.technicalOutcome.retryable)) return null;
  }
  return value;
}
