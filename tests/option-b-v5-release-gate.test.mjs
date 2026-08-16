import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { selectFrozenCandidateConfiguration } from "../lib/option-b-v5-candidate-freeze.mjs";

test("v5 release gate is smoke-only and retains two fixed viewports", async () => {
  const contract = JSON.parse(await readFile(new URL("../outputs/development_v0_6_option_b_v5/option_b_capture_contract_v5.json", import.meta.url), "utf8"));
  assert.equal(contract.status, "ISOLATED_SIX_SITE_SMOKE_ONLY");
  assert.deepEqual(contract.budgets, { navigation_timeout_ms: 18000, readiness_timeout_ms: 14000, extraction_timeout_ms: 12000, attempts_per_viewport: 2, maximum_visible_elements: 2000, maximum_dom_depth: 80, maximum_same_origin_stylesheets: 8, maximum_stylesheet_bytes_each: 300000, maximum_total_stylesheet_bytes: 1500000 });
  assert.deepEqual(contract.viewports.map(({ id, width, height }) => ({ id, width, height })), [{ id: "desktop", width: 1440, height: 900 }, { id: "mobile", width: 390, height: 844 }]);
  assert.equal(contract.retry_policy.fresh_context_per_retry, true);
  assert.equal(contract.retry_policy.no_access_control_evasion, true);
});

test("candidate configuration selection is predeclared and deterministic", () => {
  const configurations = [{ id: "a" }, { id: "b" }];
  const audit = [
    { selected_by_inner_cv: { configuration_id: "b", threshold: 0.55 } },
    { selected_by_inner_cv: { configuration_id: "a", threshold: 0.4 } },
    { selected_by_inner_cv: { configuration_id: "b", threshold: 0.5 } },
    { selected_by_inner_cv: { configuration_id: "b", threshold: 0.6 } }
  ];
  const selected = selectFrozenCandidateConfiguration(audit, configurations);
  assert.equal(selected.configuration.id, "b");
  assert.equal(selected.threshold, 0.55);
  assert.equal(selected.selection_count, 3);
});

test("candidate-freeze protocol cannot authorize itself or production", async () => {
  const protocol = JSON.parse(await readFile(new URL("../outputs/development_v0_6_option_b_v5/option_b_v5_candidate_freeze_protocol_v2.json", import.meta.url), "utf8"));
  assert.equal(protocol.status, "CANDIDATE_FREEZE_ALGORITHM_AND_MULTI_RUN_GATE_PREDECLARED_NOT_AUTHORIZED");
  assert.equal(protocol.prerequisites.frozen_development_runs_minimum, 2);
  assert.equal(protocol.safeguards.automatic_execution, false);
  assert.equal(protocol.safeguards.production_promotion_authorized, false);
});

test("Development execution is separately authorized without authorizing candidate or production promotion", async () => {
  const authorization = JSON.parse(await readFile(new URL("../outputs/development_v0_6_option_b_v5/option_b_v5_development_execution_authorization_v4.json", import.meta.url), "utf8"));
  assert.equal(authorization.schema_version, "vibebench.option_b.v5_development_execution_authorization.v4");
  assert.equal(authorization.status, "FROZEN_DEVELOPMENT_CAPTURE_MAY_EXECUTE");
  assert.equal(authorization.gates.capture_may_start, true);
  assert.equal(authorization.gates.labels_available_to_collector, false);
  assert.equal(authorization.gates.candidate_freeze_may_start_automatically, false);
  assert.equal(authorization.gates.production_promotion_authorized, false);
});
