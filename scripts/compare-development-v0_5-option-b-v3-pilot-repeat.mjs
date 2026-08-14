import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("outputs/development_v0_5_option_b_v3");
const firstRun = path.join(root, "pilot_run_1");
const secondCapturePath = path.join(root, "option_b_local_pilot_capture_v1.json");
const secondAuditPath = path.join(root, "option_b_local_pilot_attempt_audit_v1.json");
const outputPath = path.join(root, "option_b_local_pilot_repeat_comparison_v1.json");

const load = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));
const [firstCapture, firstAudit, secondCapture, secondAudit] = await Promise.all([
  load(path.join(firstRun, "option_b_local_pilot_capture_v1.json")),
  load(path.join(firstRun, "option_b_local_pilot_attempt_audit_v1.json")),
  load(secondCapturePath),
  load(secondAuditPath)
]);

const firstAttempts = new Map(firstAudit.attempts.map((attempt) => [attempt.sample_id, attempt]));
const secondAttempts = new Map(secondAudit.attempts.map((attempt) => [attempt.sample_id, attempt]));
const firstCaptures = new Map(firstCapture.captures.map((capture) => [capture.sample_id, capture]));
const secondCaptures = new Map(secondCapture.captures.map((capture) => [capture.sample_id, capture]));
const sampleIds = [...new Set([...firstAttempts.keys(), ...secondAttempts.keys()])].sort();
const transitions = sampleIds.map((sampleId) => {
  const from = firstAttempts.get(sampleId)?.outcome_code || "missing";
  const to = secondAttempts.get(sampleId)?.outcome_code || "missing";
  return { sample_id: sampleId, from, to, changed: from !== to };
});
const drifts = sampleIds.filter((sampleId) => firstCaptures.has(sampleId) && secondCaptures.has(sampleId)).map((sampleId) => {
  const first = firstCaptures.get(sampleId).payload;
  const second = secondCaptures.get(sampleId).payload;
  const firstCount = first.document.visible_element_count;
  const secondCount = second.document.visible_element_count;
  return {
    sample_id: sampleId,
    viewport_match: first.document.viewport_width === second.document.viewport_width && first.document.viewport_height === second.document.viewport_height,
    visible_element_count_run_1: firstCount,
    visible_element_count_run_2: secondCount,
    visible_element_count_delta: secondCount - firstCount,
    visible_element_count_relative_delta: Math.round(Math.abs(secondCount - firstCount) / Math.max(1, firstCount) * 10000) / 10000,
    document_width_delta: second.document.document_width - first.document.document_width,
    document_height_delta: second.document.document_height - first.document.document_height,
    layout_region_count_run_1: first.layout_regions.length,
    layout_region_count_run_2: second.layout_regions.length,
    layout_region_count_delta: second.layout_regions.length - first.layout_regions.length,
    public_asset_fetch_count_delta: second.public_assets.same_origin_stylesheets_fetched - first.public_assets.same_origin_stylesheets_fetched
  };
});

const generatedAtRun1 = Date.parse(firstCapture.generated_at);
const generatedAtRun2 = Date.parse(secondCapture.generated_at);
const separationHours = (generatedAtRun2 - generatedAtRun1) / (60 * 60 * 1000);
const sameRuntime = JSON.stringify(firstCapture.runtime) === JSON.stringify(secondCapture.runtime);
const sameManifest = firstCapture.inputs?.manifest?.sha256 === secondCapture.inputs?.manifest?.sha256;
const technicalChecks = {
  same_manifest: sameManifest,
  same_runtime: sameRuntime,
  separation_within_24_to_72_hours: separationHours >= 24 && separationHours <= 72,
  same_sample_set: sampleIds.length === 6,
  all_second_attempts_registered: secondAudit.attempts.length === 6,
  no_unknown_outcome: secondAudit.attempts.every((attempt) => attempt.outcome_code !== "unknown_technical_error")
};
const result = {
  schema_version: "vibebench.option_b.local_pilot_repeat_comparison.v1",
  generated_at: new Date().toISOString(),
  status: Object.values(technicalChecks).every(Boolean) ? "REPEAT_COMPARISON_READY_FOR_METHOD_REVIEW" : "REPEAT_COMPARISON_FAILED_TECHNICAL_GATE",
  full_batch_approved: false,
  run_1: { run_id: firstCapture.run_id, generated_at: firstCapture.generated_at },
  run_2: { run_id: secondCapture.run_id, generated_at: secondCapture.generated_at },
  separation_hours: separationHours,
  technical_checks: technicalChecks,
  technical_outcome_transitions: transitions,
  feature_drift_by_viewport: drifts,
  next_gate: "method_review_of_drift_and_outcome_transitions_before_any_full_batch",
  artifact_sizes: {
    run_2_capture_bytes: (await stat(secondCapturePath)).size,
    run_2_audit_bytes: (await stat(secondAuditPath)).size
  }
};
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result.status !== "REPEAT_COMPARISON_READY_FOR_METHOD_REVIEW") process.exitCode = 1;
