import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildV03FeatureMap, scoreV03 } from "../lib/development-v0_3-candidate.mjs";
import { scanDevelopmentPage } from "../lib/development-v0_3-page-scan.mjs";

const queuePath = path.resolve("outputs/confirmation_v0_3/vibebench_confirmation_holdout_100_v0_3.scan-queue.json");
const modelPath = path.resolve("outputs/development_v0_3/vibebench_development_v0_3_candidate_model.json");
const freezePath = path.resolve("outputs/confirmation_v0_3/vibebench_confirmation_holdout_100_v0_3.freeze.json");
const outputDir = path.resolve("outputs/confirmation_v0_3/blind_run_v0_3");
const checkpointPath = path.join(outputDir, "checkpoint.json");
const rawPath = path.join(outputDir, "vibebench_confirmation_raw_results_v0_3.json");
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

async function verifyFreeze(frozen) {
  if (frozen.status !== "FROZEN_UNOPENED") throw new Error("Confirmation v0.3 is not frozen and unopened.");
  for (const [file, metadata] of Object.entries(frozen.files)) {
    const bytes = await readFile(path.resolve(file));
    if (sha256(bytes) !== metadata.sha256) throw new Error(`Frozen file drift: ${file}`);
  }
}

await mkdir(outputDir, { recursive: true });
try { await readFile(rawPath); throw new Error("Final v0.3 raw results already exist; confirmation cannot run twice."); } catch (error) { if (error.code !== "ENOENT") throw error; }
const [queueText, modelText, freezeText] = await Promise.all([queuePath, modelPath, freezePath].map((file) => readFile(file, "utf8")));
const queue = JSON.parse(queueText); const model = JSON.parse(modelText); const frozen = JSON.parse(freezeText);
await verifyFreeze(frozen);
if (queue.labels_included !== false || queue.rows?.length !== 100 || model.status !== "FROZEN_CANDIDATE_NOT_FOR_PRODUCTION") throw new Error("Invalid label-free queue or frozen model.");
const queueHash = sha256(queueText);
let checkpoint = { schema_version: "v0.3-confirmation-checkpoint", queue_sha256: queueHash, started_at: new Date().toISOString(), labels_used_by_runner: false, results: {} };
try { const existing = JSON.parse(await readFile(checkpointPath, "utf8")); if (existing.queue_sha256 !== queueHash) throw new Error("Checkpoint belongs to another queue."); checkpoint = existing; } catch (error) { if (error.code !== "ENOENT") throw error; }
const pending = queue.rows.filter((row) => !checkpoint.results[row.sample_id]?.ok);
let cursor = 0;
async function worker() {
  while (cursor < pending.length) {
    const row = pending[cursor++];
    let scanned = await scanDevelopmentPage(row);
    let attempt = 1;
    if (!scanned.ok) { scanned = await scanDevelopmentPage(row); attempt = 2; }
    const result = scanned.ok ? (() => { const features = buildV03FeatureMap(scanned); const probability = scoreV03(model, features); return { ...scanned, attempt, features, probability, predicted_positive: probability >= model.training.threshold }; })() : { ...scanned, attempt };
    checkpoint.results[row.sample_id] = result;
    await writeFile(checkpointPath, `${JSON.stringify(checkpoint, null, 2)}\n`, "utf8");
    process.stdout.write(`${Object.keys(checkpoint.results).length}/100 ${row.sample_id} ${result.ok ? result.probability.toFixed(4) : "ERROR"}\n`);
  }
}
await Promise.all(Array.from({ length: 5 }, worker));
const results = queue.rows.map((row) => checkpoint.results[row.sample_id]);
if (results.some((row) => !row)) throw new Error("Incomplete v0.3 checkpoint.");
const raw = { schema_version: "v0.3-confirmation-raw-results", completed_at: new Date().toISOString(), labels_used_by_runner: false, queue_sha256: queueHash, model_sha256: sha256(modelText), total: 100, successful: results.filter((row) => row.ok).length, technical_errors: results.filter((row) => !row.ok).length, results };
await writeFile(rawPath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), rawPath), total: raw.total, successful: raw.successful, technical_errors: raw.technical_errors }, null, 2)}\n`);
