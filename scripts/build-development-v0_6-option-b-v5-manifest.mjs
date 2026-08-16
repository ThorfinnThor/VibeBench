import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const sourcePath = path.resolve("outputs/development_v0_5_option_b_v4/option_b_v4_pilot_manifest.json");
const outputPath = path.resolve("outputs/development_v0_6_option_b_v5/option_b_v5_primary_manifest.json");
const sourceText = await readFile(sourcePath, "utf8");
const source = JSON.parse(sourceText);
if (source.rows?.length !== 6) throw new Error("The v5 smoke manifest requires the reviewed six-site pilot rows.");
const rows = source.rows.map(({ sample_id, target_url }) => ({ sample_id, target_url }));
const output = {
  schema_version: "vibebench.option_b.v5_primary_manifest.v1",
  locked_at: "2026-08-16T00:00:00.000Z",
  status: "LABEL_BLIND_SIX_SITE_SMOKE_ONLY",
  source: { path: path.relative(process.cwd(), sourcePath), sha256: createHash("sha256").update(sourceText).digest("hex"), fields_projected: ["sample_id", "target_url"] },
  selection: { selected: 6, labels_inspected: false, previous_scores_inspected: false, previous_features_inspected: false },
  collector_visible_fields: ["sample_id", "target_url"],
  rows
};
const serialized = `${JSON.stringify(output, null, 2)}\n`;
try {
  await writeFile(outputPath, serialized, { flag: "wx", mode: 0o600 });
} catch (error) {
  if (error?.code !== "EEXIST") throw error;
  const existing = await readFile(outputPath, "utf8");
  if (existing !== serialized) throw new Error("The frozen v5 smoke manifest already exists with different content.");
}
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), rows: rows.length }, null, 2)}\n`);
