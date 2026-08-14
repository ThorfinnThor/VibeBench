import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  OPTION_B_V3_DERIVED_FEATURE_DEFINITIONS,
  OPTION_B_V3_DERIVED_FEATURE_NAMES,
  buildOptionBV3DerivedFeatures
} from "../lib/option-b-v3-derived-feature-contract-v1.mjs";

const capturePath = "outputs/development_v0_5_option_b_v3/pilot_run_1/option_b_local_pilot_capture_v1.json";
const contractPath = "outputs/development_v0_5_option_b_v3/option_b_derived_feature_contract_v1.json";
const executablePath = "lib/option-b-v3-derived-feature-contract-v1.mjs";

test("v3 derived contract is fixed, unique and identity-free", () => {
  assert.equal(OPTION_B_V3_DERIVED_FEATURE_NAMES.length, 42);
  assert.equal(new Set(OPTION_B_V3_DERIVED_FEATURE_NAMES).size, 42);
  assert.deepEqual(OPTION_B_V3_DERIVED_FEATURE_NAMES, OPTION_B_V3_DERIVED_FEATURE_DEFINITIONS.map(({ name }) => name));
  const prohibited = /(?:url|host|label|target|cohort|provenance|builder|signature_hash|outcome|sample_id)/i;
  assert.equal(OPTION_B_V3_DERIVED_FEATURE_NAMES.some((name) => prohibited.test(name)), false);
  assert.equal(OPTION_B_V3_DERIVED_FEATURE_DEFINITIONS.every(({ drift_tolerance }) => [0.05, 0.1].includes(drift_tolerance)), true);
});

test("v3 derived builder produces complete finite aggregates", async () => {
  const capture = JSON.parse(await readFile(capturePath, "utf8"));
  const features = buildOptionBV3DerivedFeatures(capture.captures[0].payload);
  assert.deepEqual(Object.keys(features), OPTION_B_V3_DERIVED_FEATURE_NAMES);
  assert.equal(Object.values(features).every(Number.isFinite), true);
  for (const definition of OPTION_B_V3_DERIVED_FEATURE_DEFINITIONS.filter(({ drift_tolerance }) => drift_tolerance === 0.05)) {
    assert.ok(features[definition.name] >= 0, `${definition.name} must be non-negative`);
    assert.ok(features[definition.name] <= 1, `${definition.name} must be at most one`);
  }
});

test("v3 derived builder rejects element-censored payloads", async () => {
  const capture = JSON.parse(await readFile(capturePath, "utf8"));
  const payload = structuredClone(capture.captures[0].payload);
  payload.document.visible_element_limit_reached = true;
  assert.throws(() => buildOptionBV3DerivedFeatures(payload), /element limit reached/i);
});

test("frozen contract pins the executable and prohibits label access", async () => {
  const [contractText, executable] = await Promise.all([readFile(contractPath, "utf8"), readFile(executablePath, "utf8")]);
  const contract = JSON.parse(contractText);
  assert.equal(contract.status, "FROZEN_BEFORE_DERIVED_PILOT_EVALUATION_AND_BEFORE_LABEL_JOIN");
  assert.equal(contract.feature_count, OPTION_B_V3_DERIVED_FEATURE_NAMES.length);
  assert.equal(contract.feature_definitions_source_sha256, createHash("sha256").update(executable).digest("hex"));
  assert.equal(Object.values(contract.information_boundary).every((value) => value === false), true);
  assert.equal(contract.full_batch_approved, false);
});

test("generated stability artifact remains label-blind and non-promotional", async () => {
  const stability = JSON.parse(await readFile("outputs/development_v0_5_option_b_v3/option_b_derived_pilot_stability_v1.json", "utf8"));
  assert.equal(stability.status, "DERIVED_FEATURE_STABILITY_GATE_PASSED");
  assert.equal(stability.label_join_performed, false);
  assert.equal(stability.predictive_usefulness_evaluated, false);
  assert.equal(stability.full_batch_approved, false);
  assert.equal(stability.gate.samples_compared, 5);
  assert.equal(stability.gate.features_per_sample, 42);
  assert.equal(stability.gate.comparisons_performed, 210);
  assert.equal(stability.gate.all_within_preregistered_tolerance, true);
});
