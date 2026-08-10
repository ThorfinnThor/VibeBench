import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const files = [
  "lib/development-v0_2-candidate.mjs",
  "outputs/development_v0_2/vibebench_development_v0_2_feature_matrix.json",
  "outputs/development_v0_2/vibebench_development_v0_2_candidate_evaluation.json",
  "outputs/development_v0_2/vibebench_development_v0_2_candidate_model.json",
  "outputs/VIBEBENCH_DEVELOPMENT_V0_2_CANDIDATE_80_80_2026-08-10.md"
];
const outputPath = path.resolve("outputs/development_v0_2/vibebench_development_v0_2_candidate.freeze.json");
const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const texts = await Promise.all(files.map((file) => readFile(path.resolve(file), "utf8")));
const matrix = JSON.parse(texts[1]);
const evaluation = JSON.parse(texts[2]);
const model = JSON.parse(texts[3]);
if (matrix.holdout_used !== false || evaluation.holdout_used !== false || model.holdout_used !== false) {
  throw new Error("Cannot freeze a candidate that does not explicitly exclude the completed holdout.");
}
if (evaluation.status !== "DEVELOPMENT_GATE_PASSED" || evaluation.primary_metrics?.precision < 0.8 || evaluation.primary_metrics?.recall < 0.8) {
  throw new Error("Cannot freeze: Development 80/80 gate is not satisfied.");
}
if (evaluation.production_rule_change_authorized !== false || model.production_rule_change_authorized !== false) {
  throw new Error("Cannot freeze: candidate must remain unauthorized for production pending a new holdout.");
}
if (evaluation.matrix_sha256 !== sha256(texts[1]) || model.training_matrix_sha256 !== sha256(texts[1])) {
  throw new Error("Cannot freeze: evaluation or model references a different feature matrix.");
}
const frozen = {
  schema_version: "v0.2-development-candidate-freeze",
  frozen_at: new Date().toISOString(),
  status: "FROZEN_FOR_CONFIRMATION",
  development_gate: {
    precision: evaluation.primary_metrics.precision,
    recall: evaluation.primary_metrics.recall,
    protocol: evaluation.primary_protocol
  },
  constraints: {
    completed_holdout_used: false,
    further_development_tuning_allowed: false,
    production_rule_change_authorized: false,
    new_holdout_required: true
  },
  files: Object.fromEntries(files.map((file, index) => [file, { sha256: sha256(texts[index]) }]))
};
await writeFile(outputPath, `${JSON.stringify(frozen, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), ...frozen }, null, 2)}\n`);
