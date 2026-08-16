import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { OPTION_B_V5_DERIVED_FEATURES, OPTION_B_V5_DERIVED_FEATURE_SCHEMA } from "../lib/option-b-v5-derived-feature-contract.mjs";
import { nestedGroupedEvaluation } from "../lib/option-b-v5-grouped-evaluation.mjs";

const argument = (name, fallback) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; };
const featurePath = path.resolve(argument("--features", "outputs/development_v0_6_option_b_v5/option_b_v5_development_derived_features_v2.json"));
const registryPath = path.resolve(argument("--registry", "outputs/development_v0_6_option_b_v5/option_b_v5_development_evaluation_registry_v1.json"));
const captureFreezePath = path.resolve(argument("--capture-freeze", "outputs/development_v0_6_option_b_v5/option_b_v5_development_capture_v1.freeze.json"));
const featureFreezePath = path.resolve(argument("--feature-freeze", "outputs/development_v0_6_option_b_v5/option_b_v5_feature_contract_v2.freeze.json"));
const evaluationFreezePath = path.resolve(argument("--evaluation-freeze", "outputs/development_v0_6_option_b_v5/option_b_v5_evaluation_protocol_v2.freeze.json"));
const outputPath = path.resolve(argument("--output", "outputs/development_v0_6_option_b_v5/option_b_v5_grouped_nested_evaluation_v2.json"));
const minimumRows = Number(argument("--minimum-rows", "200"));
const inputs = await Promise.all([featurePath, registryPath, captureFreezePath, featureFreezePath, evaluationFreezePath].map(async (file) => {
  const text = await readFile(file, "utf8");
  return { file, text, value: JSON.parse(text), sha256: createHash("sha256").update(text).digest("hex") };
}));
const [featureInput, registryInput, captureFreezeInput, featureFreezeInput] = inputs;
const features = featureInput.value;
const registry = registryInput.value;
const captureFreeze = captureFreezeInput.value;
const featureFreeze = featureFreezeInput.value;
const evaluationFreeze = inputs[4].value;
if (captureFreeze.status !== "DEVELOPMENT_CAPTURE_FROZEN_LABEL_JOIN_AUTHORIZED") throw new Error("Labels may be joined only after the Development capture is frozen.");
if (featureFreeze.status !== "FEATURE_CONTRACT_V2_FROZEN_FOR_DEVELOPMENT_CAPTURE" || featureFreeze.contract?.schema_version !== OPTION_B_V5_DERIVED_FEATURE_SCHEMA) throw new Error("Feature Contract v2 freeze mismatch.");
if (evaluationFreeze.status !== "GROUPED_NESTED_EVALUATION_AUTHORIZED_AFTER_CAPTURE_FREEZE" || evaluationFreeze.prerequisites?.target_group !== "project_family_id") throw new Error("Grouped nested evaluation protocol is not frozen.");
if (features.schema_version !== "vibebench.option_b.v5_derived_features.v2" || features.contract?.schema_version !== OPTION_B_V5_DERIVED_FEATURE_SCHEMA) throw new Error("Derived feature artifact does not use Feature Contract v2.");
if (features.contract.feature_names.join("\0") !== OPTION_B_V5_DERIVED_FEATURES.join("\0")) throw new Error("Derived feature names differ from the in-repository freeze.");
const registryById = new Map(registry.rows.map((row) => [row.sample_id, row]));
const rows = features.rows.map((row) => {
  const metadata = registryById.get(row.sample_id);
  if (!metadata) throw new Error(`No frozen evaluation metadata for ${row.sample_id}.`);
  return { sample_id: row.sample_id, target: metadata.target, label: metadata.label, target_group: metadata.target_group, cohort: metadata.cohort, builder_group: metadata.builder_group, project_family_id: metadata.project_family_id, features: row.features };
});
if (rows.length < minimumRows) throw new Error(`Grouped nested evaluation requires at least ${minimumRows} frozen successful paired captures; found ${rows.length}.`);
if (new Set(rows.map(({ sample_id }) => sample_id)).size !== rows.length) throw new Error("Duplicate rows in v5 derived features.");
if (rows.some(({ target_group, project_family_id }) => target_group !== project_family_id)) throw new Error("target_group must equal project_family_id for v5 evaluation.");
const evaluation = nestedGroupedEvaluation(rows, OPTION_B_V5_DERIVED_FEATURES);
const output = {
  schema_version: "vibebench.option_b.v5_grouped_nested_evaluation.v2",
  generated_at: new Date().toISOString(),
  status: "DEVELOPMENT_RESEARCH_ONLY",
  interpretation: "Scores orient public-surface similarity to this frozen Development benchmark. They are not calibrated authorship probabilities and do not authorize a production claim.",
  inputs: Object.fromEntries(inputs.map(({ file, sha256, value }, index) => [["features", "evaluation_registry", "capture_freeze", "feature_freeze", "evaluation_freeze"][index], { path: path.relative(process.cwd(), file), sha256, schema_version: value.schema_version }])),
  rows: { total: rows.length, target_0: rows.filter(({ target }) => target === 0).length, target_1: rows.filter(({ target }) => target === 1).length, unique_target_groups: new Set(rows.map(({ target_group }) => target_group)).size },
  ...evaluation
};
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, { flag: "wx", mode: 0o600 });
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), rows: output.rows, metrics: output.metrics, development_gate_passed: output.development_gate_passed, candidate_freeze_authorized: output.candidate_freeze_authorized }, null, 2)}\n`);
