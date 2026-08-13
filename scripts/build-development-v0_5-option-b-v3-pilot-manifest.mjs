import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const inputPath = path.resolve("outputs/development_v0_5_option_b/option_b_browser_surface_matrix_v1.json");
const outputPath = path.resolve("outputs/development_v0_5_option_b_v3/option_b_local_pilot_manifest_v1.json");
const inputText = await readFile(inputPath, "utf8");
const input = JSON.parse(inputText);
const eligible = input.rows.filter((row) => row.ok).map((row) => ({ sample_id: row.sample_id, target_url: row.target_url }));
const selected = eligible.map((row) => ({ ...row, selection_hash: createHash("sha256").update(`${row.sample_id}\0${row.target_url}`).digest("hex") })).sort((a, b) => a.selection_hash.localeCompare(b.selection_hash)).slice(0, 6);
const output = {
  schema_version: "vibebench.option_b.local_pilot_manifest.v1",
  generated_at: new Date().toISOString(),
  status: "LABEL_BLIND_TECHNICAL_PILOT_ONLY",
  input: { path: path.relative(process.cwd(), inputPath), sha256: createHash("sha256").update(inputText).digest("hex") },
  selection: { eligible_previous_technical_successes: eligible.length, selected: selected.length, method: "lowest SHA-256 of sample_id NUL target_url; no label, cohort, score or feature used", labels_inspected: false, previous_scores_inspected: false, previous_features_inspected: false },
  collector_visible_fields: ["sample_id", "target_url"],
  rows: selected.map(({ sample_id, target_url }) => ({ sample_id, target_url }))
};
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), selected: output.selection.selected }, null, 2)}\n`);
