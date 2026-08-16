import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizePublicUrl } from "../lib/public-url-policy.mjs";

const sourcePath = path.resolve("outputs/development_v0_5_option_b/option_b_label_registry_v1.json");
const pilotPath = path.resolve("outputs/development_v0_5_option_b_v4/option_b_v4_pilot_manifest.json");
const outputPath = path.resolve("outputs/development_v0_5_option_b_v4/option_b_v4_extension_20_manifest_v1.json");
const selectionSeed = "vibebench-option-b-v4-extension-20-v1";
const [sourceText, pilotText] = await Promise.all([readFile(sourcePath, "utf8"), readFile(pilotPath, "utf8")]);
const source = JSON.parse(sourceText);
const pilot = JSON.parse(pilotText);
const excluded = new Set(pilot.rows.map(({ sample_id }) => sample_id));
const projected = source.records
  .map(({ sample_id, target_url }) => ({ sample_id, target_url: normalizePublicUrl(target_url).toString() }))
  .filter(({ sample_id }) => !excluded.has(sample_id));
if (new Set(projected.map(({ sample_id }) => sample_id)).size !== projected.length) throw new Error("Duplicate sample IDs in extension source.");
const selectionHash = ({ sample_id, target_url }) => createHash("sha256").update(`${selectionSeed}\0${sample_id}\0${target_url}`).digest("hex");
projected.sort((left, right) => selectionHash(left).localeCompare(selectionHash(right)));
const rows = projected.slice(0, 20);
if (rows.length !== 20 || rows.some((row) => Object.keys(row).sort().join(",") !== "sample_id,target_url")) throw new Error("Extension selection is not exactly 20 privacy-minimal rows.");
const output = {
  schema_version: "vibebench.option_b.v4_extension_manifest.v1",
  locked_at: "2026-08-16T10:28:33Z",
  status: "LABEL_BLIND_TECHNICAL_EXTENSION_20_FROZEN",
  source: {
    path: path.relative(process.cwd(), sourcePath),
    sha256: createHash("sha256").update(sourceText).digest("hex"),
    fields_projected_before_selection: ["sample_id", "target_url"]
  },
  selection: {
    algorithm: "ascending SHA-256 of fixed seed, sample_id and normalized target_url",
    seed: selectionSeed,
    selected: 20,
    pilot_rows_excluded: pilot.rows.length,
    labels_inspected: false,
    previous_scores_inspected: false,
    previous_features_inspected: false
  },
  collector_visible_fields: ["sample_id", "target_url"],
  rows
};
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, { flag: "wx" });
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), rows: rows.length }, null, 2)}\n`);
