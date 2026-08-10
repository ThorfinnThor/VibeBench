import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
const outputDir = path.resolve("outputs/confirmation_v0_3/blind_run_v0_3");
const outputPath = path.join(outputDir, "vibebench_confirmation_result_files_v0_3.json");
const files = ["../vibebench_confirmation_holdout_100_v0_3.json", "../vibebench_confirmation_holdout_100_v0_3.scan-queue.json", "../vibebench_confirmation_holdout_100_v0_3.freeze.json", "checkpoint.json", "vibebench_confirmation_raw_results_v0_3.json", "vibebench_confirmation_metrics_v0_3.json", "VIBEBENCH_CONFIRMATION_EVALUATION_V0_3.md"];
const metrics = JSON.parse(await readFile(path.join(outputDir, "vibebench_confirmation_metrics_v0_3.json"), "utf8"));
if (metrics.status !== "EXTERNAL_80_80_GATE_FAILED" || metrics.gate?.passed !== false) throw new Error("Expected the failed v0.3 independent result.");
const artifacts = [];
for (const relativePath of files) { const absolutePath = path.resolve(outputDir, relativePath); const bytes = await readFile(absolutePath); artifacts.push({ path: path.relative(process.cwd(), absolutePath), bytes: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex") }); }
const lock = { schema_version: "v0.3-confirmation-result-lock", generated_at: new Date().toISOString(), status: "FAILED_LOCKED_NO_TUNING", independent_confirmation: true, gate: metrics.gate, primary: metrics.primary, confusion: metrics.confusion, technical: metrics.technical, policy: { may_be_used_for_training: false, may_be_used_for_threshold_selection: false, may_be_used_for_feature_selection: false, may_be_used_for_error_driven_model_changes: false, allowed_use: "Immutable historical external-validation record only." }, artifacts };
await writeFile(outputPath, `${JSON.stringify(lock, null, 2)}\n`, "utf8"); process.stdout.write(`Locked failed v0.3 confirmation in ${path.relative(process.cwd(), outputPath)}.\n`);
