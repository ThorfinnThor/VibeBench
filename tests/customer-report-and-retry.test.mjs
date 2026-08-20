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
  security: { score: 78, counts: { pass: 4, review: 1, missing: 2 } },
  evidenceCoverage: { label: "Broad" },
  categoryOverview: [
    { id: "security", issueCount: 3, status: "attention" },
    { id: "design", issueCount: 1, status: "review" }
  ]
};

test("customer report keeps footprint and security assessments explicitly separate", () => {
  const report = buildCustomerReport(result, "en");
  assert.match(report, /Vibe-Footprint: 66\/100/);
  assert.match(report, /Public security baseline: 78\/100/);
  assert.match(report, /two scores are independent/);
  assert.match(report, /Category overview/);
  assert.match(report, /security:\*\* 3 observed issues/);
  assert.match(report, /require an unlocked full report/);
  assert.doesNotMatch(report, /Content Security Policy/);
  assert.doesNotMatch(report, /AI probability/i);
  assert.equal(customerReportFilename(result, "en"), "vibefootprint-summary-example.com-2026-08-19-en.md");
});

test("free testing summaries disclose that the full report is included", () => {
  const report = buildCustomerReport({
    ...result,
    reportAccess: { status: "testing", previewOnly: false, entitlementRequired: false }
  }, "en");
  assert.match(report, /complete detailed report is included/i);
  assert.doesNotMatch(report, /require an unlocked full report/i);
});

test("customer report redacts query parameters and fragments", () => {
  const report = buildCustomerReport({ ...result, resolvedUrl: "https://example.com/path?token=secret#private" }, "en");
  assert.match(report, /https:\/\/example\.com\/path/);
  assert.doesNotMatch(report, /token|secret|private/);
});

test("client retries transient outcomes exactly once and never hammers rate limits", () => {
  assert.equal(MAX_CLIENT_SCAN_ATTEMPTS, 2);
  assert.equal(shouldAutomaticallyRetry({ code: "target_timeout", retryable: true }, 1), true);
  assert.equal(shouldAutomaticallyRetry({ code: "target_timeout", retryable: true }, 2), false);
  assert.equal(shouldAutomaticallyRetry({ code: "target_rate_limited", retryable: true }, 1), false);
  assert.equal(shouldAutomaticallyRetry({ code: "invalid_url", retryable: false }, 1), false);
  assert.ok(automaticRetryDelayMs("service_busy") > automaticRetryDelayMs("target_timeout"));
});
