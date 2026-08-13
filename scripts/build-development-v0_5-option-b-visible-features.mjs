import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildOptionBVisibleFeatures,
  OPTION_B_EXCLUDED_SOURCE_FEATURES,
  OPTION_B_SOURCE_FEATURES,
  OPTION_B_VISIBLE_FEATURE_DEFINITIONS,
  OPTION_B_VISIBLE_FEATURE_NAMES
} from "../lib/option-b-visible-feature-contract-v2.mjs";

const inputPath = path.resolve("outputs/development_v0_5_option_b/option_b_browser_surface_matrix_v1.json");
const outputPath = path.resolve("outputs/development_v0_5_option_b/option_b_visible_feature_matrix_v2.json");
const inputText = await readFile(inputPath, "utf8");
const input = JSON.parse(inputText);
const rows = input.rows.filter((row) => row.ok);

if (rows.length !== 81 || rows.filter((row) => row.target === 1).length !== 28 || rows.filter((row) => row.target === 0).length !== 53) {
  throw new Error("Unexpected frozen Option-B source matrix.");
}
for (const name of OPTION_B_SOURCE_FEATURES) if (!input.feature_names.includes(name)) throw new Error(`Source matrix missing ${name}.`);

const output = {
  schema_version: "vibebench.option_b.visible_feature_matrix.v2",
  generated_at: new Date().toISOString(),
  research_status: "FEATURE_CONTRACT_FROZEN_BEFORE_V2_EVALUATION",
  purpose: "Development-only visible Vibe-Footprint feature research; not an independent holdout.",
  input: {
    path: path.relative(process.cwd(), inputPath),
    sha256: createHash("sha256").update(inputText).digest("hex")
  },
  contract: {
    version: "option-b-visible-v2",
    outcome_values_inspected_during_definition: false,
    direct_builder_markers_used: false,
    identity_or_provenance_fields_used: false,
    source_values_are_log1p_counts_unless_binary: true,
    source_feature_names: OPTION_B_SOURCE_FEATURES,
    excluded_source_features: OPTION_B_EXCLUDED_SOURCE_FEATURES,
    features: OPTION_B_VISIBLE_FEATURE_DEFINITIONS
  },
  summary: { total: rows.length, strong_ai: 28, stable_human: 53, feature_count: OPTION_B_VISIBLE_FEATURE_NAMES.length },
  feature_names: OPTION_B_VISIBLE_FEATURE_NAMES,
  rows: rows.map((row) => ({
    sample_id: row.sample_id,
    target: row.target,
    label: row.label,
    target_group: row.target_group,
    cohort: row.cohort,
    project_family_id: row.project_family_id,
    features: buildOptionBVisibleFeatures(row.features)
  }))
};

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), summary: output.summary }, null, 2)}\n`);
