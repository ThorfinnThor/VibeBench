import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertOptionBV5Payload } from "../lib/option-b-v5-capture.mjs";
import { assertOptionBV5DerivedFeatures, deriveOptionBV5Features, OPTION_B_V5_DERIVED_FEATURES, OPTION_B_V5_DERIVED_FEATURE_SCHEMA } from "../lib/option-b-v5-derived-feature-contract.mjs";

const arg = (name, fallback) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; };
const capturePath = path.resolve(arg("--capture", "outputs/development_v0_6_option_b_v5/option_b_v5_capture.json"));
const outputPath = path.resolve(arg("--output", "outputs/development_v0_6_option_b_v5/option_b_v5_derived_features.json"));
const captureText = await readFile(capturePath, "utf8");
const capture = JSON.parse(captureText);
const bySample = capture.captures.reduce((map, { sample_id, viewport_id, payload }) => {
  assertOptionBV5Payload(payload);
  if (!map.has(sample_id)) map.set(sample_id, {});
  if (map.get(sample_id)[viewport_id]) throw new Error(`Duplicate ${viewport_id} capture for ${sample_id}.`);
  map.get(sample_id)[viewport_id] = payload;
  return map;
}, new Map());
const rows = [...bySample.entries()].filter(([, viewports]) => viewports.desktop && viewports.mobile).map(([sample_id, viewports]) => {
  const features = deriveOptionBV5Features(viewports);
  assertOptionBV5DerivedFeatures(features);
  return { sample_id, features };
});
const output = { schema_version: "vibebench.option_b.v5_derived_features.v2", purpose: "Development-only unlabeled paired-viewport Feature Contract v2 artifact; no evaluation or model selection.", generated_at: new Date().toISOString(), inputs: { capture: { path: path.relative(process.cwd(), capturePath), sha256: createHash("sha256").update(captureText).digest("hex"), schema_version: capture.schema_version } }, contract: { schema_version: OPTION_B_V5_DERIVED_FEATURE_SCHEMA, feature_names: OPTION_B_V5_DERIVED_FEATURES, row_granularity: "one_project_family_site_with_desktop_mobile_pair", excluded_fields: ["target_url", "resolved_url", "hostname", "title", "raw_html", "visible_text", "label", "target_group", "cohort", "class_name", "id"] }, summary: { total: rows.length, feature_count: OPTION_B_V5_DERIVED_FEATURES.length, source_capture_attempted: capture.summary.attempted, source_capture_successful: capture.summary.successful, incomplete_viewport_pairs: bySample.size - rows.length }, rows };
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, { flag: "wx", mode: 0o600 });
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), rows: rows.length }, null, 2)}\n`);
