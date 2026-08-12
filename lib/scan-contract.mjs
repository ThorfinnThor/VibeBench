export const SCAN_API_VERSION = "1";

const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const text = (value) => typeof value === "string" && value.length > 0;
const arrayOf = (value, predicate) => Array.isArray(value) && value.every(predicate);
const driver = (value) => object(value) && text(value.feature) && text(value.description) && finite(value.contribution) && ["raises", "lowers"].includes(value.direction);
const recommendation = (value) => object(value) && text(value.id) && text(value.category) && text(value.title) && text(value.why) && text(value.action) && ["high", "medium", "low"].includes(value.priority) && ["observed", "guidance"].includes(value.basis);
const securityCheck = (value) => object(value) && text(value.id) && text(value.title) && text(value.detail) && text(value.action) && ["pass", "warn", "fail"].includes(value.status);

export function parseScanPayload(value) {
  if (!object(value) || value.apiVersion !== SCAN_API_VERSION || typeof value.ok !== "boolean") return null;
  if (value.ok) {
    if (!object(value.vibeScore) || !finite(value.vibeScore.score) || value.vibeScore.score < 0 || value.vibeScore.score > 100) return null;
    if (!object(value.vibeScore.band) || !text(value.vibeScore.band.label) || !text(value.vibeScore.band.summary)) return null;
    if (!object(value.security) || !finite(value.security.score) || !arrayOf(value.security.checks, securityCheck)) return null;
    if (!object(value.scoreDrivers) || !arrayOf(value.scoreDrivers.raises, driver) || !arrayOf(value.scoreDrivers.lowers, driver)) return null;
    if (!arrayOf(value.recommendations, recommendation)) return null;
  } else {
    if (!object(value.technicalOutcome) || !text(value.technicalOutcome.code) || !text(value.technicalOutcome.title) || typeof value.technicalOutcome.retryable !== "boolean") return null;
  }
  return value;
}
