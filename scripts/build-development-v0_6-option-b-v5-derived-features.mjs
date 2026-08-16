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
const rows = capture.captures.map(({ sample_id, viewport_id, payload }) => {
  assertOptionBV5Payload(payload);
  const features = deriveOptionBV5Features(payload);
  assertOptionBV5DerivedFeatures(features);
  return { sample_id, viewport_id, features };
});
const output = { schema_version: "vibebench.option_b.v5_derived_features.v1", purpose: "Development-only unlabeled feature artifact; no evaluation or model selection.", generated_at: new Date().toISOString(), inputs: { capture: { path: path.relative(process.cwd(), capturePath), sha256: createHash("sha256").update(captureText).digest("hex"), schema_version: capture.schema_version } }, contract: { schema_version: OPTION_B_V5_DERIVED_FEATURE_SCHEMA, feature_names: OPTION_B_V5_DERIVED_FEATURES, excluded_fields: ["target_url", "resolved_url", "hostname", "title", "raw_html", "visible_text", "label", "target_group", "cohort"] }, summary: { total: rows.length, source_capture_attempted: capture.summary.attempted, source_capture_successful: capture.summary.successful }, rows };
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, { flag: "wx", mode: 0o600 });
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), rows: rows.length }, null, 2)}\n`);
