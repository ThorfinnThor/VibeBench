import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const files = [
  "outputs/confirmation_v0_2/vibebench_confirmation_holdout_100_v0_2.json",
  "outputs/confirmation_v0_2/vibebench_confirmation_holdout_100_v0_2.scan-queue.json",
  "outputs/development_v0_2/vibebench_development_v0_2_candidate_model.json",
  "lib/development-v0_2-candidate.mjs",
  "lib/portable-page-metrics.mjs",
  "lib/analyze-html.mjs",
  "lib/extract-assets.mjs",
  "scripts/run-confirmation-v0_2.mjs",
  "scripts/evaluate-confirmation-v0_2.mjs"
];
const outputPath = path.resolve("outputs/confirmation_v0_2/vibebench_confirmation_holdout_100_v0_2.freeze.json");
const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const texts = await Promise.all(files.map((file) => readFile(path.resolve(file), "utf8")));
const manifest = JSON.parse(texts[0]);
const queue = JSON.parse(texts[1]);
const model = JSON.parse(texts[2]);
if (manifest.status !== "READY_TO_FREEZE" || manifest.samples?.length !== 100 || queue.rows?.length !== 100) throw new Error("Confirmation manifest is incomplete.");
if (manifest.model_scores_inspected_before_selection !== false || model.holdout_used !== false) throw new Error("Confirmation selection is not blind or model used prohibited data.");
if (queue.manifest_sha256 !== sha256(texts[0])) throw new Error("Scan queue belongs to a different manifest.");
const frozen = {
  schema_version: "v0.2-confirmation-freeze",
  frozen_at: new Date().toISOString(),
  status: "FROZEN_UNOPENED",
  rows: 100,
  labels: { AI: 50, HUMAN: 50 },
  model_score_opened: false,
  rule: { threshold: model.training.threshold, technical_retry_limit: 1, precision_gate: 0.8, recall_gate: 0.8 },
  files: Object.fromEntries(files.map((file, index) => [file, { sha256: sha256(texts[index]) }]))
};
await writeFile(outputPath, `${JSON.stringify(frozen, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), status: frozen.status, rows: frozen.rows, labels: frozen.labels, model_score_opened: frozen.model_score_opened }, null, 2)}\n`);
