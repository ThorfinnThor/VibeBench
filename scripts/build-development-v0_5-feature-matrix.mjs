import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ALL_FEATURES, buildV03FeatureMap } from "../lib/development-v0_3-candidate.mjs";

const basePath = path.resolve("outputs/development_v0_4/vibebench_development_v0_4_feature_matrix.json");
const extensionPath = path.resolve("outputs/development_v0_5/vibebench_development_v0_5_artifacts.json");
const outputPath = path.resolve("outputs/development_v0_5/vibebench_development_v0_5_feature_matrix.json");
const [baseText, extensionText] = await Promise.all([basePath, extensionPath].map((file) => readFile(file, "utf8")));
const base = JSON.parse(baseText);
const extension = JSON.parse(extensionText);
if (base.failed_confirmations_used !== false || base.rows?.length !== 246) throw new Error("Invalid v0.4 Development base matrix.");
if (extension.failed_confirmation_used !== false || extension.summary?.errors !== 0 || extension.results?.length !== 120) throw new Error("Invalid v0.5 Development artifacts.");
const newRows = extension.results.map((row) => ({ sample_id: row.sample_id, target_group: row.target_group, label: row.label, target: row.label === "AI" ? 1 : 0, features: buildV03FeatureMap(row) }));
const rows = [...base.rows, ...newRows];
if (rows.length !== 366 || rows.filter((row) => row.target === 1).length !== 183 || new Set(rows.map((row) => row.sample_id)).size !== 366) throw new Error("Expected balanced, unique 366-row v0.5 matrix.");
const output = {
  schema_version: "v0.5-development-feature-matrix",
  generated_at: new Date().toISOString(),
  purpose: "Development only. Previous opened confirmations are excluded from training rows and used only for aggregate error taxonomy.",
  failed_confirmations_used: false,
  opened_confirmation_rows_used: false,
  feature_names: ALL_FEATURES,
  prohibited_features: ["hostname", "URL", "provenance", "declared builder"],
  inputs: {
    "outputs/development_v0_4/vibebench_development_v0_4_feature_matrix.json": { sha256: createHash("sha256").update(baseText).digest("hex") },
    "outputs/development_v0_5/vibebench_development_v0_5_artifacts.json": { sha256: createHash("sha256").update(extensionText).digest("hex") }
  },
  rows
};
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), rows: rows.length, ai: rows.filter((row) => row.target === 1).length, human: rows.filter((row) => row.target === 0).length, features: ALL_FEATURES.length }, null, 2)}\n`);
