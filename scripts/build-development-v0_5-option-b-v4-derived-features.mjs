import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { assertOptionBV4Payload } from "../lib/option-b-v4-capture.mjs";
import { assertOptionBV4DerivedFeatures, deriveOptionBV4Features, OPTION_B_V4_DERIVED_FEATURES, OPTION_B_V4_DERIVED_FEATURE_SCHEMA } from "../lib/option-b-v4-derived-feature-contract.mjs";

function arg(name, fallback) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; }
const capturePath = arg("--capture", "/private/tmp/vibebench-extension-81/extension-81.capture.json");
const matrixPath = arg("--matrix", "outputs/development_v0_5_option_b/option_b_browser_surface_matrix_v1.json");
const outputPath = arg("--output", "outputs/development_v0_5_option_b_v4/option_b_v4_derived_feature_matrix_v1.json");
const [captureText, matrixText] = await Promise.all([readFile(capturePath, "utf8"), readFile(matrixPath, "utf8")]);
const capture = JSON.parse(captureText); const matrix = JSON.parse(matrixText);
const labels = new Map(matrix.rows.filter((row) => row.ok === true).map((row) => [row.sample_id, row]));
const rows = capture.captures.map((captureRow) => {
  assertOptionBV4Payload(captureRow.payload);
  const source = labels.get(captureRow.sample_id);
  if (!source) throw new Error(`No post-capture label join for ${captureRow.sample_id}.`);
  const features = deriveOptionBV4Features(captureRow.payload); assertOptionBV4DerivedFeatures(features);
  return { sample_id: captureRow.sample_id, target: source.target, label: source.label, target_group: source.target_group, cohort: source.cohort, features };
});
const counts = rows.reduce((result, row) => { result[row.label] = (result[row.label] || 0) + 1; return result; }, {});
const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const output = {
  schema_version: "vibebench.option_b.v4_derived_feature_matrix.v1",
  purpose: "Development-only feature research; not an independent performance claim and not a production model update.",
  generated_at: new Date().toISOString(),
  inputs: {
    capture: { path: capturePath, sha256: sha256(captureText), schema_version: capture.schema_version },
    capture_audit: { run_id: capture.run_id, summary: capture.summary },
    label_join: { path: matrixPath, sha256: sha256(matrixText), joined_after_capture_freeze: true }
  },
  contract: {
    schema_version: OPTION_B_V4_DERIVED_FEATURE_SCHEMA,
    feature_names: OPTION_B_V4_DERIVED_FEATURES,
    excluded_fields: ["target_url", "resolved_url", "hostname", "title", "raw_html", "visible_text", "provenance_url", "builder", "label", "target_group", "cohort"]
  },
  summary: { total: rows.length, label_counts: counts, source_capture_attempted: capture.summary.attempted, source_capture_successful: capture.summary.successful },
  rows
};
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ output: outputPath, summary: output.summary, feature_count: OPTION_B_V4_DERIVED_FEATURES.length }, null, 2));
