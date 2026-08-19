import assert from "node:assert/strict";
import test from "node:test";
import { estimatedScanProgress, MINIMUM_REPORT_REVEAL_MS, remainingRevealDelay, scanStageIndex } from "../lib/scan-progress.mjs";

test("scan progress stays estimated below completion and maps to ordered stages", () => {
  assert.equal(estimatedScanProgress(0), 0);
  assert.equal(estimatedScanProgress(MINIMUM_REPORT_REVEAL_MS), 94);
  assert.equal(estimatedScanProgress(MINIMUM_REPORT_REVEAL_MS * 4), 94);
  assert.deepEqual([0, 20, 40, 60, 80, 94].map((value) => scanStageIndex(value)), [0, 1, 2, 3, 4, 5]);
  assert.equal(scanStageIndex(80, true), 1);
});

test("successful results respect the minimum reveal window without adding excess delay", () => {
  assert.equal(remainingRevealDelay(1_000, 4_000), 7_000);
  assert.equal(remainingRevealDelay(1_000, 12_000), 0);
});
