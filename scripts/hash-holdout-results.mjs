import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("outputs/holdout_v0_1/blind_run_v0_1_2026-08-10");
const manifestPath = path.join(outputDir, "vibebench_blind_holdout_result_files_v0_1.json");
const files = [
  "../VIBEBENCH_BLIND_RUN_PROTOCOL_V0_1.md",
  "../vibebench_blind_holdout_100_v0_1.csv.freeze.json",
  "schema-smoke-development-sample.json",
  "blind-run-checkpoint.json",
  "vibebench_blind_holdout_raw_results_v0_1.json",
  "vibebench_blind_holdout_raw_results_v0_1.csv",
  "vibebench_blind_holdout_metrics_v0_1.json",
  "VIBEBENCH_BLIND_HOLDOUT_EVALUATION_V0_1.md",
  "vibebench_blind_holdout_evaluation_v0_1.xlsx"
];

const raw = JSON.parse(await readFile(path.join(outputDir, "vibebench_blind_holdout_raw_results_v0_1.json"), "utf8"));
const artifacts = [];
for (const relativePath of files) {
  const absolutePath = path.resolve(outputDir, relativePath);
  const bytes = await readFile(absolutePath);
  artifacts.push({
    path: path.relative(process.cwd(), absolutePath),
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex")
  });
}

const manifest = {
  schemaVersion: "v0.1",
  generatedAt: raw.completedAt,
  runId: raw.runId,
  scannerCommit: raw.scannerCommit,
  manifestSha256: raw.manifestSha256,
  artifacts
};
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
process.stdout.write(`Wrote ${path.relative(process.cwd(), manifestPath)} with ${artifacts.length} hashed artifacts.\n`);
