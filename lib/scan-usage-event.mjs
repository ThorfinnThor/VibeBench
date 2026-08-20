export const SCAN_USAGE_EVENT = "vibefootprint_scan";

export function getDurationBucket(durationMs) {
  if (durationMs < 2_000) return "under_2s";
  if (durationMs < 5_000) return "2_to_5s";
  if (durationMs < 10_000) return "5_to_10s";
  if (durationMs < 18_000) return "10_to_18s";
  return "18s_or_more";
}

/**
 * @param {{ outcome: string; durationMs: number; evidenceBreadth?: string; errorCode?: string; retryable?: boolean }} input
 */
export function buildScanUsageProperties(input) {
  const { outcome, durationMs, evidenceBreadth, errorCode, retryable = false } = input;
  /** @type {Record<string, string | boolean>} */
  const properties = {
    outcome: outcome === "success" ? "success" : "failed",
    duration: getDurationBucket(Math.max(0, Number(durationMs) || 0))
  };

  if (properties.outcome === "success") {
    properties.evidence_breadth = evidenceBreadth || "unknown";
  } else {
    properties.error_code = errorCode || "unknown_error";
    properties.retryable = Boolean(retryable);
  }

  return properties;
}
