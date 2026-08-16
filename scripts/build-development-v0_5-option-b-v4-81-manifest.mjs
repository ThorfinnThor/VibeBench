import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const inputPath = path.resolve("outputs/development_v0_5_option_b/option_b_browser_surface_matrix_v1.json");
const outputPath = path.resolve("outputs/development_v0_5_option_b_v4/option_b_v4_81_manifest_v1.json");
const inputText = await readFile(inputPath, "utf8");
const input = JSON.parse(inputText);

// Project the already-successful public-surface rows before any label-bearing
// fields are carried forward. `ok` is a historical acquisition outcome, not a
// model score or a class label.
const rows = input.rows.filter(({ ok }) => ok === true).map(({ sample_id, target_url }) => ({ sample_id, target_url }));
if (rows.length !== 81 || rows.some(({ sample_id, target_url }) => !sample_id || !target_url)) throw new Error("Expected exactly 81 reachable label-blind source rows.");
if (new Set(rows.map(({ sample_id }) => sample_id)).size !== rows.length) throw new Error("Duplicate sample IDs in the 81-site source.");

const output = {
  schema_version: "vibebench.option_b.v4_development_81_manifest.v1",
  locked_at: new Date().toISOString(),
  status: "LABEL_BLIND_TECHNICAL_81_FROZEN",
  purpose: "Development-only v4 public-surface capture; no independent performance claim",
  source: {
    path: path.relative(process.cwd(), inputPath),
    sha256: createHash("sha256").update(inputText).digest("hex"),
    projection_before_execution: ["sample_id", "target_url"],
    historical_success_filter: "ok === true",
    labels_and_model_fields_excluded: true
  },
  collector_visible_fields: ["sample_id", "target_url"],
  rows
};
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), rows: rows.length, sha256: createHash("sha256").update(JSON.stringify(output, null, 2) + "\n").digest("hex") }, null, 2)}\n`);
