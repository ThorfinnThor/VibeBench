import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildV03FeatureMap, scoreV03 } from "../lib/development-v0_3-candidate.mjs";
import { scanDevelopmentPage } from "../lib/development-v0_3-page-scan.mjs";

const queuePath = path.resolve("outputs/confirmation_v0_4/vibebench_confirmation_holdout_100_v0_4.scan-queue.json");
const modelPath = path.resolve("outputs/development_v0_4/vibebench_development_v0_4_candidate_model.json");
const freezePath = path.resolve("outputs/confirmation_v0_4/vibebench_confirmation_holdout_100_v0_4.freeze.json");
const outputDir = path.resolve("outputs/confirmation_v0_4/blind_run_v0_4");
const checkpointPath = path.join(outputDir, "checkpoint.json");
const checkpointTempPath = path.join(outputDir, "checkpoint.next.json");
const rawPath = path.join(outputDir, "vibebench_confirmation_raw_results_v0_4.json");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

await mkdir(outputDir, { recursive: true });
try {
  await readFile(rawPath);
  throw new Error("v0.4 final results already exist; no second run permitted.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const [queueText, modelText, freezeText] = await Promise.all([queuePath, modelPath, freezePath].map((file) => readFile(file, "utf8")));
const queue = JSON.parse(queueText);
const model = JSON.parse(modelText);
const frozen = JSON.parse(freezeText);
if (frozen.status !== "FROZEN_UNOPENED" || queue.labels_included !== false || queue.rows?.length !== 100 || model.status !== "FROZEN_CANDIDATE_NOT_FOR_PRODUCTION") throw new Error("Invalid frozen v0.4 package.");
for (const [file, metadata] of Object.entries(frozen.files)) {
  if (sha256(await readFile(path.resolve(file))) !== metadata.sha256) throw new Error(`Frozen file drift: ${file}`);
}

const queueHash = sha256(queueText);
let checkpoint = { schema_version: "v0.4-confirmation-checkpoint-v2", queue_sha256: queueHash, labels_used_by_runner: false, started_at: new Date().toISOString(), results: {} };
try {
  const existing = JSON.parse(await readFile(checkpointPath, "utf8"));
  if (existing.queue_sha256 !== queueHash) throw new Error("Wrong checkpoint.");
  checkpoint = existing;
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const attemptsUsed = (result) => Array.isArray(result?.attempt_history) ? result.attempt_history.length : Number(result?.attempt || 0);
const terminal = (result) => Boolean(result?.terminal || result?.ok || attemptsUsed(result) >= 2);
const pending = queue.rows.filter((row) => !terminal(checkpoint.results[row.sample_id]));
let cursor = 0;
let writeQueue = Promise.resolve();
async function persistCheckpoint() {
  const snapshot = `${JSON.stringify(checkpoint, null, 2)}\n`;
  writeQueue = writeQueue.then(async () => {
    await writeFile(checkpointTempPath, snapshot, "utf8");
    await rename(checkpointTempPath, checkpointPath);
  });
  await writeQueue;
}

async function worker() {
  while (cursor < pending.length) {
    const row = pending[cursor++];
    const previous = checkpoint.results[row.sample_id];
    const history = [...(previous?.attempt_history || [])];
    let scanned = previous?.ok ? previous : null;
    while (!scanned?.ok && history.length < 2) {
      scanned = await scanDevelopmentPage(row);
      history.push({ attempt: history.length + 1, ok: scanned.ok, duration_ms: scanned.duration_ms, error: scanned.ok ? undefined : scanned.error });
    }
    const result = scanned.ok ? (() => {
      const features = buildV03FeatureMap(scanned);
      const probability = scoreV03(model, features);
      return { ...scanned, attempt: history.length, attempt_history: history, terminal: true, features, probability, predicted_positive: probability >= model.training.threshold };
    })() : { ...scanned, attempt: history.length, attempt_history: history, terminal: true };
    checkpoint.results[row.sample_id] = result;
    await persistCheckpoint();
    process.stdout.write(`${Object.keys(checkpoint.results).length}/100 ${row.sample_id} ${result.ok ? result.probability.toFixed(4) : "ERROR"}\n`);
  }
}

await Promise.all(Array.from({ length: 5 }, worker));
await writeQueue;
const results = queue.rows.map((row) => checkpoint.results[row.sample_id]);
if (results.some((row) => !row || !terminal(row))) throw new Error("Incomplete v0.4 scan.");
const raw = {
  schema_version: "v0.4-confirmation-raw-results-v2",
  completed_at: new Date().toISOString(),
  labels_used_by_runner: false,
  queue_sha256: queueHash,
  model_sha256: sha256(modelText),
  total: 100,
  successful: results.filter((row) => row.ok).length,
  technical_errors: results.filter((row) => !row.ok).length,
  results
};
await writeFile(rawPath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), rawPath), total: 100, successful: raw.successful, technical_errors: raw.technical_errors }, null, 2)}\n`);
