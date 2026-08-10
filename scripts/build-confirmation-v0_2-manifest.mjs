import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const poolPath = path.resolve("outputs/confirmation_v0_2/vibebench_confirmation_v0_2_candidate_pool.json");
const modelFreezePath = path.resolve("outputs/development_v0_2/vibebench_development_v0_2_candidate.freeze.json");
const manifestPath = path.resolve("outputs/confirmation_v0_2/vibebench_confirmation_holdout_100_v0_2.json");
const queuePath = path.resolve("outputs/confirmation_v0_2/vibebench_confirmation_holdout_100_v0_2.scan-queue.json");
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

const [poolText, modelFreezeText] = await Promise.all([poolPath, modelFreezePath].map((file) => readFile(file, "utf8")));
const pool = JSON.parse(poolText);
const modelFreeze = JSON.parse(modelFreezeText);
if (pool.model_scores_inspected !== false || modelFreeze.status !== "FROZEN_FOR_CONFIRMATION") {
  throw new Error("Confirmation manifest requires an unscored candidate pool and frozen candidate model.");
}
const readyAi = pool.candidates.filter((row) => row.label === "AI" && row.reachability?.ok).slice(0, 50);
const readyHuman = pool.candidates.filter((row) => row.label === "HUMAN" && row.reachability?.ok).slice(0, 50);
if (readyAi.length !== 50 || readyHuman.length !== 50) throw new Error(`Need 50/50 READY rows; found ${readyAi.length}/${readyHuman.length}.`);
const samples = [...readyAi, ...readyHuman].map((row, index) => ({
  sample_id: `CONF2-${String(index + 1).padStart(3, "0")}`,
  source_candidate_id: row.candidate_id,
  label: row.label,
  target_url: row.target_url,
  resolved_url_at_acquisition: row.reachability.resolved_url,
  project_family_id: row.reachability.resolved_host || row.project_family_id,
  project_name: row.project_name,
  builder_evidence: row.builder_evidence || [],
  repository: row.repository || "",
  repository_created_at: row.repository_created_at || "",
  provenance_type: row.provenance_type,
  provenance_url: row.provenance_url,
  provenance_summary: row.provenance_summary,
  label_limitation: row.label_limitation || "Directory metadata documents AI coding-tool use but does not quantify generated versus manually edited implementation.",
  acquisition_reachability: row.reachability,
  overlap_check: row.overlap_check,
  score_inspected_during_acquisition: false,
  status: "READY"
}));
const families = samples.map((row) => row.project_family_id);
if (new Set(families).size !== samples.length) throw new Error("Duplicate resolved project family in confirmation manifest.");
if (samples.some((row) => row.score_inspected_during_acquisition !== false || row.overlap_check !== "PASS" || row.status !== "READY")) {
  throw new Error("Confirmation manifest contains an unreviewed or previously scored row.");
}
const manifest = {
  schema_version: "v0.2-confirmation-holdout-manifest",
  generated_at: new Date().toISOString(),
  status: "READY_TO_FREEZE",
  purpose: "Independent confirmation of the already-frozen portable v0.2 candidate.",
  selection_rule: "First 50 reachable, non-overlapping AI rows in current Hot100 rank order and first 50 reachable, non-overlapping pre-cutoff GitHub controls in descending star order; no model score used.",
  model_scores_inspected_before_selection: false,
  completed_v0_1_holdout_used_for_tuning: false,
  development_v0_2_used_for_frozen_model_only: true,
  model_freeze: path.relative(process.cwd(), modelFreezePath),
  model_freeze_sha256: sha256(modelFreezeText),
  source_pool: path.relative(process.cwd(), poolPath),
  source_pool_sha256: sha256(poolText),
  counts: { total: samples.length, ai: readyAi.length, human: readyHuman.length },
  samples
};
const queue = {
  schema_version: "v0.2-confirmation-scan-queue",
  purpose: "Label-free input for the one-time confirmation runner.",
  manifest_sha256: sha256(`${JSON.stringify(manifest, null, 2)}\n`),
  rows: samples.map((row) => ({ sample_id: row.sample_id, target_url: row.target_url }))
};
await mkdir(path.dirname(manifestPath), { recursive: true });
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
queue.manifest_sha256 = sha256(manifestText);
await Promise.all([
  writeFile(manifestPath, manifestText, "utf8"),
  writeFile(queuePath, `${JSON.stringify(queue, null, 2)}\n`, "utf8")
]);
const builders = {};
for (const row of readyAi) for (const builder of row.builder_evidence) builders[builder] = (builders[builder] || 0) + 1;
process.stdout.write(`${JSON.stringify({ manifest: path.relative(process.cwd(), manifestPath), queue: path.relative(process.cwd(), queuePath), counts: manifest.counts, ai_builder_mentions: builders, selection_scores_inspected: false }, null, 2)}\n`);
