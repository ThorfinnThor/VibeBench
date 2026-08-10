import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("outputs/confirmation_v0_2/blind_run_v0_2");
const lock = JSON.parse(await readFile(path.join(outputDir, "vibebench_confirmation_result_files_v0_2.json"), "utf8"));
const metrics = JSON.parse(await readFile(path.join(outputDir, "vibebench_confirmation_metrics_v0_2.json"), "utf8"));
const raw = JSON.parse(await readFile(path.join(outputDir, "vibebench_confirmation_raw_results_v0_2.json"), "utf8"));
const failures = [];

if (lock.status !== "FAILED_LOCKED_NO_TUNING") failures.push(`Lock status is ${lock.status}.`);
if (lock.policy?.may_be_used_for_training !== false) failures.push("Failed holdout is not prohibited from training.");
if (raw.results?.length !== 100 || raw.successful !== 100 || raw.technical_errors !== 0) failures.push("Raw run is not the frozen 100/100-success result.");
const expectedConfusion = { tp: 8, fp: 8, tn: 42, fn: 42 };
for (const [key, value] of Object.entries(expectedConfusion)) {
  if (metrics.confusion?.[key] !== value) failures.push(`Confusion ${key} is ${metrics.confusion?.[key]}, expected ${value}.`);
}
if (metrics.primary?.precision !== 0.5 || metrics.primary?.recall !== 0.16 || metrics.gate?.passed !== false) {
  failures.push("Recorded primary metrics differ from the failed independent result.");
}

for (const artifact of lock.artifacts || []) {
  const bytes = await readFile(path.resolve(artifact.path));
  if (bytes.byteLength !== artifact.bytes) failures.push(`${artifact.path}: byte length mismatch.`);
  if (createHash("sha256").update(bytes).digest("hex") !== artifact.sha256) failures.push(`${artifact.path}: SHA-256 mismatch.`);
}

if (failures.length) {
  process.stderr.write(`${failures.map((failure) => `- ${failure}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("Failed v0.2 confirmation verified and quarantined: 100/100 technical, 8/8/42/42, no tuning permitted.\n");
}
