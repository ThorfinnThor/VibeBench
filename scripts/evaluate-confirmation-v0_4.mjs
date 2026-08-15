import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { evaluateConfirmationIntegrity } from "../lib/confirmation-v0_4-integrity.mjs";

const root = path.resolve("outputs/confirmation_v0_4");
const manifestPath = path.join(root, "vibebench_confirmation_holdout_100_v0_4.json");
const queuePath = path.join(root, "vibebench_confirmation_holdout_100_v0_4.scan-queue.json");
const rawPath = path.join(root, "blind_run_v0_4", "vibebench_confirmation_raw_results_v0_4.json");
const metricsPath = path.join(root, "blind_run_v0_4", "vibebench_confirmation_integrity_reconstruction_v0_4.json");
const reportPath = path.join(root, "blind_run_v0_4", "VIBEBENCH_CONFIRMATION_INTEGRITY_RECONSTRUCTION_V0_4.md");
const modelPath = path.resolve("outputs/development_v0_4/vibebench_development_v0_4_candidate_model.json");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const [manifestText, queueText, rawText, modelText] = await Promise.all([manifestPath, queuePath, rawPath, modelPath].map((file) => readFile(file, "utf8")));
const manifest = JSON.parse(manifestText);
const queue = JSON.parse(queueText);
const raw = JSON.parse(rawText);
const model = JSON.parse(modelText);

if (queue.manifest_sha256 !== sha256(manifestText)) throw new Error("Queue is not bound to the current manifest.");
if (raw.queue_sha256 !== sha256(queueText)) throw new Error("Raw results are not bound to the current queue.");
if (raw.model_sha256 !== sha256(modelText)) throw new Error("Raw results are not bound to the frozen model.");
const evaluated = evaluateConfirmationIntegrity({ manifest, raw, model });
const { precision, recall, specificity, accuracy, f1 } = evaluated.primary;
const metricThresholdsPassed = precision >= 0.8 && recall >= 0.8;
const completenessVerified = evaluated.capture_completeness.unverifiable_legacy_rows === 0;
const metrics = {
  schema_version: "v0.4-confirmation-metrics-integrity-reconstruction-v2",
  evaluated_at: new Date().toISOString(),
  status: completenessVerified ? (metricThresholdsPassed ? "EXTERNAL_80_80_GATE_PASSED" : "EXTERNAL_80_80_GATE_FAILED") : "LEGACY_CAPTURE_COMPLETENESS_UNVERIFIABLE",
  independent_confirmation: true,
  manifest_sha256: sha256(manifestText),
  raw_results_sha256: sha256(rawText),
  technical: evaluated.technical,
  capture_completeness: evaluated.capture_completeness,
  confusion: evaluated.confusion,
  primary: evaluated.primary,
  gate: { minimum_precision: 0.8, minimum_recall: 0.8, metric_thresholds_passed: metricThresholdsPassed, capture_completeness_required: true, passed: metricThresholdsPassed && completenessVerified },
  rows: evaluated.rows
};
const pct = (value) => `${(100 * value).toFixed(1)} %`;
const report = `# VibeBench independent confirmation v0.4 — integrity reconstruction\n\nStatus: **${metrics.status}**\n\n| Kennzahl | Wert | Gate |\n|---|---:|---:|\n| Precision | ${pct(precision)} | ≥ 80,0 % |\n| Recall | ${pct(recall)} | ≥ 80,0 % |\n| Specificity | ${pct(specificity)} | — |\n| Accuracy | ${pct(accuracy)} | — |\n| F1 | ${pct(f1)} | — |\n| technische Abdeckung | ${pct(metrics.technical.coverage)} | — |\n\nConfusion Matrix: TP ${evaluated.confusion.tp}, FP ${evaluated.confusion.fp}, TN ${evaluated.confusion.tn}, FN ${evaluated.confusion.fn}.\n\nThe evaluator reconstructed every stored classification from probability and the frozen threshold and verified exact ID sets, labels, class balance and technical totals. The legacy scanner did not persist stream-completeness evidence for ${evaluated.capture_completeness.unverifiable_legacy_rows} successful rows; therefore the prior performance result is not promoted as capture-completeness-verified. The original frozen artifacts remain unchanged.\n`;
await Promise.all([writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`, "utf8"), writeFile(reportPath, report, "utf8")]);
process.stdout.write(`${JSON.stringify({ metrics: path.relative(process.cwd(), metricsPath), report: path.relative(process.cwd(), reportPath), status: metrics.status, technical: metrics.technical, confusion: metrics.confusion, primary: metrics.primary, capture_completeness: metrics.capture_completeness }, null, 2)}\n`);
if (!metrics.gate.passed) process.exitCode = 1;
