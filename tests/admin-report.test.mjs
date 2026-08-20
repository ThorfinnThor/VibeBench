import assert from "node:assert/strict";
import test from "node:test";
import { adminPreviewAuthorization, buildAdminReport, MIN_ADMIN_PREVIEW_KEY_LENGTH } from "../lib/admin-report.mjs";
import { parseAdminReport } from "../lib/admin-report-contract.mjs";
import { parseScanPayload, SCAN_API_VERSION } from "../lib/scan-contract.mjs";
import candidateModel from "../outputs/development_v0_4/vibebench_development_v0_4_candidate_model.json" with { type: "json" };

const configuredKey = "a".repeat(MIN_ADMIN_PREVIEW_KEY_LENGTH);

test("admin preview requires a sufficiently long matching server-side key", () => {
  assert.deepEqual(adminPreviewAuthorization(null, configuredKey), { requested: false, configured: true, authorized: false });
  assert.deepEqual(adminPreviewAuthorization("wrong", "short"), { requested: true, configured: false, authorized: false });
  assert.equal(adminPreviewAuthorization("wrong", configuredKey).authorized, false);
  assert.equal(adminPreviewAuthorization(configuredKey, configuredKey).authorized, true);
});

test("admin report contains actual protected findings without raw source", () => {
  const features = Object.fromEntries(candidateModel.feature_names.map((name) => [name, 0]));
  const evidenceCoverage = { level: "standard", label: "Standard", summary: "Public HTML analyzed.", affectsScore: false, scope: { html: "fetched", assetsDiscovered: 1, assetsSelected: 1, assetCandidates: 1, assetsFetched: 1, assetErrors: 0, truncatedAssets: 0, manifestLinked: false, manifestFetched: false } };
  const recommendations = [{ id: "VF-SEC-CSP", category: "security", priority: "high", title: "Content Security Policy", why: "Missing.", action: "Add it.", basis: "observed" }];
  const security = { score: 25, checks: [{ id: "csp", title: "Content Security Policy", status: "fail", detail: "Missing.", action: "Add it." }] };
  const report = buildAdminReport({
    model: candidateModel,
    features,
    score: 62,
    scoreBand: { id: "medium", label: "Medium", shortLabel: "Medium", summary: "Mixed." },
    security,
    recommendations,
    evidenceCoverage,
    analysis: { directEvidence: [{ id: "marker" }], contextEvidence: [], headerEvidence: [], manifestEvidence: [], stackSignals: [], structuralHints: [], metrics: { htmlBytes: 120 } },
    pageMetrics: { headings: 2 },
    extendedMetrics: { sections: 1 },
    assetSelection: { discovered: { total: 1 } },
    assetCandidates: [{ url: "https://example.com/app.js" }],
    fetchedAssets: [{ url: "https://example.com/app.js" }],
    manifestLinked: false,
    manifestFetched: false,
    target: "https://example.com/",
    analyzedAt: "2026-08-19T12:00:00.000Z",
    html: "<html lang=\"en\"><head><title>Example</title></head><body><h1>Example</h1></body></html>",
    headers: {}
  });
  assert.equal(parseAdminReport(report), report);
  assert.equal(report.recommendations[0].id, "VF-SEC-CSP");
  assert.equal(report.security.checks[0].status, "fail");
  assert.equal(report.fixPacks.en.length, 1);
  assert.equal(report.launchCheck.checks.length, 8);
  assert.equal("html" in report, false);
  assert.equal(JSON.stringify(report).includes("<html"), false);
  assert.equal(parseAdminReport({ ...report, evidence: { ...report.evidence, rawHtml: "<html>secret</html>" } }), null);
  assert.equal(parseAdminReport({ ...report, boundary: { ...report.boundary, rawSourceIncluded: true } }), null);
  assert.equal(parseAdminReport({ ...report, target: "https://example.com/?token=secret" }), null);
});

test("public response parser remains fail-closed for protected admin reports", () => {
  assert.equal(parseScanPayload({ apiVersion: SCAN_API_VERSION, ok: true, adminReport: {} }), null);
});
