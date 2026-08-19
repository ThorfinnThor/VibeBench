export const MINIMUM_REPORT_REVEAL_MS = 10_000;
export const REPORT_READY_HOLD_MS = 350;

export function estimatedScanProgress(elapsedMs) {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return 0;
  return Math.min(94, Math.floor((elapsedMs / MINIMUM_REPORT_REVEAL_MS) * 95));
}

export function scanStageIndex(progress, retrying = false) {
  if (retrying) return 1;
  if (progress < 16) return 0;
  if (progress < 35) return 1;
  if (progress < 54) return 2;
  if (progress < 70) return 3;
  if (progress < 88) return 4;
  return 5;
}

export function remainingRevealDelay(startedAt, now = Date.now()) {
  return Math.max(0, MINIMUM_REPORT_REVEAL_MS - Math.max(0, now - startedAt));
}
