import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { scanDevelopmentPageV05 } from "../lib/development-v0_5-page-scan.mjs";

const aiPath = path.resolve("outputs/development_v0_5_option_b/option_b_ai_candidate_pool_v1.json");
const humanPath = path.resolve("outputs/development_v0_5_option_b/option_b_human_candidate_history_v1.json");
const outputPath = path.resolve("outputs/development_v0_5_option_b/option_b_expansion_scans_v1.json");
const [aiText, humanText] = await Promise.all([readFile(aiPath, "utf8"), readFile(humanPath, "utf8")]);
const ai = JSON.parse(aiText);
const human = JSON.parse(humanText);
const cutoff = "2022-11-30T00:00:00Z";
if (ai.model_scores_inspected !== false || ai.public_surface_features_inspected !== false) throw new Error("Invalid score-blind AI pool.");
if (human.cutoff !== cutoff || human.records.some((row) => row.latest_commit?.created_at >= cutoff)) throw new Error("Invalid Stable-Human history pool.");

const rows = [
  ...ai.candidates.map((row) => ({ ...row, sample_id: row.candidate_id, target_group: "STRONG_AI_BOLT_OPTION_B", label: "AI" })),
  ...human.records.map((row) => ({ ...row, sample_id: row.candidate_id, target_group: "STABLE_HUMAN_PRE_AI_OPTION_B", label: "HUMAN" }))
];
if (new Set(rows.map((row) => row.project_family_id)).size !== rows.length) throw new Error("Duplicate project family in Option-B expansion.");

const results = new Array(rows.length);
let cursor = 0;
let completed = 0;
async function worker() {
  while (cursor < rows.length) {
    const index = cursor++;
    let result = await scanDevelopmentPageV05(rows[index]);
    if (!result.ok) result = await scanDevelopmentPageV05(rows[index]);
    results[index] = { ...result, project_family_id: rows[index].project_family_id, provenance_url: rows[index].provenance_url };
    completed += 1;
    process.stdout.write(`${completed}/${rows.length} ${result.sample_id} ${result.ok ? "OK" : "ERROR"}\n`);
  }
}
await Promise.all(Array.from({ length: 8 }, worker));

const output = {
  schema_version: "vibebench.option_b.expansion_scans.v1",
  generated_at: new Date().toISOString(),
  model_scores_inspected_during_acquisition: false,
  public_surface_features_inspected_during_acquisition: false,
  inputs: {
    ai: { path: path.relative(process.cwd(), aiPath), sha256: createHash("sha256").update(aiText).digest("hex") },
    human: { path: path.relative(process.cwd(), humanPath), sha256: createHash("sha256").update(humanText).digest("hex") }
  },
  summary: {
    total: results.length,
    successful: results.filter((row) => row.ok).length,
    errors: results.filter((row) => !row.ok).length,
    ai_successful: results.filter((row) => row.ok && row.label === "AI").length,
    human_successful: results.filter((row) => row.ok && row.label === "HUMAN").length
  },
  results
};
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), summary: output.summary }, null, 2)}\n`);
