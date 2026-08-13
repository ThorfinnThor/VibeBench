import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contractUrl = new URL("../outputs/development_v0_5_option_b_v3/option_b_capture_contract_v3.json", import.meta.url);

test("Option-B v3 capture is label-blind and fails closed before runtime decisions", async () => {
  const contract = JSON.parse(await readFile(contractUrl, "utf8"));
  assert.equal(contract.status, "PREREGISTERED_EXECUTION_BLOCKED_ON_RUNTIME_DECISION");
  assert.deepEqual(contract.collector_blinding.input_fields, ["sample_id", "target_url"]);
  assert.ok(contract.collector_blinding.fields_unavailable_to_collector.includes("label"));
  assert.equal(contract.execution_gate.may_execute_before_all_true, false);
  assert.equal(Object.values(contract.execution_gate).filter((value) => value === false).length, 4);
});

test("Option-B v3 captures layout and style structure without persisting page contents", async () => {
  const contract = JSON.parse(await readFile(contractUrl, "utf8"));
  assert.deepEqual(contract.viewports.map(({ id, width, height }) => ({ id, width, height })), [
    { id: "desktop", width: 1440, height: 900 },
    { id: "mobile", width: 390, height: 844 }
  ]);
  assert.ok(contract.capture_payload.computed_style_properties.includes("font_size_px"));
  assert.ok(contract.capture_payload.computed_style_properties.includes("border_radius_tl_px"));
  assert.ok(contract.capture_payload.repetition.includes("structural_signature_frequency"));
  assert.equal(contract.capture_payload.visual_grid.columns, 12);
  assert.equal(contract.privacy_and_retention.raw_html_persisted, false);
  assert.equal(contract.privacy_and_retention.screenshots_persisted_by_default, false);
  assert.equal(contract.privacy_and_retention.ephemeral_screenshots_destroyed_after_visual_feature_extraction, true);
});

test("Option-B v3 separates acquisition failures and excludes their metadata from models", async () => {
  const contract = JSON.parse(await readFile(contractUrl, "utf8"));
  for (const stage of ["dns_resolution", "tcp_tls_connection", "http_navigation", "dom_readiness", "computed_style_extraction", "visual_structure_extraction", "serialization"]) assert.ok(contract.attempt_stages.includes(stage));
  for (const code of ["dns_unresolved", "tls_certificate_error", "navigation_timeout", "dom_readiness_timeout", "client_or_policy_blocked", "computed_style_extraction_failed", "visual_extraction_failed"]) assert.ok(contract.terminal_outcomes.some((outcome) => outcome.code === code));
  for (const field of ["target_url", "hostname", "origin_hash", "hosting_provider", "provenance_url", "sample_id", "cohort", "collector_outcome", "retry_count"]) assert.ok(contract.prohibited_model_inputs.includes(field));
  assert.equal(contract.success_definition.partial_capture_is_failure, true);
  assert.equal(contract.success_definition.failed_rows_retained_in_coverage_reporting, true);
});
