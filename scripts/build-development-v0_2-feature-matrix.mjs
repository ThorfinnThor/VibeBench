import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildPortableFeatureMap, FEATURE_NAMES } from "../lib/development-v0_2-candidate.mjs";

const manifestPath = path.resolve("outputs/development_v0_2/vibebench_development_extension_40_v0_2.json");
const artifactPath = path.resolve("outputs/development_v0_2/vibebench_development_v0_2_artifact_research.json");
const frozenPath = path.resolve("outputs/development_v0_2/vibebench_development_v0_2_frozen_manifest.json");
const outputPath = path.resolve("outputs/development_v0_2/vibebench_development_v0_2_feature_matrix.json");

const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const [manifestText, artifactText, frozenText] = await Promise.all([manifestPath, artifactPath, frozenPath].map((file) => readFile(file, "utf8")));
const manifest = JSON.parse(manifestText);
const artifacts = JSON.parse(artifactText);
const frozen = JSON.parse(frozenText);
if (frozen.status !== "FROZEN" || manifest.samples?.length !== 40 || artifacts.summary?.successful !== 40) {
  throw new Error("Feature matrix requires the frozen 40-row Development corpus and 40 successful artifact inspections.");
}
if (artifacts.holdout_used !== false) throw new Error("Artifact research must explicitly exclude the completed holdout.");
const byId = new Map(artifacts.results.map((row) => [row.sample_id, row]));
const rows = manifest.samples.map((row) => {
  const artifact = byId.get(row.sample_id);
  if (!artifact?.ok || !artifact.page_metrics) throw new Error(`Missing artifact metrics for ${row.sample_id}.`);
  return {
    sample_id: row.sample_id,
    target_group: row.target_group,
    label: row.label,
    target: row.label === "AI" ? 1 : 0,
    features: buildPortableFeatureMap({ stackSignals: row.baseline_scan.stack_signals, pageMetrics: artifact.page_metrics })
  };
});
if (new Set(rows.map((row) => row.sample_id)).size !== 40 || rows.filter((row) => row.target === 1).length !== 20) {
  throw new Error("Feature matrix must contain 40 unique rows balanced 20 AI / 20 Human.");
}
const matrix = {
  schema_version: "v0.2-development-portable-feature-matrix",
  generated_at: new Date().toISOString(),
  purpose: "Development-only model research; not an independent evaluation result.",
  holdout_used: false,
  prohibited_features: ["hostname", "URL", "project family", "provenance", "builder label", "hosting header", "direct builder marker"],
  feature_names: FEATURE_NAMES,
  inputs: {
    manifest: path.relative(process.cwd(), manifestPath),
    manifest_sha256: sha256(manifestText),
    artifact_research: path.relative(process.cwd(), artifactPath),
    artifact_research_sha256: sha256(artifactText),
    frozen_manifest: path.relative(process.cwd(), frozenPath),
    frozen_manifest_sha256: sha256(frozenText)
  },
  rows
};
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(matrix, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), rows: rows.length, ai: rows.filter((row) => row.target === 1).length, human: rows.filter((row) => row.target === 0).length, features: FEATURE_NAMES.length, holdout_used: matrix.holdout_used }, null, 2)}\n`);
