import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { scanDevelopmentPage } from "../lib/development-v0_3-page-scan.mjs";

const manifestPath = path.resolve("outputs/development_v0_5/vibebench_development_extension_120_v0_5.json");
const poolPath = path.resolve("outputs/development_v0_5/vibebench_development_v0_5_candidate_pool.json");
const artifactsPath = path.resolve("outputs/development_v0_5/vibebench_development_v0_5_artifacts.json");
const [manifest, pool, artifacts] = await Promise.all([manifestPath, poolPath, artifactsPath].map((file) => readFile(file, "utf8").then(JSON.parse)));
const failed = artifacts.results.filter((row) => !row.ok);
if (!failed.length) {
  process.stdout.write("No technical failures require replacement.\n");
  process.exit(0);
}
const used = new Set(manifest.samples.map((row) => row.project_family_id));
const replacements = [];
for (const failure of failed) {
  const originalIndex = manifest.samples.findIndex((row) => row.sample_id === failure.sample_id);
  const original = manifest.samples[originalIndex];
  const expectedLabel = original.label;
  const expectedBucket = expectedLabel === "AI" ? original.target_group.replace(/^AI_|_V05$/g, "") : null;
  const candidate = pool.candidates.find((row) => row.reachability?.ok && row.label === expectedLabel && !used.has(row.project_family_id) && (!expectedBucket || row.builder_bucket === expectedBucket));
  if (!candidate) throw new Error(`No unused ${expectedLabel} replacement for ${failure.sample_id}.`);
  const replacement = {
    sample_id: original.sample_id,
    target_group: original.target_group,
    label: candidate.label,
    builder: candidate.label === "AI" ? candidate.builder_bucket : "Human control",
    target_url: candidate.target_url,
    project_family_id: candidate.project_family_id,
    project_name: candidate.project_name,
    provenance_type: candidate.provenance_type,
    provenance_url: candidate.provenance_url,
    provenance_summary: candidate.provenance_summary,
    source_metadata: candidate.label === "AI"
      ? { project_id: candidate.source_project_id, submitted_at: candidate.submitted_at, builder_evidence: candidate.builder_evidence }
      : { repository: candidate.repository, created_at: candidate.repository_created_at, stars: candidate.source_stars },
    acquisition: { selected_before_any_model_scoring: true, model_score_inspected: false, opened_confirmation_rows_used: false, technical_replacement_only: true }
  };
  let scanned = await scanDevelopmentPage(replacement);
  if (!scanned.ok) scanned = await scanDevelopmentPage(replacement);
  if (!scanned.ok) throw new Error(`Replacement ${candidate.target_url} also failed technically.`);
  used.add(candidate.project_family_id);
  manifest.samples[originalIndex] = replacement;
  const artifactIndex = artifacts.results.findIndex((row) => row.sample_id === failure.sample_id);
  artifacts.results[artifactIndex] = scanned;
  replacements.push({ sample_id: failure.sample_id, original_target_url: original.target_url, replacement_target_url: replacement.target_url, reason: "technical_failure_after_fixed_retry", selection_used_model_score: false });
}
manifest.technical_replacements = [...(manifest.technical_replacements || []), ...replacements];
manifest.summary.technical_replacements = manifest.technical_replacements.length;
artifacts.generated_at = new Date().toISOString();
artifacts.summary = { total: artifacts.results.length, successful: artifacts.results.filter((row) => row.ok).length, errors: artifacts.results.filter((row) => !row.ok).length };
await Promise.all([
  writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8"),
  writeFile(artifactsPath, `${JSON.stringify(artifacts, null, 2)}\n`, "utf8")
]);
process.stdout.write(`${JSON.stringify({ replacements, summary: artifacts.summary }, null, 2)}\n`);
