import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const argument = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
const firstCapturePath = path.resolve(argument("--first-capture", "outputs/development_v0_6_option_b_v5/run-1.capture.json"));
const secondCapturePath = path.resolve(argument("--second-capture", "outputs/development_v0_6_option_b_v5/run-2.capture.json"));
const firstAuditPath = path.resolve(argument("--first-audit", "outputs/development_v0_6_option_b_v5/run-1.attempt-audit.json"));
const secondAuditPath = path.resolve(argument("--second-audit", "outputs/development_v0_6_option_b_v5/run-2.attempt-audit.json"));
const outputPath = path.resolve(argument("--output", "outputs/development_v0_6_option_b_v5/option_b_v5_smoke_repeat_comparison_v1.json"));
const sourceReferences = [
  argument("--first-capture-source", "github-actions:option-b-v5-six-site-smoke-run-1/run-1.capture.json"),
  argument("--second-capture-source", "github-actions:option-b-v5-six-site-smoke-run-2/run-2.capture.json"),
  argument("--first-audit-source", "github-actions:option-b-v5-six-site-smoke-run-1/run-1.attempt-audit.json"),
  argument("--second-audit-source", "github-actions:option-b-v5-six-site-smoke-run-2/run-2.attempt-audit.json")
];

const files = await Promise.all([firstCapturePath, secondCapturePath, firstAuditPath, secondAuditPath].map(async (file) => {
  const text = await readFile(file, "utf8");
  return { file, text, json: JSON.parse(text), sha256: createHash("sha256").update(text).digest("hex") };
}));
const [firstCaptureFile, secondCaptureFile, firstAuditFile, secondAuditFile] = files;
const first = firstCaptureFile.json;
const second = secondCaptureFile.json;
const firstAudit = firstAuditFile.json;
const secondAudit = secondAuditFile.json;
if (first.schema_version !== "vibebench.option_b.v5_smoke_capture.v1" || second.schema_version !== first.schema_version) throw new Error("Both inputs must be v5 smoke captures.");
if (firstAudit.schema_version !== "vibebench.option_b.v5_smoke_attempt_audit.v1" || secondAudit.schema_version !== firstAudit.schema_version) throw new Error("Both audit inputs must use the v5 smoke audit schema.");

const keyFor = ({ sample_id, viewport_id }) => `${sample_id}:${viewport_id}`;
const firstByKey = new Map(first.captures.map((row) => [keyFor(row), row]));
const secondByKey = new Map(second.captures.map((row) => [keyFor(row), row]));
const firstKeys = [...firstByKey.keys()].sort();
const secondKeys = [...secondByKey.keys()].sort();
const commonKeys = firstKeys.filter((key) => secondByKey.has(key));
const jaccard = (left, right) => {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter((value) => rightSet.has(value)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return union ? intersection / union : 1;
};
const signatures = (payload) => payload.repetition.structural_signature_frequency.map(({ signature_hash }) => signature_hash);
const hashPayload = (payload) => createHash("sha256").update(JSON.stringify(payload)).digest("hex");
const stability = commonKeys.map((key) => {
  const left = firstByKey.get(key).payload;
  const right = secondByKey.get(key).payload;
  return {
    capture_key: key,
    exact_payload_match: hashPayload(left) === hashPayload(right),
    visible_element_delta_share: Math.abs(left.document.visible_element_count - right.document.visible_element_count) / Math.max(1, left.document.visible_element_count),
    structural_signature_jaccard: jaccard(signatures(left), signatures(right))
  };
});
const percentile = (values, share) => {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * share))];
};
const outcomeCounts = (audit) => Object.fromEntries(Object.entries(audit.attempts.reduce((counts, row) => {
  counts[row.outcome_code] = (counts[row.outcome_code] || 0) + 1;
  return counts;
}, {})).sort(([left], [right]) => left.localeCompare(right)));
const runtime = (audit) => {
  const elapsed = audit.attempts.map(({ elapsed_ms }) => elapsed_ms);
  const retryKeys = new Set(audit.attempts.filter(({ retry_number }) => retry_number > 0).map(keyFor));
  const recoveredKeys = new Set(audit.attempts.filter(({ retry_number, outcome_code }) => retry_number > 0 && outcome_code === "success").map(keyFor));
  return {
    attempts: audit.attempts.length,
    elapsed_ms_p50: percentile(elapsed, 0.5),
    elapsed_ms_p90: percentile(elapsed, 0.9),
    elapsed_ms_max: Math.max(...elapsed),
    retry_keys: retryKeys.size,
    recovered_retry_keys: recoveredKeys.size,
    retry_recovery_rate: retryKeys.size ? recoveredKeys.size / retryKeys.size : null,
    outcomes: outcomeCounts(audit)
  };
};
const responsiveShape = (capture) => {
  const rows = new Map(capture.captures.map((row) => [keyFor(row), row.payload]));
  const sampleIds = [...new Set(capture.captures.map(({ sample_id }) => sample_id))].sort();
  return Object.fromEntries(sampleIds.flatMap((sampleId) => {
    const desktop = rows.get(`${sampleId}:desktop`);
    const mobile = rows.get(`${sampleId}:mobile`);
    if (!desktop || !mobile) return [];
    return [[sampleId, {
      visible_element_delta_share: Math.abs(desktop.document.visible_element_count - mobile.document.visible_element_count) / Math.max(1, desktop.document.visible_element_count),
      document_height_ratio: mobile.document.document_height / Math.max(1, desktop.document.document_height),
      structural_signature_jaccard: jaccard(signatures(desktop), signatures(mobile))
    }]];
  }));
};
const firstResponsive = responsiveShape(first);
const secondResponsive = responsiveShape(second);
const responsiveCommon = Object.keys(firstResponsive).filter((sampleId) => secondResponsive[sampleId]).sort();
const responsiveStability = responsiveCommon.map((sampleId) => ({
  sample_id: sampleId,
  visible_element_delta_share_change: Math.abs(firstResponsive[sampleId].visible_element_delta_share - secondResponsive[sampleId].visible_element_delta_share),
  document_height_ratio_change: Math.abs(firstResponsive[sampleId].document_height_ratio - secondResponsive[sampleId].document_height_ratio),
  structural_jaccard_change: Math.abs(firstResponsive[sampleId].structural_signature_jaccard - secondResponsive[sampleId].structural_signature_jaccard)
}));
const firstOutcomes = outcomeCounts(firstAudit);
const secondOutcomes = outcomeCounts(secondAudit);
const gates = {
  same_manifest_and_contract: first.inputs?.manifest?.sha256 === second.inputs?.manifest?.sha256 && first.inputs?.contract?.sha256 === second.inputs?.contract?.sha256,
  same_runtime_sources: first.runtime?.isolation?.collector_base_digest === second.runtime?.isolation?.collector_base_digest && first.runtime?.isolation?.egress_base_digest === second.runtime?.isolation?.egress_base_digest && first.runtime?.isolation?.collector_source_sha256 === second.runtime?.isolation?.collector_source_sha256 && first.runtime?.isolation?.egress_source_sha256 === second.runtime?.isolation?.egress_source_sha256,
  same_successful_capture_keys: firstKeys.join("\0") === secondKeys.join("\0"),
  at_least_eight_common_captures: commonKeys.length >= 8,
  same_terminal_outcome_counts: JSON.stringify(firstOutcomes) === JSON.stringify(secondOutcomes),
  privacy_boundaries_preserved: first.privacy?.urls_persisted === false && first.privacy?.raw_html_persisted === false && first.privacy?.text_persisted === false && first.privacy?.screenshots_created === false && JSON.stringify(first.privacy) === JSON.stringify(second.privacy)
};
const integrityPassed = Object.values(gates).every(Boolean);
const result = {
  schema_version: "vibebench.option_b.v5_smoke_repeat_comparison.v1",
  status: integrityPassed ? "V5_REPEAT_INTEGRITY_ACCEPTABLE_PHASE_2_TECHNICAL_REVIEW_COMPLETE" : "V5_REPEAT_INTEGRITY_REJECTED",
  phase_gate: "DEVELOPMENT_EXPANSION_REQUIRES_SEPARATE_MANIFEST_RESERVE_FEATURE_SCHEMA_FREEZE",
  timing: {
    first_generated_at: first.generated_at,
    second_generated_at: second.generated_at,
    elapsed_hours: (Date.parse(second.generated_at) - Date.parse(first.generated_at)) / 3_600_000,
    interval_gate_applied: false,
    rationale: "Project owner explicitly authorized an immediate technical repeat on 2026-08-16."
  },
  inputs: Object.fromEntries(files.map(({ sha256, json }, index) => [["first_capture", "second_capture", "first_audit", "second_audit"][index], { source: sourceReferences[index], sha256, schema_version: json.schema_version }])),
  gates,
  summary: {
    first: first.summary,
    second: second.summary,
    common_captures: commonKeys.length,
    exact_payload_matches: stability.filter(({ exact_payload_match }) => exact_payload_match).length,
    common_responsive_samples: responsiveCommon.length
  },
  success_consistency: { first_capture_keys: firstKeys, second_capture_keys: secondKeys },
  retry_and_runtime: { first: runtime(firstAudit), second: runtime(secondAudit) },
  feature_stability: {
    visible_element_delta_share_p50: percentile(stability.map(({ visible_element_delta_share }) => visible_element_delta_share), 0.5),
    visible_element_delta_share_max: Math.max(...stability.map(({ visible_element_delta_share }) => visible_element_delta_share)),
    structural_signature_jaccard_p50: percentile(stability.map(({ structural_signature_jaccard }) => structural_signature_jaccard), 0.5),
    structural_signature_jaccard_min: Math.min(...stability.map(({ structural_signature_jaccard }) => structural_signature_jaccard)),
    captures: stability
  },
  responsive_delta_stability: responsiveStability,
  model_performance_inspected: false
};
const serialized = `${JSON.stringify(result, null, 2)}\n`;
await mkdir(path.dirname(outputPath), { recursive: true });
try {
  await writeFile(outputPath, serialized, { flag: "wx", mode: 0o600 });
} catch (error) {
  if (error?.code !== "EEXIST") throw error;
  const existing = await readFile(outputPath, "utf8");
  if (existing !== serialized) throw new Error("The v5 repeat comparison already exists with different content.");
}
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), status: result.status, summary: result.summary, gates }, null, 2)}\n`);
if (!integrityPassed) process.exitCode = 1;
