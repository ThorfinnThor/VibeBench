import { track } from "@vercel/analytics/server";

export const SCAN_USAGE_EVENT = "vibefootprint_scan";

export function getDurationBucket(durationMs) {
  if (durationMs < 2_000) return "under_2s";
  if (durationMs < 5_000) return "2_to_5s";
  if (durationMs < 10_000) return "5_to_10s";
  if (durationMs < 18_000) return "10_to_18s";
  return "18s_or_more";
}

export function buildScanUsageProperties({ outcome, durationMs, evidenceBreadth, errorCode, retryable }) {
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

export async function trackScanUsage(input, { request } = {}) {
  if (process.env.VERCEL_ENV !== "production") return false;

  try {
    await track(
      SCAN_USAGE_EVENT,
      buildScanUsageProperties(input),
      request ? { request } : undefined
    );
    return true;
  } catch (error) {
    console.warn(JSON.stringify({
      event: "scan_usage_tracking_failed",
      reason: error instanceof Error ? error.message : "unknown_error"
    }));
    return false;
  }
}
