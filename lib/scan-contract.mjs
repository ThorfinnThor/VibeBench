export const SCAN_API_VERSION = "2";

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
const driver = (value) => object(value) && text(value.feature) && text(value.label) && text(value.description) && finite(value.contribution) && ["raises", "lowers"].includes(value.direction) && ["detected", "not-detected", "measured"].includes(value.state) && text(value.unit);
const recommendation = (value) => object(value) && text(value.id) && text(value.category) && text(value.title) && text(value.why) && text(value.action) && ["high", "medium", "low"].includes(value.priority) && ["observed", "guidance"].includes(value.basis);
const securityCheck = (value) => object(value) && text(value.id) && text(value.title) && text(value.detail) && text(value.action) && ["pass", "warn", "fail"].includes(value.status);
const nonNegativeInteger = (value) => Number.isInteger(value) && value >= 0;
const coverageScope = (value) => object(value) && value.html === "fetched" && ["assetsDiscovered", "assetsSelected", "assetCandidates", "assetsFetched", "assetErrors", "truncatedAssets"].every((key) => nonNegativeInteger(value[key])) && value.assetsSelected === value.assetCandidates && value.assetsSelected <= value.assetsDiscovered && boolean(value.manifestLinked) && boolean(value.manifestFetched);
const evidenceCoverage = (value) => object(value) && ["broad", "standard", "limited"].includes(value.level) && text(value.label) && text(value.summary) && value.affectsScore === false && coverageScope(value.scope);
const scoreBand = (value) => object(value) && ["low", "light", "medium", "high", "very-high"].includes(value.id) && text(value.label) && text(value.shortLabel) && text(value.summary);
const evidence = (value) => object(value) && text(value.type) && text(value.label) && text(value.strength) && (value.source === undefined || text(value.source)) && (value.marker === undefined || text(value.marker));
const finiteRecord = (value) => object(value) && Object.values(value).every(finite);
const assetScan = (value) => object(value) && ["discovered", "selected", "ignoredByCap", "candidates", "fetched", "errors", "bytes", "truncated"].every((key) => nonNegativeInteger(value[key])) && value.selected === value.candidates && value.discovered === value.selected + value.ignoredByCap && value.fetched <= value.candidates && value.errors <= value.candidates && value.truncated <= value.fetched;
const manifestScan = (value) => object(value) && boolean(value.linked) && boolean(value.fetched) && boolean(value.validJson) && nonNegativeInteger(value.bytes) && boolean(value.truncated);
const model = (value) => object(value) && text(value.version) && text(value.releaseStatus) && nonNegativeInteger(value.independentHoldout) && nonNegativeInteger(value.successfulHoldoutScans) && bounded(value.technicalCoverage, 0, 1) && bounded(value.precision, 0, 1) && bounded(value.recall, 0, 1) && bounded(value.f1, 0, 1) && text(value.confirmationStatus) && typeof value.performanceClaimCurrent === "boolean";

export function parseScanPayload(value) {
  if (!object(value) || value.apiVersion !== SCAN_API_VERSION || typeof value.ok !== "boolean") return null;
  if (value.ok) {
    if (!text(value.requestId, 128) || !safeHttpUrl(value.requestedUrl) || !safeHttpUrl(value.resolvedUrl) || !nonNegativeInteger(value.httpStatus) || !text(value.analyzedAt, 64) || Number.isNaN(Date.parse(value.analyzedAt))) return null;
    if (!object(value.vibeScore) || ["probability", "threshold", "aboveValidatedThreshold"].some((key) => key in value.vibeScore) || !bounded(value.vibeScore.score, 0, 100) || !scoreBand(value.vibeScore.band) || !text(value.vibeScore.meaning) || !text(value.vibeScore.caveat)) return null;
    if (!object(value.security) || !bounded(value.security.score, 0, 100) || !arrayOf(value.security.checks, securityCheck)) return null;
    if (!object(value.scoreDrivers) || !arrayOf(value.scoreDrivers.raises, driver) || !arrayOf(value.scoreDrivers.lowers, driver) || !text(value.scoreDrivers.unit) || !finite(value.scoreDrivers.baseLogit)) return null;
    if (!arrayOf(value.recommendations, recommendation)) return null;
    if (value.evidenceCoverage !== undefined && !evidenceCoverage(value.evidenceCoverage)) return null;
    if (!assetScan(value.assetScan) || !manifestScan(value.manifestScan) || !model(value.model)) return null;
    for (const key of ["directEvidence", "contextEvidence", "headerEvidence", "manifestEvidence"]) if (!arrayOf(value[key], evidence)) return null;
    if (!arrayOf(value.stackSignals, (item) => text(item)) || !arrayOf(value.structuralHints, (item) => text(item)) || !finiteRecord(value.metrics) || !text(value.warning)) return null;
  } else {
    if (value.requestId !== undefined && !text(value.requestId, 128)) return null;
    if (!object(value.technicalOutcome) || !text(value.technicalOutcome.code) || !text(value.technicalOutcome.title) || !text(value.technicalOutcome.summary) || !text(value.technicalOutcome.action) || !boolean(value.technicalOutcome.retryable)) return null;
  }
  return value;
}
