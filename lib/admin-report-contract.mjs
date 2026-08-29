const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value, max = 20_000) => typeof value === "string" && value.length > 0 && value.length <= max;
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const array = (value) => Array.isArray(value);
const exactKeys = (value, keys) => object(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const score = (value) => Number.isInteger(value) && value >= 0 && value <= 100;
const safeUrl = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
  } catch { return false; }
};
const forbiddenRawKey = /^(?:raw(?:html|source|text|body)?|source(?:html|text|body)|responsebody)$/i;

function containsForbiddenRawField(value, seen = new Set()) {
  if (!object(value) && !array(value)) return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (array(value)) return value.some((item) => containsForbiddenRawField(item, seen));
  return Object.entries(value).some(([key, item]) => forbiddenRawKey.test(key) || containsForbiddenRawField(item, seen));
}

export function parseAdminReport(value) {
  const topKeys = ["schemaVersion", "generatedAt", "target", "summary", "scoreDrivers", "recommendations", "security", "fixPacks", "launchCheck", "evidence", "boundary"];
  if (!exactKeys(value, topKeys) || containsForbiddenRawField(value) || value.schemaVersion !== "admin-report-v1" || !text(value.generatedAt, 64) || Number.isNaN(Date.parse(value.generatedAt)) || !text(value.target, 2_048) || !safeUrl(value.target)) return null;
  if (!exactKeys(value.summary, ["vibeScore", "securityScore", "evidenceCoverage"]) || !object(value.summary.vibeScore) || !score(value.summary.vibeScore.score) || !object(value.summary.vibeScore.band) || !score(value.summary.securityScore) || !object(value.summary.evidenceCoverage)) return null;
  if (!object(value.scoreDrivers) || !array(value.scoreDrivers.raises) || !array(value.scoreDrivers.lowers)) return null;
  if (![...value.scoreDrivers.raises, ...value.scoreDrivers.lowers].every((item) => object(item) && text(item.feature) && text(item.label) && text(item.description) && finite(item.contribution) && ["raises", "lowers"].includes(item.direction))) return null;
  if (!array(value.recommendations) || !value.recommendations.every((item) => object(item) && text(item.id) && text(item.title) && text(item.why) && text(item.action) && ["high", "medium", "low"].includes(item.priority))) return null;
  if (!exactKeys(value.security, ["score", "checks"]) || !score(value.security.score) || !array(value.security.checks) || !value.security.checks.every((item) => exactKeys(item, ["id", "title", "status", "detail", "action"]) && text(item.id) && text(item.title) && ["pass", "warn", "fail"].includes(item.status) && text(item.detail) && text(item.action))) return null;
  if (!object(value.fixPacks) || !array(value.fixPacks.en) || !array(value.fixPacks.de)) return null;
  if (![...value.fixPacks.en, ...value.fixPacks.de].every((item) => exactKeys(item, ["id", "taxonomy", "title", "category", "priority", "prompt"]) && text(item.id) && text(item.taxonomy) && text(item.title) && ["security", "design", "engineering", "accessibility", "content"].includes(item.category) && ["high", "medium", "low"].includes(item.priority) && text(item.prompt))) return null;
  if (!exactKeys(value.launchCheck, ["status", "counts", "checks", "affectsScores", "boundary"]) || !["pass", "review", "attention"].includes(value.launchCheck.status) || value.launchCheck.affectsScores !== false || !array(value.launchCheck.checks)) return null;
  if (!exactKeys(value.evidence, ["directEvidence", "contextEvidence", "headerEvidence", "manifestEvidence", "stackSignals", "structuralHints", "scanMetrics", "pageMetrics", "extendedMetrics", "assetScan", "manifestScan"])) return null;
  if (!["directEvidence", "contextEvidence", "headerEvidence", "manifestEvidence", "stackSignals", "structuralHints"].every((key) => array(value.evidence[key]))) return null;
  if (!["scanMetrics", "pageMetrics", "extendedMetrics"].every((key) => object(value.evidence[key]))) return null;
  if (!exactKeys(value.evidence.assetScan, ["discovered", "selected", "fetched", "failed"]) || !Object.values(value.evidence.assetScan).every((item) => Number.isInteger(item) && item >= 0)) return null;
  if (!exactKeys(value.evidence.manifestScan, ["linked", "fetched"]) || typeof value.evidence.manifestScan.linked !== "boolean" || typeof value.evidence.manifestScan.fetched !== "boolean") return null;
  if (!exactKeys(value.boundary, ["source", "rawSourceIncluded", "affectsAuthorship", "note"]) || !text(value.boundary.source) || value.boundary.rawSourceIncluded !== false || value.boundary.affectsAuthorship !== false || !text(value.boundary.note)) return null;
  return value;
}
