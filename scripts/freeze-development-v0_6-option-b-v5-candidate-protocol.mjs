import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { OPTION_B_V5_NESTED_PROTOCOL } from "../lib/option-b-v5-grouped-evaluation.mjs";

const outputPath = path.resolve("outputs/development_v0_6_option_b_v5/option_b_v5_candidate_freeze_protocol_v1.json");
const sourcePaths = [
  "lib/option-b-v5-candidate-freeze.mjs",
  "scripts/freeze-development-v0_6-option-b-v5-candidate.mjs",
  "outputs/development_v0_6_option_b_v5/option_b_v5_feature_contract_v2.freeze.json",
  "outputs/development_v0_6_option_b_v5/option_b_v5_evaluation_protocol_v2.freeze.json"
];
const sources = await Promise.all(sourcePaths.map(async (relativePath) => {
  const text = await readFile(path.resolve(relativePath), "utf8");
  return { path: relativePath, sha256: createHash("sha256").update(text).digest("hex"), schema_version: relativePath.endsWith(".json") ? JSON.parse(text).schema_version : null };
}));
const output = {
  schema_version: "vibebench.option_b.v5_candidate_freeze_protocol.v1",
  locked_at: "2026-08-16T19:45:00.000Z",
  status: "CANDIDATE_FREEZE_ALGORITHM_PREDECLARED_NOT_AUTHORIZED",
  prerequisites: {
    development_gate_passed: true,
    collector_primary_technical_yield_minimum: 0.9,
    unknown_technical_error_maximum: 0.01,
    collector_origin_extraction_failure_maximum: 0.02,
    successful_paired_sites_minimum: 200
  },
  selection_rule: "Choose the modal configuration across outer-fold inner-CV selections; break frequency ties lexicographically; use the median inner-selected threshold among folds selecting that configuration; select the frozen feature-limit subset by variance on all Development rows; fit once on all Development rows.",
  allowed_configurations: OPTION_B_V5_NESTED_PROTOCOL.configurations,
  safeguards: { confirmation_data_available: false, automatic_execution: false, tuning_after_freeze: false, production_promotion_authorized: false },
  sources
};
const serialized = `${JSON.stringify(output, null, 2)}\n`;
try {
  await writeFile(outputPath, serialized, { flag: "wx", mode: 0o600 });
} catch (error) {
  if (error?.code !== "EEXIST") throw error;
  if (await readFile(outputPath, "utf8") !== serialized) throw new Error("Candidate-freeze protocol differs from its predeclared implementation.");
}
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), status: output.status, automatic_execution: false }, null, 2)}\n`);
