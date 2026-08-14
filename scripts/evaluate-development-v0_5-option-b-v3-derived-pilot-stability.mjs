import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { OPTION_B_V3_DERIVED_FEATURE_DEFINITIONS } from "../lib/option-b-v3-derived-feature-contract-v1.mjs";
import { assertMinimalPilotPrivacy } from "../lib/option-b-v3-minimal-capture.mjs";

const root = path.resolve("outputs/development_v0_5_option_b_v3");
const matrixPath = path.join(root, "option_b_derived_pilot_feature_matrix_v1.json");
const contractPath = path.join(root, "option_b_derived_feature_contract_v1.json");
const outputPath = path.join(root, "option_b_derived_pilot_stability_v1.json");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const [matrixText, contractText] = await Promise.all([readFile(matrixPath, "utf8"), readFile(contractPath, "utf8")]);
const matrix = JSON.parse(matrixText);
const contract = JSON.parse(contractText);

if (matrix.status !== "LABEL_BLIND_DERIVED_PILOT_MATRIX_BUILT" || matrix.label_join_performed !== false) throw new Error("Expected a label-blind derived pilot matrix");
if (contract.status !== "FROZEN_BEFORE_DERIVED_PILOT_EVALUATION_AND_BEFORE_LABEL_JOIN" || contract.full_batch_approved !== false) throw new Error("Expected the frozen, non-promotional derived feature contract");
if (matrix.contract.frozen_contract_sha256 !== sha256(contractText)) throw new Error("Matrix was not built from the current frozen contract");
if (matrix.contract.feature_count !== OPTION_B_V3_DERIVED_FEATURE_DEFINITIONS.length) throw new Error("Feature definition count mismatch");
if (JSON.stringify(matrix.contract.feature_definitions) !== JSON.stringify(OPTION_B_V3_DERIVED_FEATURE_DEFINITIONS)) throw new Error("Matrix feature definitions differ from the executable contract");
if (!matrix.eligibility_checks?.same_manifest || !matrix.eligibility_checks?.same_runtime || !matrix.eligibility_checks?.unchanged_technical_outcomes) throw new Error("Matrix eligibility checks are incomplete");

const run1 = new Map(matrix.run_1.rows.map((row) => [row.sample_id, row]));
const run2 = new Map(matrix.run_2.rows.map((row) => [row.sample_id, row]));
const sampleIds = [...run1.keys()].sort();
const sameSampleSet = sampleIds.length === run2.size && sampleIds.every((sampleId) => run2.has(sampleId));
if (!sameSampleSet) throw new Error("Pilot runs do not contain the same derived sample set");
for (const row of [...run1.values(), ...run2.values()]) {
  if (JSON.stringify(Object.keys(row.features)) !== JSON.stringify(OPTION_B_V3_DERIVED_FEATURE_DEFINITIONS.map(({ name }) => name))) {
    throw new Error(`Unexpected feature keys for ${row.sample_id}`);
  }
}

const comparisons = sampleIds.map((sampleId) => {
  const first = run1.get(sampleId).features;
  const second = run2.get(sampleId).features;
  const drifts = OPTION_B_V3_DERIVED_FEATURE_DEFINITIONS.map((definition) => {
    const run1Value = first[definition.name];
    const run2Value = second[definition.name];
    if (!Number.isFinite(run1Value) || !Number.isFinite(run2Value)) throw new Error(`Non-finite value for ${sampleId}/${definition.name}`);
    const absoluteDrift = Math.abs(run2Value - run1Value);
    return {
      feature: definition.name,
      run_1: run1Value,
      run_2: run2Value,
      absolute_drift: Math.round(absoluteDrift * 1e8) / 1e8,
      tolerance: definition.drift_tolerance,
      passed: absoluteDrift <= definition.drift_tolerance + Number.EPSILON
    };
  });
  return {
    sample_id: sampleId,
    passed: drifts.every(({ passed }) => passed),
    features_changed: drifts.filter(({ absolute_drift: value }) => value > 0).length,
    maximum_tolerance_fraction: Math.max(...drifts.map(({ absolute_drift: value, tolerance }) => value / tolerance)),
    drifts
  };
});

const featureSummary = OPTION_B_V3_DERIVED_FEATURE_DEFINITIONS.map((definition) => {
  const values = comparisons.map((comparison) => comparison.drifts.find(({ feature }) => feature === definition.name));
  const maximum = values.reduce((best, value, index) => value.absolute_drift > best.value ? { value: value.absolute_drift, sample_id: comparisons[index].sample_id } : best, { value: -1, sample_id: null });
  return {
    feature: definition.name,
    tolerance: definition.drift_tolerance,
    mean_absolute_drift: Math.round(values.reduce((sum, value) => sum + value.absolute_drift, 0) / values.length * 1e8) / 1e8,
    maximum_absolute_drift: maximum.value,
    maximum_drift_sample_id: maximum.sample_id,
    passed: values.every(({ passed }) => passed)
  };
});
const allPassed = comparisons.every(({ passed }) => passed) && featureSummary.every(({ passed }) => passed);
const result = {
  schema_version: "vibebench.option_b.derived_pilot_stability.v1",
  generated_at: new Date().toISOString(),
  status: allPassed ? "DERIVED_FEATURE_STABILITY_GATE_PASSED" : "DERIVED_FEATURE_STABILITY_GATE_FAILED",
  interpretation: allPassed
    ? "All preregistered derived-feature tolerances passed on the five shared successful pilot pages. This establishes pilot repeatability only."
    : "At least one preregistered derived-feature tolerance failed. Do not expand capture without method review.",
  label_join_performed: false,
  predictive_usefulness_evaluated: false,
  full_batch_approved: false,
  gate: {
    samples_compared: sampleIds.length,
    features_per_sample: OPTION_B_V3_DERIVED_FEATURE_DEFINITIONS.length,
    comparisons_performed: sampleIds.length * OPTION_B_V3_DERIVED_FEATURE_DEFINITIONS.length,
    same_sample_set: sameSampleSet,
    no_imputation: true,
    all_within_preregistered_tolerance: allPassed
  },
  source_integrity: {
    matrix_sha256: sha256(matrixText),
    frozen_contract_sha256: sha256(contractText)
  },
  feature_summary: featureSummary,
  sample_summary: comparisons.map(({ sample_id, passed, features_changed, maximum_tolerance_fraction }) => ({
    sample_id,
    passed,
    features_changed,
    maximum_tolerance_fraction: Math.round(maximum_tolerance_fraction * 1e8) / 1e8
  })),
  comparisons
};

assertMinimalPilotPrivacy(result);
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), status: result.status, gate: result.gate, sample_summary: result.sample_summary }, null, 2)}\n`);
if (!allPassed) process.exitCode = 1;
