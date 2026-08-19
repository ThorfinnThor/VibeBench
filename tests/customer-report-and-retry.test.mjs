import assert from "node:assert/strict";
import test from "node:test";
import { automaticRetryDelayMs, MAX_CLIENT_SCAN_ATTEMPTS, shouldAutomaticallyRetry } from "../lib/client-scan-retry.mjs";
import { buildCustomerReport, customerReportFilename } from "../lib/customer-report.mjs";

const result = {
  ok: true,
  requestId: "report-123",
  resolvedUrl: "https://example.com/path",
  analyzedAt: "2026-08-19T10:00:00.000Z",
  vibeScore: { score: 66, band: { label: "Medium Vibe-Footprint", summary: "Mixed visible patterns." } },
  security: { score: 78 },
  evidenceCoverage: { label: "Broad" },
  recommendations: [
    { title: "Content Security Policy", why: "No policy found.", action: "Start in report-only mode.", basis: "observed" },
    { title: "Manual design review", why: "Needs human review.", action: "Review three screens.", basis: "guidance" }
  ]
};

test("customer report keeps footprint and security assessments explicitly separate", () => {
  const report = buildCustomerReport(result, "en");
  assert.match(report, /Vibe-Footprint: 66\/100/);
  assert.match(report, /Public security baseline: 78\/100/);
  assert.match(report, /two scores are independent/);
  assert.match(report, /Content Security Policy/);
  assert.doesNotMatch(report, /Manual design review/);
  assert.doesNotMatch(report, /AI probability/i);
  assert.equal(customerReportFilename(result, "en"), "vibefootprint-example.com-2026-08-19-en.md");
});

test("client retries transient outcomes exactly once and never hammers rate limits", () => {
  assert.equal(MAX_CLIENT_SCAN_ATTEMPTS, 2);
  assert.equal(shouldAutomaticallyRetry({ code: "target_timeout", retryable: true }, 1), true);
  assert.equal(shouldAutomaticallyRetry({ code: "target_timeout", retryable: true }, 2), false);
  assert.equal(shouldAutomaticallyRetry({ code: "target_rate_limited", retryable: true }, 1), false);
  assert.equal(shouldAutomaticallyRetry({ code: "invalid_url", retryable: false }, 1), false);
  assert.ok(automaticRetryDelayMs("service_busy") > automaticRetryDelayMs("target_timeout"));
});
