import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
const confirmationPoolPath = path.resolve("outputs/confirmation_v0_3/vibebench_confirmation_v0_3_candidate_pool.json");
const confirmationManifestPath = path.resolve("outputs/confirmation_v0_3/vibebench_confirmation_holdout_100_v0_3.json");
const humanPoolPath = path.resolve("outputs/development_v0_3/vibebench_development_v0_3_human_expansion_pool.json");
const resultLockPath = path.resolve("outputs/confirmation_v0_3/blind_run_v0_3/vibebench_confirmation_result_files_v0_3.json");
const outputPath = path.resolve("outputs/development_v0_4/vibebench_development_extension_58_v0_4.json");
const [pool, confirmation, humanPool, resultLock] = await Promise.all([confirmationPoolPath, confirmationManifestPath, humanPoolPath, resultLockPath].map((file) => readFile(file, "utf8").then(JSON.parse)));
if (resultLock.status !== "FAILED_LOCKED_NO_TUNING" || resultLock.policy?.may_be_used_for_training !== false) throw new Error("Opened confirmation must remain quarantined.");
const used = new Set(confirmation.samples.map((row) => row.project_family_id));
for (const file of ["outputs/development_v0_3/vibebench_development_extension_60_v0_3.json", "outputs/development_v0_3/vibebench_development_expansion_88_v0_3.json"]) {
  const payload = JSON.parse(await readFile(path.resolve(file), "utf8")); for (const row of payload.samples) used.add(row.project_family_id);
}
const ai = pool.candidates.filter((row) => row.label === "AI" && row.reachability?.ok && !used.has(row.project_family_id)).slice(0, 29);
const humanFromConfirmationPool = pool.candidates.filter((row) => row.label === "HUMAN" && row.reachability?.ok && !used.has(row.project_family_id));
const humanExtra = humanPool.candidates.filter((row) => row.reachability?.ok && !used.has(row.project_family_id) && !humanFromConfirmationPool.some((candidate) => candidate.project_family_id === row.project_family_id));
const human = [...humanFromConfirmationPool, ...humanExtra].slice(0, 29);
if (ai.length !== 29 || human.length !== 29) throw new Error(`Need 29/29 unused pre-acquired rows, found ${ai.length}/${human.length}.`);
const samples = [...ai, ...human].map((row, index) => ({ sample_id: `DEV4-${String(index + 1).padStart(3, "0")}`, target_group: row.label === "AI" ? `AI_${row.builder_bucket || "CODE_ASSISTANT"}_V04` : "HUMAN_ESTABLISHED_PRODUCT_V04", label: row.label, builder: row.label === "AI" ? row.builder_bucket || "Code assistant" : "Human control", target_url: row.target_url, project_family_id: row.project_family_id, project_name: row.project_name, provenance_type: row.provenance_type, provenance_url: row.provenance_url, provenance_summary: row.provenance_summary, acquisition: { selected_before_any_model_scoring: true, model_score_inspected: false, opened_confirmation_rows_inspected: false } }));
const output = { schema_version: "v0.4-development-extension", generated_at: new Date().toISOString(), status: "DEVELOPMENT_ONLY_READY", failed_confirmation_used_for_training: false, failed_confirmation_used_for_error_analysis: false, selection: "All 29 reachable unselected AI candidates plus 29 reachable unselected Human controls from acquisition pools created before scoring.", summary: { total: 58, ai: 29, human: 29 }, samples };
await import("node:fs/promises").then(({ mkdir }) => mkdir(path.dirname(outputPath), { recursive: true })); await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8"); process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), summary: output.summary }, null, 2)}\n`);
