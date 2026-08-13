import { assertMinimalPilotPrivacy } from "./option-b-v3-minimal-capture.mjs";

const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const unique = (values) => new Set(values).size === values.length;

function finiteNumbers(value) {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(finiteNumbers);
  if (isObject(value)) return Object.values(value).every(finiteNumbers);
  return true;
}

function gate(id, checks) {
  const findings = checks.filter(Boolean);
  return { id, passed: findings.length === 0, findings };
}

export function reviewOptionBV3Pilot({
  capture,
  audit,
  captureContract,
  reviewContract,
  expectedSampleIds,
  captureBytes,
  auditBytes
}) {
  const expected = [...expectedSampleIds];
  const captureRows = Array.isArray(capture?.captures) ? capture.captures : [];
  const attempts = Array.isArray(audit?.attempts) ? audit.attempts : [];
  const successAttempts = attempts.filter((attempt) => attempt?.outcome_code === "success");
  const allowedOutcomes = new Set(captureContract.terminal_outcomes.map((outcome) => outcome.code));
  const requiredAttemptFields = captureContract.attempt_record_required_fields;
  const requiredDocumentFields = captureContract.capture_payload.document;
  const requiredStyleFields = captureContract.capture_payload.computed_style_properties;
  const requiredRepetitionFields = [
    "structural_signature_frequency",
    "computed_style_signature_frequency",
    "repeated_sibling_group_sizes",
    "repeated_region_signature_frequency"
  ];
  const requiredAssetFields = captureContract.capture_payload.public_assets;
  const limits = reviewContract.first_run_gates;

  const integrityChecks = [];
  if (capture?.schema_version !== "vibebench.option_b.local_pilot_capture.v1") integrityChecks.push("capture_schema_invalid");
  if (audit?.schema_version !== "vibebench.option_b.local_pilot_attempt_audit.v1") integrityChecks.push("audit_schema_invalid");
  if (!capture?.run_id || capture.run_id !== audit?.run_id) integrityChecks.push("run_id_mismatch");
  if (capture?.summary?.attempted !== limits.expected_attempts || audit?.summary?.attempted !== limits.expected_attempts) integrityChecks.push("attempt_count_summary_mismatch");
  if (attempts.length !== limits.expected_attempts) integrityChecks.push("attempt_row_count_mismatch");
  if (captureRows.length !== capture?.summary?.successful || successAttempts.length !== audit?.summary?.successful) integrityChecks.push("success_summary_mismatch");
  if (!unique(attempts.map((attempt) => `${attempt.sample_id}\0${attempt.viewport_id}\0${attempt.retry_number}`))) integrityChecks.push("duplicate_attempt_identity");
  if (!unique(captureRows.map((row) => `${row.sample_id}\0${row.viewport_id}`))) integrityChecks.push("duplicate_capture_identity");
  if ([...attempts].map((attempt) => attempt.sample_id).sort().join("\0") !== expected.sort().join("\0")) integrityChecks.push("manifest_attempt_membership_mismatch");
  if (captureRows.some((row) => !successAttempts.some((attempt) => attempt.sample_id === row.sample_id && attempt.attempt_id === row.attempt_id && attempt.viewport_id === row.viewport_id))) integrityChecks.push("capture_without_matching_success_attempt");
  if (successAttempts.some((attempt) => !captureRows.some((row) => row.sample_id === attempt.sample_id && row.attempt_id === attempt.attempt_id && row.viewport_id === attempt.viewport_id))) integrityChecks.push("success_attempt_without_capture");

  const privacyChecks = [];
  try { assertMinimalPilotPrivacy(capture); } catch { privacyChecks.push("capture_privacy_boundary_failed"); }
  try { assertMinimalPilotPrivacy(audit); } catch { privacyChecks.push("audit_privacy_boundary_failed"); }
  if (capture?.privacy?.urls_persisted !== false || capture?.privacy?.raw_html_persisted !== false || capture?.privacy?.text_persisted !== false || capture?.privacy?.screenshots_created !== false) privacyChecks.push("privacy_declaration_invalid");

  const runtimeChecks = [];
  if (capture?.runtime?.source !== limits.required_runtime_source) runtimeChecks.push("capture_runtime_source_not_approved");
  if (audit?.runtime?.source !== limits.required_runtime_source) runtimeChecks.push("audit_runtime_source_not_approved");
  if (capture?.runtime?.engine !== limits.required_browser_engine || audit?.runtime?.engine !== limits.required_browser_engine) runtimeChecks.push("browser_engine_not_approved");
  if (capture?.runtime?.playwright_version !== limits.required_playwright_version || audit?.runtime?.playwright_version !== limits.required_playwright_version) runtimeChecks.push("playwright_version_not_approved");
  if (JSON.stringify(capture?.runtime) !== JSON.stringify(audit?.runtime)) runtimeChecks.push("capture_audit_runtime_mismatch");

  const taxonomyChecks = [];
  for (const attempt of attempts) {
    if (requiredAttemptFields.some((field) => !(field in attempt))) taxonomyChecks.push(`attempt_required_field_missing:${attempt.sample_id || "unknown"}`);
    if (!allowedOutcomes.has(attempt.outcome_code)) taxonomyChecks.push(`unknown_outcome:${attempt.sample_id || "unknown"}`);
    if (!captureContract.attempt_stages.includes(attempt.terminal_stage)) taxonomyChecks.push(`unknown_terminal_stage:${attempt.sample_id || "unknown"}`);
    if (attempt.viewport_id !== limits.required_viewport_id) taxonomyChecks.push(`viewport_mismatch:${attempt.sample_id || "unknown"}`);
    if (!Number.isFinite(attempt.elapsed_ms) || attempt.elapsed_ms < 0) taxonomyChecks.push(`elapsed_invalid:${attempt.sample_id || "unknown"}`);
  }

  const payloadChecks = [];
  for (const row of captureRows) {
    const payload = row.payload;
    if (!isObject(payload?.document) || requiredDocumentFields.some((field) => !(field in payload.document))) payloadChecks.push(`document_group_incomplete:${row.sample_id}`);
    if (!Array.isArray(payload?.layout_regions)) payloadChecks.push(`layout_regions_missing:${row.sample_id}`);
    if (!Array.isArray(payload?.visible_elements) || payload.visible_elements.length === 0) payloadChecks.push(`visible_elements_missing:${row.sample_id}`);
    if (!isObject(payload?.repetition) || requiredRepetitionFields.some((field) => !(field in payload.repetition))) payloadChecks.push(`repetition_group_incomplete:${row.sample_id}`);
    if (!isObject(payload?.public_assets) || requiredAssetFields.some((field) => !(field in payload.public_assets))) payloadChecks.push(`public_assets_group_incomplete:${row.sample_id}`);
    if (Array.isArray(payload?.visible_elements) && payload.visible_elements.some((element) => !isObject(element.computed_style) || requiredStyleFields.some((field) => !(field in element.computed_style)))) payloadChecks.push(`computed_style_group_incomplete:${row.sample_id}`);
    if (!finiteNumbers(payload)) payloadChecks.push(`non_finite_numeric_value:${row.sample_id}`);
    if (payload?.document?.viewport_width !== 1440 || payload?.document?.viewport_height !== 900) payloadChecks.push(`payload_viewport_mismatch:${row.sample_id}`);
  }

  const resourceChecks = [];
  if (!Number.isFinite(captureBytes) || captureBytes > limits.maximum_total_capture_bytes) resourceChecks.push("capture_artifact_too_large");
  if (!Number.isFinite(auditBytes) || auditBytes > limits.maximum_audit_bytes) resourceChecks.push("audit_artifact_too_large");
  if (captureRows.length > 0 && captureBytes / captureRows.length > limits.maximum_capture_bytes_per_success) resourceChecks.push("capture_bytes_per_success_too_large");
  if (attempts.some((attempt) => attempt.elapsed_ms > limits.maximum_attempt_elapsed_ms)) resourceChecks.push("attempt_runtime_exceeded");

  const gates = [
    gate("artifact_integrity", integrityChecks),
    gate("privacy", privacyChecks),
    gate("runtime_contract", runtimeChecks),
    gate("attempt_taxonomy", taxonomyChecks),
    gate("payload_completeness", payloadChecks),
    gate("technical_yield", successAttempts.length >= limits.minimum_successful ? [] : [`successful_below_${limits.minimum_successful}`]),
    gate("resource_bounds", resourceChecks)
  ];
  const firstRunApproved = gates.every((item) => item.passed);
  return {
    schema_version: "vibebench.option_b.pilot_review.v1",
    status: firstRunApproved ? "FIRST_RUN_TECHNICALLY_ACCEPTABLE_REPEAT_REQUIRED" : "FIRST_RUN_TECHNICAL_REVIEW_FAILED",
    first_run_approved: firstRunApproved,
    full_batch_approved: false,
    summary: {
      expected: limits.expected_attempts,
      attempted: attempts.length,
      successful: successAttempts.length,
      failed: attempts.length - successAttempts.length,
      capture_bytes: captureBytes,
      audit_bytes: auditBytes
    },
    gates,
    next_gate: firstRunApproved ? "repeat_same_manifest_same_runtime_after_24_to_72_hours" : "repair_failed_technical_gates_without_labels"
  };
}
