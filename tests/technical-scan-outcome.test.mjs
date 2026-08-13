import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { classifyTechnicalScanOutcome } from "../lib/technical-scan-outcome.mjs";

test("classifies retained browser errors without inventing timeout causes", () => {
  assert.equal(classifyTechnicalScanOutcome({ ok: false, error: "Error: navigation_timeout" }).code, "navigation_timeout_unresolved");
  assert.equal(classifyTechnicalScanOutcome({ ok: false, error: "net::ERR_NAME_NOT_RESOLVED" }).code, "dns_unresolved");
  assert.equal(classifyTechnicalScanOutcome({ ok: false, error: "net::ERR_CERT_COMMON_NAME_INVALID" }).code, "certificate_error");
  assert.equal(classifyTechnicalScanOutcome({ ok: false, error: "net::ERR_BLOCKED_BY_CLIENT" }).code, "client_blocked");
  assert.equal(classifyTechnicalScanOutcome({ ok: true }).code, "success");
});

test("technical-yield audit is bound to the frozen 169-row source", async () => {
  const base = new URL("../outputs/development_v0_5_option_b/", import.meta.url);
  const [auditText, sourceText] = await Promise.all([
    readFile(new URL("option_b_technical_yield_audit_v1.json", base), "utf8"),
    readFile(new URL("option_b_browser_surface_matrix_v1.json", base), "utf8")
  ]);
  const audit = JSON.parse(auditText);
  assert.equal(audit.status, "FROZEN_HISTORICAL_AUDIT_NO_RESCAN");
  assert.equal(audit.input.sha256, createHash("sha256").update(sourceText).digest("hex"));
  assert.deepEqual([audit.overall.attempted, audit.overall.successful, audit.overall.failed], [169, 81, 88]);
  assert.equal(audit.overall.outcomes.find((row) => row.code === "navigation_timeout_unresolved").count, 81);
  assert.equal(audit.rows.length, 169);
  assert.ok(audit.label_yield_gap.absolute_percentage_point_gap > 0);
});
