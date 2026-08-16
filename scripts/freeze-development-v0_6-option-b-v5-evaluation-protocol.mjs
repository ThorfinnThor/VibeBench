import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { OPTION_B_V5_NESTED_PROTOCOL } from "../lib/option-b-v5-grouped-evaluation.mjs";

const outputPath = path.resolve("outputs/development_v0_6_option_b_v5/option_b_v5_evaluation_protocol_v2.freeze.json");
const sourcePaths = [
  path.resolve("lib/option-b-v5-grouped-evaluation.mjs"),
  path.resolve("scripts/evaluate-development-v0_6-option-b-v5-grouped.mjs"),
  path.resolve("outputs/development_v0_6_option_b_v5/option_b_v5_feature_contract_v2.freeze.json"),
  path.resolve("outputs/development_v0_6_option_b_v5/option_b_v5_development_package_v1.freeze.json")
];
const sources = await Promise.all(sourcePaths.map(async (file) => {
  const text = await readFile(file, "utf8");
  return { path: path.relative(process.cwd(), file), sha256: createHash("sha256").update(text).digest("hex"), schema_version: file.endsWith(".json") ? JSON.parse(text).schema_version : null };
}));
const output = {
  schema_version: "vibebench.option_b.v5_evaluation_protocol_freeze.v2",
  locked_at: "2026-08-16T19:15:00.000Z",
  status: "GROUPED_NESTED_EVALUATION_AUTHORIZED_AFTER_CAPTURE_FREEZE",
  production_model_affected: false,
  prerequisites: { capture_freeze_status: "DEVELOPMENT_CAPTURE_FROZEN_LABEL_JOIN_AUTHORIZED", minimum_successful_paired_sites: 200, target_group: "project_family_id" },
  protocol: OPTION_B_V5_NESTED_PROTOCOL,
  selection_boundary: "Feature selection, regularization, class weighting and threshold selection occur only inside inner grouped folds. Outer project families remain untouched until scoring.",
  metrics: ["precision", "recall", "specificity", "f1", "accuracy", "roc_auc", "average_precision", "brier", "log_loss", "expected_calibration_error"],
  distributions: ["minimum", "p10", "median", "p90", "maximum", "mean"],
  development_gate: { precision_p10_minimum: 0.9, recall_p10_minimum: 0.9, precision_median_minimum: 0.92, recall_median_minimum: 0.92 },
  safeguards: { candidate_freeze_automatic: false, confirmation_data_available_to_selection: false, threshold_shopping_on_confirmation: false, performance_claim_authorized: false },
  sources
};
const serialized = `${JSON.stringify(output, null, 2)}\n`;
try {
  await writeFile(outputPath, serialized, { flag: "wx", mode: 0o600 });
} catch (error) {
  if (error?.code !== "EEXIST") throw error;
  if (await readFile(outputPath, "utf8") !== serialized) throw new Error("Frozen grouped evaluation protocol differs from the implementation.");
}
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), status: output.status, outer_assignments: output.protocol.outer_seeds.length, candidate_freeze_automatic: false }, null, 2)}\n`);
