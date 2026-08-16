import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("v5 release gate is smoke-only and retains two fixed viewports", async () => {
  const contract = JSON.parse(await readFile(new URL("../outputs/development_v0_6_option_b_v5/option_b_capture_contract_v5.json", import.meta.url), "utf8"));
  assert.equal(contract.status, "ISOLATED_SIX_SITE_SMOKE_ONLY");
  assert.deepEqual(contract.budgets, { navigation_timeout_ms: 18000, readiness_timeout_ms: 14000, extraction_timeout_ms: 12000, attempts_per_viewport: 2, maximum_visible_elements: 2000, maximum_dom_depth: 80, maximum_same_origin_stylesheets: 8, maximum_stylesheet_bytes_each: 300000, maximum_total_stylesheet_bytes: 1500000 });
  assert.deepEqual(contract.viewports.map(({ id, width, height }) => ({ id, width, height })), [{ id: "desktop", width: 1440, height: 900 }, { id: "mobile", width: 390, height: 844 }]);
  assert.equal(contract.retry_policy.fresh_context_per_retry, true);
  assert.equal(contract.retry_policy.no_access_control_evasion, true);
});

test("Development execution is separately authorized without authorizing candidate or production promotion", async () => {
  const authorization = JSON.parse(await readFile(new URL("../outputs/development_v0_6_option_b_v5/option_b_v5_development_execution_authorization_v1.json", import.meta.url), "utf8"));
  assert.equal(authorization.status, "FROZEN_DEVELOPMENT_CAPTURE_MAY_EXECUTE");
  assert.equal(authorization.gates.capture_may_start, true);
  assert.equal(authorization.gates.labels_available_to_collector, false);
  assert.equal(authorization.gates.candidate_freeze_may_start_automatically, false);
  assert.equal(authorization.gates.production_promotion_authorized, false);
});
