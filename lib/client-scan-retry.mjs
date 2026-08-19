const automaticRetryCodes = new Set([
  "service_busy",
  "target_scan_in_progress",
  "target_temporarily_unavailable",
  "target_unavailable",
  "target_timeout",
  "dns_failed",
  "connection_failed",
  "incompatible_response",
  "client_timeout",
  "insufficient_evidence"
]);

export const MAX_CLIENT_SCAN_ATTEMPTS = 2;

export function shouldAutomaticallyRetry(outcome, attempt) {
  return Boolean(
    attempt < MAX_CLIENT_SCAN_ATTEMPTS &&
    outcome?.retryable === true &&
    automaticRetryCodes.has(outcome.code)
  );
}

export function automaticRetryDelayMs(code) {
  return code === "service_busy" || code === "target_scan_in_progress" ? 1_500 : 700;
}
