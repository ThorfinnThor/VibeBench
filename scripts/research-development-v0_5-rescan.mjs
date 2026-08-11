import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { scanDevelopmentPageV05 } from "../lib/development-v0_5-page-scan.mjs";

const inputFiles = [
  "outputs/development_v0_3/vibebench_development_v0_2_base_rescan_for_v0_3.json",
  "outputs/development_v0_3/vibebench_development_v0_3_artifact_research.json",
  "outputs/development_v0_3/vibebench_development_v0_3_expansion_artifacts.json",
  "outputs/development_v0_4/vibebench_development_v0_4_artifacts.json",
  "outputs/development_v0_5/vibebench_development_v0_5_artifacts.json"
];
const outputPath = path.resolve("outputs/development_v0_5/vibebench_development_v0_5_full_rescan.json");
const payloads = await Promise.all(inputFiles.map((file) => readFile(path.resolve(file), "utf8").then(JSON.parse)));
const sourceRows = payloads.flatMap((payload) => payload.results).map((row) => ({ sample_id: row.sample_id, target_group: row.target_group, label: row.label, builder: row.builder, target_url: row.target_url }));
const uniqueRows = [...new Map(sourceRows.map((row) => [row.sample_id, row])).values()];
if (uniqueRows.length !== 366 || uniqueRows.filter((row) => row.label === "AI").length !== 183) throw new Error(`Expected 366 balanced Development rows, found ${uniqueRows.length}.`);
const results = new Array(uniqueRows.length);
let cursor = 0;
let completed = 0;
async function worker() {
  while (cursor < uniqueRows.length) {
    const index = cursor++;
    let result = await scanDevelopmentPageV05(uniqueRows[index]);
    let attempt = 1;
    if (!result.ok) { result = await scanDevelopmentPageV05(uniqueRows[index]); attempt = 2; }
    results[index] = { ...result, attempt };
    completed += 1;
    process.stdout.write(`${completed}/366 ${result.sample_id} ${result.ok ? "OK" : "ERROR"}\n`);
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
const output = { schema_version: "v0.5-development-full-rescan", generated_at: new Date().toISOString(), purpose: "Development-only rescan with expanded surface features; opened confirmation rows excluded.", failed_confirmation_used: false, inputs: inputFiles, summary: { total: results.length, successful: results.filter((row) => row.ok).length, errors: results.filter((row) => !row.ok).length, ai_successful: results.filter((row) => row.ok && row.label === "AI").length, human_successful: results.filter((row) => row.ok && row.label === "HUMAN").length }, results };
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), summary: output.summary }, null, 2)}\n`);
