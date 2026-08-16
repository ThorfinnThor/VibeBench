import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outputPath = path.resolve("outputs/development_v0_6_option_b_v5/option_b_v5_development_execution_authorization_v1.json");
const required = [
  ["development_package", "outputs/development_v0_6_option_b_v5/option_b_v5_development_package_v1.freeze.json", "vibebench.option_b.v5_development_package_freeze.v1"],
  ["feature_contract", "outputs/development_v0_6_option_b_v5/option_b_v5_feature_contract_v2.freeze.json", "vibebench.option_b.v5_feature_contract_freeze.v2"],
  ["evaluation_protocol", "outputs/development_v0_6_option_b_v5/option_b_v5_evaluation_protocol_v2.freeze.json", "vibebench.option_b.v5_evaluation_protocol_freeze.v2"],
  ["capture_contract", "outputs/development_v0_6_option_b_v5/option_b_v5_development_capture_contract_v1.json", "vibebench.option_b.capture_contract.v5.development.v1"],
  ["workflow", ".github/workflows/option-b-v5-development-expansion.yml", null],
  ["collector_image", "infra/option-b-v5/Dockerfile.collector", null],
  ["collector_runner", "scripts/run-development-v0_6-option-b-v5-isolated.mjs", null],
  ["capture_finalizer", "scripts/finalize-development-v0_6-option-b-v5-capture.mjs", null],
  ["feature_builder", "scripts/build-development-v0_6-option-b-v5-derived-features.mjs", null],
  ["grouped_evaluator", "scripts/evaluate-development-v0_6-option-b-v5-grouped.mjs", null]
];
const artifacts = {};
for (const [id, relativePath, expectedSchema] of required) {
  const file = path.resolve(relativePath);
  const text = await readFile(file, "utf8");
  const schemaVersion = relativePath.endsWith(".json") ? JSON.parse(text).schema_version : null;
  if (expectedSchema && schemaVersion !== expectedSchema) throw new Error(`${id} schema mismatch.`);
  artifacts[id] = { path: relativePath, sha256: createHash("sha256").update(text).digest("hex"), schema_version: schemaVersion };
}
const output = {
  schema_version: "vibebench.option_b.v5_development_execution_authorization.v1",
  locked_at: "2026-08-16T19:30:00.000Z",
  status: "FROZEN_DEVELOPMENT_CAPTURE_MAY_EXECUTE",
  scope: "200 primary plus 61 pre-registered reserve targets; Development research only",
  gates: {
    capture_may_start: true,
    labels_available_to_collector: false,
    model_performance_may_be_inspected_before_capture_freeze: false,
    group_cv_may_start_after_capture_freeze: true,
    candidate_freeze_may_start_automatically: false,
    independent_confirmation_may_start_automatically: false,
    production_promotion_authorized: false
  },
  artifacts
};
const serialized = `${JSON.stringify(output, null, 2)}\n`;
try {
  await writeFile(outputPath, serialized, { flag: "wx", mode: 0o600 });
} catch (error) {
  if (error?.code !== "EEXIST") throw error;
  if (await readFile(outputPath, "utf8") !== serialized) throw new Error("Frozen Development execution authorization differs from the current implementation.");
}
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), status: output.status, gates: output.gates }, null, 2)}\n`);
