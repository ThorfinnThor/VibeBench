import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("outputs/holdout_v0_1/blind_run_v0_1_2026-08-10");
const raw = JSON.parse(await readFile(path.join(outputDir, "vibebench_blind_holdout_raw_results_v0_1.json"), "utf8"));
const metrics = JSON.parse(await readFile(path.join(outputDir, "vibebench_blind_holdout_metrics_v0_1.json"), "utf8"));
const artifacts = JSON.parse(await readFile(path.join(outputDir, "vibebench_blind_holdout_result_files_v0_1.json"), "utf8"));

const failures = [];
if (raw.status !== "completed") failures.push(`Run status is ${raw.status}, expected completed.`);
if (raw.flattenedResults?.length !== 100) failures.push(`Raw row count is ${raw.flattenedResults?.length}, expected 100.`);
if (raw.summary?.technicalSuccess !== 98 || raw.summary?.technicalErrors !== 2 || raw.summary?.retries !== 2) failures.push("Raw technical summary differs from frozen result 98/2/2.");
const expectedConfusion = { tp: 30, fp: 9, tn: 40, fn: 19 };
for (const [key, value] of Object.entries(expectedConfusion)) {
  if (metrics.primary?.[key] !== value) failures.push(`Primary ${key} is ${metrics.primary?.[key]}, expected ${value}.`);
}
if (metrics.bootstrap?.replicates !== 10_000 || metrics.bootstrap?.seed !== 20260810) failures.push("Bootstrap configuration differs from protocol.");
if (metrics.rawResultsSha256 !== createHash("sha256").update(await readFile(path.join(outputDir, "vibebench_blind_holdout_raw_results_v0_1.json"))).digest("hex")) failures.push("Metrics raw-results hash mismatch.");

for (const artifact of artifacts.artifacts || []) {
  const bytes = await readFile(path.resolve(artifact.path));
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (bytes.byteLength !== artifact.bytes) failures.push(`${artifact.path}: byte length mismatch.`);
  if (hash !== artifact.sha256) failures.push(`${artifact.path}: SHA-256 mismatch.`);
}

const workbook = await readFile(path.join(outputDir, "vibebench_blind_holdout_evaluation_v0_1.xlsx"));
if (workbook[0] !== 0x50 || workbook[1] !== 0x4b) failures.push("Evaluation workbook is not a valid ZIP/XLSX container.");

if (failures.length) {
  process.stderr.write(`${failures.map((failure) => `- ${failure}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("Blind holdout result package verified: 100 rows, 98 technical successes, primary 30/9/40/19, all artifact hashes match.\n");
}
