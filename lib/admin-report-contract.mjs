const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value, max = 20_000) => typeof value === "string" && value.length > 0 && value.length <= max;
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const array = (value) => Array.isArray(value);

export function parseAdminReport(value) {
  if (!object(value) || value.schemaVersion !== "admin-report-v1" || !text(value.generatedAt, 64) || Number.isNaN(Date.parse(value.generatedAt)) || !text(value.target, 2_048)) return null;
  if (!object(value.scoreDrivers) || !array(value.scoreDrivers.raises) || !array(value.scoreDrivers.lowers)) return null;
  if (![...value.scoreDrivers.raises, ...value.scoreDrivers.lowers].every((item) => object(item) && text(item.feature) && text(item.label) && text(item.description) && finite(item.contribution) && ["raises", "lowers"].includes(item.direction))) return null;
  if (!array(value.recommendations) || !value.recommendations.every((item) => object(item) && text(item.id) && text(item.title) && text(item.why) && text(item.action) && ["high", "medium", "low"].includes(item.priority))) return null;
  if (!object(value.security) || !finite(value.security.score) || !array(value.security.checks) || !value.security.checks.every((item) => object(item) && text(item.id) && text(item.title) && ["pass", "warn", "fail"].includes(item.status) && text(item.detail) && text(item.action))) return null;
  if (!object(value.fixPacks) || !array(value.fixPacks.en) || !array(value.fixPacks.de)) return null;
  if (!object(value.launchCheck) || !array(value.launchCheck.checks) || !object(value.evidence) || !object(value.boundary)) return null;
  return value;
}
