import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  OPTION_B_V3_DERIVED_FEATURE_DEFINITIONS,
  OPTION_B_V3_DERIVED_FEATURE_NAMES,
  buildOptionBV3DerivedFeatures
} from "../lib/option-b-v3-derived-feature-contract-v1.mjs";
import { assertMinimalPilotPrivacy } from "../lib/option-b-v3-minimal-capture.mjs";
import { assertOptionBV3DerivedPayload } from "../lib/option-b-v3-derived-payload-validation-v1.mjs";

const root = path.resolve("outputs/development_v0_5_option_b_v3");
const sources = {
  run_1_capture: path.join(root, "pilot_run_1", "option_b_local_pilot_capture_v1.json"),
  run_2_capture: path.join(root, "option_b_local_pilot_capture_v1.json"),
  repeat_comparison: path.join(root, "option_b_local_pilot_repeat_comparison_v1.json"),
  frozen_contract: path.join(root, "option_b_derived_feature_contract_v1.json"),
  executable_contract: path.resolve("lib/option-b-v3-derived-feature-contract-v1.mjs")
};
const outputPath = path.join(root, "option_b_derived_pilot_feature_matrix_v1.json");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const loadText = (filePath) => readFile(filePath, "utf8");
const parse = (value) => JSON.parse(value);

const sourceText = Object.fromEntries(await Promise.all(
  Object.entries(sources).map(async ([name, filePath]) => [name, await loadText(filePath)])
));
const run1 = parse(sourceText.run_1_capture);
const run2 = parse(sourceText.run_2_capture);
const comparison = parse(sourceText.repeat_comparison);
const contract = parse(sourceText.frozen_contract);

if (comparison.status !== "REPEAT_COMPARISON_READY_FOR_METHOD_REVIEW") throw new Error("Repeat comparison did not pass its technical gate");
if (!comparison.technical_checks?.same_manifest || !comparison.technical_checks?.same_runtime) throw new Error("Manifest or runtime changed between pilot runs");
if (comparison.technical_outcome_transitions.some(({ changed }) => changed)) throw new Error("Technical outcomes changed between pilot runs");
if (contract.status !== "FROZEN_BEFORE_DERIVED_PILOT_EVALUATION_AND_BEFORE_LABEL_JOIN") throw new Error("Derived feature contract is not frozen");
if (contract.feature_count !== OPTION_B_V3_DERIVED_FEATURE_NAMES.length) throw new Error("Frozen feature count differs from executable feature count");
if (contract.feature_definitions_source_sha256 !== sha256(sourceText.executable_contract)) throw new Error("Executable feature contract differs from the frozen source hash");
if (Object.values(contract.information_boundary).some((value) => value !== false)) throw new Error("Frozen information boundary permits a prohibited source");

const bySample = (capture) => new Map(capture.captures.map((row) => [row.sample_id, row]));
const run1Rows = bySample(run1);
const run2Rows = bySample(run2);
const sharedSampleIds = [...run1Rows.keys()].filter((sampleId) => run2Rows.has(sampleId)).sort();
if (sharedSampleIds.length !== 5) throw new Error(`Expected five shared successful pilot samples, received ${sharedSampleIds.length}`);

const buildRows = (capture, rows) => sharedSampleIds.map((sampleId) => {
  const row = rows.get(sampleId);
  if (row.viewport_id !== "desktop") throw new Error(`Unexpected viewport for ${sampleId}`);
  assertOptionBV3DerivedPayload(row.payload);
  return {
    sample_id: sampleId,
    run_id: capture.run_id,
    viewport_id: row.viewport_id,
    features: buildOptionBV3DerivedFeatures(row.payload)
  };
});

const result = {
  schema_version: "vibebench.option_b.derived_pilot_feature_matrix.v1",
  generated_at: new Date().toISOString(),
  status: "LABEL_BLIND_DERIVED_PILOT_MATRIX_BUILT",
  label_join_performed: false,
  full_batch_approved: false,
  eligibility_checks: {
    repeat_comparison_passed: true,
    same_manifest: true,
    same_runtime: true,
    unchanged_technical_outcomes: true,
    shared_successful_rows: sharedSampleIds.length,
    visible_element_censoring_allowed: false
  },
  contract: {
    version: contract.contract_version,
    frozen_status: contract.status,
    frozen_contract_sha256: sha256(sourceText.frozen_contract),
    executable_sha256: sha256(sourceText.executable_contract),
    feature_count: OPTION_B_V3_DERIVED_FEATURE_NAMES.length,
    feature_names: OPTION_B_V3_DERIVED_FEATURE_NAMES,
    feature_definitions: OPTION_B_V3_DERIVED_FEATURE_DEFINITIONS
  },
  source_integrity: Object.fromEntries(Object.entries(sourceText).map(([name, value]) => [name, { sha256: sha256(value) }])),
  run_1: {
    run_id: run1.run_id,
    generated_at: run1.generated_at,
    rows: buildRows(run1, run1Rows)
  },
  run_2: {
    run_id: run2.run_id,
    generated_at: run2.generated_at,
    rows: buildRows(run2, run2Rows)
  }
};

assertMinimalPilotPrivacy(result);
const serialized = `${JSON.stringify(result, null, 2)}\n`;
if (/https?:\/\//i.test(serialized)) throw new Error("Derived matrix contains a URL literal");
await writeFile(outputPath, serialized);
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), status: result.status, rows_per_run: sharedSampleIds.length, feature_count: OPTION_B_V3_DERIVED_FEATURE_NAMES.length }, null, 2)}\n`);
