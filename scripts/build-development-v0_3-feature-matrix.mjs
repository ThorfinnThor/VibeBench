import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ALL_FEATURES, buildV03FeatureMap } from "../lib/development-v0_3-candidate.mjs";

const inputs = [
  "outputs/development_v0_3/vibebench_development_v0_2_base_rescan_for_v0_3.json",
  "outputs/development_v0_3/vibebench_development_v0_3_artifact_research.json",
  "outputs/development_v0_3/vibebench_development_v0_3_expansion_artifacts.json"
];
const outputPath = path.resolve("outputs/development_v0_3/vibebench_development_v0_3_feature_matrix.json");
const texts = await Promise.all(inputs.map((file) => readFile(path.resolve(file), "utf8")));
const payloads = texts.map(JSON.parse);
if (payloads.some((payload) => payload.summary?.errors !== 0)) throw new Error("Feature matrix requires successful Development scans only.");
const scanned = payloads.flatMap((payload) => payload.results);
const rows = scanned.map((row) => ({
  sample_id: row.sample_id,
  target_group: row.target_group,
  label: row.label,
  builder: row.builder,
  target: row.label === "AI" ? 1 : 0,
  features: buildV03FeatureMap(row)
}));
if (rows.length !== 188 || rows.filter((row) => row.target === 1).length !== 94 || new Set(rows.map((row) => row.sample_id)).size !== 188) {
  throw new Error("v0.3 matrix must contain 188 unique rows balanced 94/94.");
}
const matrix = {
  schema_version: "v0.3-development-feature-matrix",
  generated_at: new Date().toISOString(),
  purpose: "Development-only feature and candidate research; not independent evaluation.",
  failed_confirmation_used: false,
  prohibited_features: ["hostname", "URL", "project family", "provenance source", "declared builder label"],
  feature_names: ALL_FEATURES,
  inputs: Object.fromEntries(inputs.map((file, index) => [file, { sha256: createHash("sha256").update(texts[index]).digest("hex") }])),
  rows
};
await writeFile(outputPath, `${JSON.stringify(matrix, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), rows: rows.length, ai: 94, human: 94, features: ALL_FEATURES.length }, null, 2)}\n`);
