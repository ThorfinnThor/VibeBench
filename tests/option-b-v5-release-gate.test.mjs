import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

test("valid run 5 remains a frozen Development rejection, not a production candidate", async () => {
  const root = new URL("../outputs/development_v0_6_option_b_v5/run5_2026-08-16/", import.meta.url);
  const names = {
    capture_freeze_sha256: "option_b_v5_development_capture_v1.freeze.json",
    replacement_audit_sha256: "option_b_v5_development_replacement_audit_v1.json",
    derived_features_sha256: "option_b_v5_development_derived_features_v2.json",
    grouped_nested_evaluation_sha256: "option_b_v5_grouped_nested_evaluation_v2.json"
  };
  const record = JSON.parse(await readFile(new URL("post_capture_recovery_record_v1.json", root), "utf8"));
  for (const [key, name] of Object.entries(names)) {
    const text = await readFile(new URL(name, root), "utf8");
    assert.equal(createHash("sha256").update(text).digest("hex"), record.result_artifacts[key]);
  }
  const captureFreeze = JSON.parse(await readFile(new URL(names.capture_freeze_sha256, root), "utf8"));
  const evaluation = JSON.parse(await readFile(new URL(names.grouped_nested_evaluation_sha256, root), "utf8"));
  assert.equal(captureFreeze.status, "DEVELOPMENT_CAPTURE_FROZEN_LABEL_JOIN_AUTHORIZED");
  assert.equal(captureFreeze.collector_promotion_gate.technical_yield_at_least_90_percent, false);
  assert.equal(evaluation.development_gate_passed, false);
  assert.equal(evaluation.candidate_freeze_authorized, false);
  assert.equal(record.decisions.independent_confirmation_authorized, false);
  assert.equal(record.decisions.production_promotion_authorized, false);
});
