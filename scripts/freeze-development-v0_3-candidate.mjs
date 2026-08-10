import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ALL_FEATURES, trainV03 } from "../lib/development-v0_3-candidate.mjs";

const matrixPath = path.resolve("outputs/development_v0_3/vibebench_development_v0_3_feature_matrix.json");
const validationPath = path.resolve("outputs/development_v0_3/vibebench_development_v0_3_candidate_validation.json");
const modelPath = path.resolve("outputs/development_v0_3/vibebench_development_v0_3_candidate_model.json");
const freezePath = path.resolve("outputs/development_v0_3/vibebench_development_v0_3_candidate.freeze.json");
const options = { l2: 10, learning_rate: 0.05, iterations: 800, threshold: 0.44 };
const [matrixText, validationText] = await Promise.all([matrixPath, validationPath].map((file) => readFile(file, "utf8")));
const matrix = JSON.parse(matrixText);
const validation = JSON.parse(validationText);
if (matrix.failed_confirmation_used !== false || validation.status !== "DEVELOPMENT_STABILITY_GATE_PASSED" || validation.best?.threshold !== options.threshold) {
  throw new Error("Refusing to freeze a candidate without the leakage-safe Development stability gate.");
}
const model = {
  ...trainV03(matrix.rows, ALL_FEATURES, options),
  trained_at: new Date().toISOString(),
  status: "FROZEN_CANDIDATE_NOT_FOR_PRODUCTION",
  training_rows: matrix.rows.length,
  training_labels: { AI: matrix.rows.filter((row) => row.target === 1).length, HUMAN: matrix.rows.filter((row) => row.target === 0).length },
  development_validation: {
    assignments: validation.best.assignments,
    assignments_meeting_80_80: validation.best.assignments_meeting_80_80,
    precision: validation.best.precision,
    recall: validation.best.recall
  },
  failed_confirmation_used: false,
  production_rule_change_authorized: false,
  independent_confirmation_required: true
};
await writeFile(modelPath, `${JSON.stringify(model, null, 2)}\n`, "utf8");
const files = [
  "outputs/development_v0_3/vibebench_development_v0_3_feature_matrix.json",
  "outputs/development_v0_3/vibebench_development_v0_3_candidate_validation.json",
  "outputs/development_v0_3/vibebench_development_v0_3_candidate_model.json",
  "lib/development-v0_3-candidate.mjs",
  "lib/development-v0_3-page-scan.mjs",
  "lib/analyze-html.mjs",
  "lib/extract-assets.mjs",
  "lib/portable-page-metrics.mjs"
];
const artifacts = [];
for (const file of files) {
  const bytes = await readFile(path.resolve(file));
  artifacts.push({ path: file, bytes: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex") });
}
const frozen = {
  schema_version: "v0.3-development-candidate-freeze",
  frozen_at: new Date().toISOString(),
  status: "FROZEN_UNCONFIRMED",
  rule: options,
  features: ALL_FEATURES,
  training_rows: 188,
  failed_confirmation_used: false,
  further_development_changes_require_new_candidate_version: true,
  artifacts
};
await writeFile(freezePath, `${JSON.stringify(frozen, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ model: path.relative(process.cwd(), modelPath), freeze: path.relative(process.cwd(), freezePath), status: frozen.status, rule: frozen.rule, validation: model.development_validation }, null, 2)}\n`);
