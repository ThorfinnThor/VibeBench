export const LOCAL_SCAN_HISTORY_KEY = "vibefootprint-local-scan-history-v1";
export const LOCAL_SCAN_HISTORY_LIMIT_PER_HOST = 3;

const categoryIds = ["security", "design", "engineering", "accessibility", "content"];

function validScore(value) {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

function hostname(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function toLocalScanSnapshot(result) {
  const host = hostname(result?.resolvedUrl);
  if (!result?.ok || !host || !validScore(result?.vibeScore?.score) || !validScore(result?.security?.score) || Number.isNaN(Date.parse(result?.analyzedAt))) return null;
  const categories = Object.fromEntries(categoryIds.map((id) => {
    const item = result.categoryOverview?.find((entry) => entry.id === id);
    return [id, Number.isInteger(item?.issueCount) && item.issueCount >= 0 ? item.issueCount : 0];
  }));
  return {
    id: typeof result.requestId === "string" && result.requestId ? result.requestId : `${host}:${result.analyzedAt}`,
    host,
    analyzedAt: result.analyzedAt,
    footprint: result.vibeScore.score,
    security: result.security.score,
    evidenceBreadth: ["broad", "standard", "limited"].includes(result.evidenceCoverage?.level) ? result.evidenceCoverage.level : "standard",
    categories
  };
}

export function parseLocalScanHistory(serialized) {
  if (!serialized) return [];
  try {
    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => entry && typeof entry.id === "string" && typeof entry.host === "string" && !Number.isNaN(Date.parse(entry.analyzedAt)) && validScore(entry.footprint) && validScore(entry.security) && categoryIds.every((id) => Number.isInteger(entry.categories?.[id]) && entry.categories[id] >= 0));
  } catch {
    return [];
  }
}

export function recordLocalScan(history, snapshot, limit = LOCAL_SCAN_HISTORY_LIMIT_PER_HOST) {
  if (!snapshot || !Number.isInteger(limit) || limit < 1) return Array.isArray(history) ? history : [];
  const withoutDuplicate = (Array.isArray(history) ? history : []).filter((entry) => entry.id !== snapshot.id);
  const sameHost = [snapshot, ...withoutDuplicate.filter((entry) => entry.host === snapshot.host)]
    .sort((left, right) => Date.parse(right.analyzedAt) - Date.parse(left.analyzedAt))
    .slice(0, limit);
  return [...withoutDuplicate.filter((entry) => entry.host !== snapshot.host), ...sameHost]
    .sort((left, right) => Date.parse(right.analyzedAt) - Date.parse(left.analyzedAt));
}

export function previousLocalScan(history, snapshot) {
  if (!snapshot) return null;
  return (Array.isArray(history) ? history : [])
    .filter((entry) => entry.host === snapshot.host && entry.id !== snapshot.id && Date.parse(entry.analyzedAt) <= Date.parse(snapshot.analyzedAt))
    .sort((left, right) => Date.parse(right.analyzedAt) - Date.parse(left.analyzedAt))[0] || null;
}

export function clearLocalScanHost(history, host) {
  return (Array.isArray(history) ? history : []).filter((entry) => entry.host !== host);
}

export function compareLocalScans(current, previous) {
  if (!current || !previous || current.host !== previous.host) return null;
  const currentIssues = categoryIds.reduce((sum, id) => sum + current.categories[id], 0);
  const previousIssues = categoryIds.reduce((sum, id) => sum + previous.categories[id], 0);
  return {
    footprintChange: current.footprint - previous.footprint,
    securityChange: current.security - previous.security,
    observedIssueChange: currentIssues - previousIssues,
    previousAnalyzedAt: previous.analyzedAt,
    sameEvidenceBreadth: current.evidenceBreadth === previous.evidenceBreadth
  };
}
