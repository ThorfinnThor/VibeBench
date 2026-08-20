import assert from "node:assert/strict";
import test from "node:test";
import { buildScanUsageProperties, getDurationBucket, SCAN_USAGE_EVENT } from "../lib/scan-usage-event.mjs";

test("uses one stable anonymous event name", () => {
  assert.equal(SCAN_USAGE_EVENT, "vibefootprint_scan");
});

test("builds aggregate-only properties for successful scans", () => {
  assert.deepEqual(buildScanUsageProperties({
    outcome: "success",
    durationMs: 4_200,
    evidenceBreadth: "broad",
    url: "https://example.com/private-path"
  }), {
    outcome: "success",
    duration: "2_to_5s",
    evidence_breadth: "broad"
  });
});

test("records a stable failure category without target data", () => {
  assert.deepEqual(buildScanUsageProperties({
    outcome: "failed",
    durationMs: 18_500,
    errorCode: "target_timeout",
    retryable: true,
    requestedUrl: "https://example.com"
  }), {
    outcome: "failed",
    duration: "18s_or_more",
    error_code: "target_timeout",
    retryable: true
  });
});

test("groups scan duration into low-cardinality buckets", () => {
  assert.equal(getDurationBucket(1_999), "under_2s");
  assert.equal(getDurationBucket(2_000), "2_to_5s");
  assert.equal(getDurationBucket(5_000), "5_to_10s");
  assert.equal(getDurationBucket(10_000), "10_to_18s");
  assert.equal(getDurationBucket(18_000), "18s_or_more");
});
