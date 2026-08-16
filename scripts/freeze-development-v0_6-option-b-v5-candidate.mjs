import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { selectFrozenCandidateConfiguration } from "../lib/option-b-v5-candidate-freeze.mjs";
import { OPTION_B_V5_DERIVED_FEATURES, OPTION_B_V5_DERIVED_FEATURE_SCHEMA } from "../lib/option-b-v5-derived-feature-contract.mjs";
import { OPTION_B_V5_NESTED_PROTOCOL, selectFeaturesInsideTraining, trainOptionBV5Logistic } from "../lib/option-b-v5-grouped-evaluation.mjs";

const argument = (name, fallback) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; };
const featurePath = path.resolve(argument("--features", "outputs/development_v0_6_option_b_v5/option_b_v5_development_derived_features_v2.json"));
const registryPath = path.resolve(argument("--registry", "outputs/development_v0_6_option_b_v5/option_b_v5_development_evaluation_registry_v1.json"));
const evaluationPath = path.resolve(argument("--evaluation", "outputs/development_v0_6_option_b_v5/option_b_v5_grouped_nested_evaluation_v2.json"));
const captureFreezePath = path.resolve(argument("--capture-freeze", "outputs/development_v0_6_option_b_v5/option_b_v5_development_capture_v1.freeze.json"));
const protocolPath = path.resolve(argument("--protocol", "outputs/development_v0_6_option_b_v5/option_b_v5_candidate_freeze_protocol_v1.json"));
const modelPath = path.resolve(argument("--model", "outputs/development_v0_6_option_b_v5/option_b_v5_candidate_model_v1.json"));
const freezePath = path.resolve(argument("--freeze", "outputs/development_v0_6_option_b_v5/option_b_v5_candidate_v1.freeze.json"));
const inputPaths = [featurePath, registryPath, evaluationPath, captureFreezePath, protocolPath];
const inputs = await Promise.all(inputPaths.map(async (file) => {
  const text = await readFile(file, "utf8");
  return { file, text, value: JSON.parse(text), sha256: createHash("sha256").update(text).digest("hex") };
}));
const [featureInput, registryInput, evaluationInput, captureFreezeInput, protocolInput] = inputs;
const features = featureInput.value;
const registry = registryInput.value;
const evaluation = evaluationInput.value;
const captureFreeze = captureFreezeInput.value;
const protocol = protocolInput.value;
if (protocol.status !== "CANDIDATE_FREEZE_ALGORITHM_PREDECLARED_NOT_AUTHORIZED" || protocol.safeguards?.automatic_execution !== false) throw new Error("Candidate freeze protocol is not valid.");
if (features.contract?.schema_version !== OPTION_B_V5_DERIVED_FEATURE_SCHEMA || features.contract.feature_names.join("\0") !== OPTION_B_V5_DERIVED_FEATURES.join("\0")) throw new Error("Candidate features do not match Feature Contract v2.");
const requiredGates = {
  development_gate_passed: evaluation.development_gate_passed === true,
  precision_p10: evaluation.metrics?.precision?.p10 >= 0.9,
  recall_p10: evaluation.metrics?.recall?.p10 >= 0.9,
  precision_median: evaluation.metrics?.precision?.median >= 0.92,
  recall_median: evaluation.metrics?.recall?.median >= 0.92,
  successful_paired_sites: features.rows?.length >= 200,
  collector_technical_yield: captureFreeze.collector_promotion_gate?.technical_yield_at_least_90_percent === true,
  unknown_technical_error: captureFreeze.rates?.unknown_technical_error <= 0.01,
  extraction_failure: captureFreeze.rates?.collector_origin_extraction_failure <= 0.02
};
if (!Object.values(requiredGates).every(Boolean)) throw new Error(`Candidate freeze blocked: ${Object.entries(requiredGates).filter(([, passed]) => !passed).map(([name]) => name).join(", ")}`);
const registryById = new Map(registry.rows.map((row) => [row.sample_id, row]));
const rows = features.rows.map((row) => {
  const metadata = registryById.get(row.sample_id);
  if (!metadata) throw new Error(`Missing candidate metadata for ${row.sample_id}.`);
  return { sample_id: row.sample_id, target: metadata.target, target_group: metadata.target_group, features: row.features };
});
const selected = selectFrozenCandidateConfiguration(evaluation.selection_audit, OPTION_B_V5_NESTED_PROTOCOL.configurations);
const selectedFeatures = selectFeaturesInsideTraining(rows, OPTION_B_V5_DERIVED_FEATURES, selected.configuration.feature_limit);
const model = trainOptionBV5Logistic(rows, selectedFeatures, selected.configuration, OPTION_B_V5_NESTED_PROTOCOL);
const candidate = {
  schema_version: "vibebench.option_b.v5_candidate_model.v1",
  generated_at: new Date().toISOString(),
  status: "FROZEN_RESEARCH_CANDIDATE_AWAITING_INDEPENDENT_CONFIRMATION",
  interpretation: "Public-surface benchmark orientation; not an authorship probability.",
  selection: selected,
  threshold: selected.threshold,
  feature_contract: OPTION_B_V5_DERIVED_FEATURE_SCHEMA,
  training_rows: rows.length,
  model
};
const modelText = `${JSON.stringify(candidate, null, 2)}\n`;
const freeze = {
  schema_version: "vibebench.option_b.v5_candidate_freeze.v1",
  generated_at: new Date().toISOString(),
  status: "CANDIDATE_FROZEN_INDEPENDENT_CONFIRMATION_REQUIRED",
  production_promotion_authorized: false,
  tuning_after_freeze_allowed: false,
  development_gates: requiredGates,
  inputs: Object.fromEntries(inputs.map(({ file, sha256, value }, index) => [["features", "evaluation_registry", "grouped_evaluation", "capture_freeze", "candidate_protocol"][index], { path: path.relative(process.cwd(), file), sha256, schema_version: value.schema_version }])),
  model: { path: path.relative(process.cwd(), modelPath), sha256: createHash("sha256").update(modelText).digest("hex") },
  independent_confirmation: { status: "NOT_RUN", manifest_hash: null, precision: null, recall: null }
};
await writeFile(modelPath, modelText, { flag: "wx", mode: 0o600 });
await writeFile(freezePath, `${JSON.stringify(freeze, null, 2)}\n`, { flag: "wx", mode: 0o600 });
process.stdout.write(`${JSON.stringify({ model: path.relative(process.cwd(), modelPath), freeze: path.relative(process.cwd(), freezePath), status: freeze.status, threshold: selected.threshold, configuration: selected.configuration.id, feature_count: selectedFeatures.length, production_promotion_authorized: false }, null, 2)}\n`);
