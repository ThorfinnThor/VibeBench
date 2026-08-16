import { createHash } from "node:crypto";
import { once } from "node:events";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertOptionBV5Payload } from "../lib/option-b-v5-capture.mjs";
import { pairedSuccessfulSampleIds, selectFrozenTechnicalReplacements, terminalAttemptRates } from "../lib/option-b-v5-development-finalize.mjs";

const argument = (name, fallback) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; };
const root = path.resolve(argument("--root", "outputs/development_v0_6_option_b_v5"));
const paths = {
  primaryCapture: path.resolve(argument("--primary-capture", path.join(root, "primary.capture.json"))),
  primaryAudit: path.resolve(argument("--primary-audit", path.join(root, "primary.attempt-audit.json"))),
  reserveCapture: path.resolve(argument("--reserve-capture", path.join(root, "reserve.capture.json"))),
  reserveAudit: path.resolve(argument("--reserve-audit", path.join(root, "reserve.attempt-audit.json"))),
  primaryManifest: path.resolve(argument("--primary-manifest", "outputs/development_v0_6_option_b_v5/option_b_v5_development_primary_manifest_v1.json")),
  reserveManifest: path.resolve(argument("--reserve-manifest", "outputs/development_v0_6_option_b_v5/option_b_v5_development_reserve_manifest_v1.json")),
  replacementPolicy: path.resolve(argument("--replacement-policy", "outputs/development_v0_6_option_b_v5/option_b_v5_development_replacement_policy_v1.json")),
  output: path.resolve(argument("--output", path.join(root, "option_b_v5_development_capture_frozen_v1.json"))),
  replacementAudit: path.resolve(argument("--replacement-audit", path.join(root, "option_b_v5_development_replacement_audit_v1.json"))),
  freeze: path.resolve(argument("--freeze", path.join(root, "option_b_v5_development_capture_v1.freeze.json")))
};
const inputKeys = ["primaryCapture", "primaryAudit", "reserveCapture", "reserveAudit", "primaryManifest", "reserveManifest", "replacementPolicy"];
const inputs = Object.fromEntries(await Promise.all(inputKeys.map(async (key) => {
  const text = await readFile(paths[key], "utf8");
  return [key, { text, value: JSON.parse(text), sha256: createHash("sha256").update(text).digest("hex") }];
})));
const primaryCapture = inputs.primaryCapture.value;
const primaryAudit = inputs.primaryAudit.value;
const reserveCapture = inputs.reserveCapture.value;
const reserveAudit = inputs.reserveAudit.value;
const primaryManifest = inputs.primaryManifest.value;
const reserveManifest = inputs.reserveManifest.value;
const policy = inputs.replacementPolicy.value;
if (primaryCapture.schema_version !== "vibebench.option_b.v5_development_capture.v1" || reserveCapture.schema_version !== primaryCapture.schema_version) throw new Error("Expected two v5 Development captures.");
if (primaryAudit.schema_version !== "vibebench.option_b.v5_development_attempt_audit.v1" || reserveAudit.schema_version !== primaryAudit.schema_version) throw new Error("Expected two v5 Development attempt audits.");
if (primaryCapture.inputs?.manifest?.sha256 !== inputs.primaryManifest.sha256 || reserveCapture.inputs?.manifest?.sha256 !== inputs.reserveManifest.sha256) throw new Error("Capture manifest hashes do not match the frozen primary/reserve manifests.");
if (primaryCapture.inputs?.contract?.sha256 !== reserveCapture.inputs?.contract?.sha256) throw new Error("Primary and reserve capture contracts differ.");
for (const key of ["collector_base_digest", "egress_base_digest", "collector_source_sha256", "egress_source_sha256"]) if (primaryCapture.runtime?.isolation?.[key] !== reserveCapture.runtime?.isolation?.[key]) throw new Error(`Runtime identity mismatch: ${key}.`);
const prohibited = /^(?:target_url|resolved_url|url|hostname|label|target|target_group|cohort|provenance_url|raw_html|html|visible_text|text|screenshot|image)$/i;
const inspect = (value, at = "output") => {
  if (Array.isArray(value)) return value.forEach((item, index) => inspect(item, `${at}[${index}]`));
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) { if (prohibited.test(key)) throw new Error(`Prohibited persisted field at ${at}.${key}.`); inspect(item, `${at}.${key}`); }
};
inspect(primaryCapture); inspect(primaryAudit); inspect(reserveCapture); inspect(reserveAudit);
for (const row of [...primaryCapture.captures, ...reserveCapture.captures]) assertOptionBV5Payload(row.payload);
const primaryManifestIds = new Set(primaryManifest.rows.map(({ sample_id }) => sample_id));
const reserveManifestIds = new Set(reserveManifest.rows.map(({ sample_id }) => sample_id));
if (primaryCapture.captures.some(({ sample_id }) => !primaryManifestIds.has(sample_id)) || primaryAudit.attempts.some(({ sample_id }) => !primaryManifestIds.has(sample_id))) throw new Error("Primary artifacts contain an unknown sample ID.");
if (reserveCapture.captures.some(({ sample_id }) => !reserveManifestIds.has(sample_id)) || reserveAudit.attempts.some(({ sample_id }) => !reserveManifestIds.has(sample_id))) throw new Error("Reserve artifacts contain an unknown sample ID.");
const primarySuccessfulIds = pairedSuccessfulSampleIds(primaryCapture);
const reserveSuccessfulIds = pairedSuccessfulSampleIds(reserveCapture);
const primarySampleIds = primaryManifest.rows.map(({ sample_id }) => sample_id);
const selected = selectFrozenTechnicalReplacements({ primarySampleIds, primarySuccessfulIds, reserveSuccessfulIds, primaryBucketBySampleId: policy.primary_bucket_by_sample_id, reserveByBucket: policy.reserve_by_bucket });
const selectedIds = new Set([...primarySuccessfulIds, ...selected.replacements.map(({ selected_reserve_sample_id }) => selected_reserve_sample_id)]);
const captureRows = [...primaryCapture.captures, ...reserveCapture.captures].filter(({ sample_id }) => selectedIds.has(sample_id));
const selectedPairIds = pairedSuccessfulSampleIds({ captures: captureRows });
if (selectedPairIds.size !== selectedIds.size || captureRows.length !== selectedIds.size * 2) throw new Error("Final v5 Development capture has incomplete or duplicate viewport pairs.");
const terminalOutcome = (audit, sampleId) => {
  const attempts = audit.attempts.filter(({ sample_id, outcome_code }) => sample_id === sampleId && outcome_code !== "success");
  return attempts.at(-1)?.outcome_code || "unknown_technical_error";
};
const replacementAudit = {
  schema_version: "vibebench.option_b.v5_development_replacement_audit.v1",
  generated_at: new Date().toISOString(),
  status: selected.unresolved.length ? "TECHNICAL_REPLACEMENTS_INCOMPLETE" : "TECHNICAL_REPLACEMENTS_COMPLETE",
  original_failures: primarySampleIds.length - primarySuccessfulIds.size,
  replacements: selected.replacements.map((row) => ({ ...row, reason: terminalOutcome(primaryAudit, row.failed_primary_sample_id) })),
  unresolved: selected.unresolved.map((row) => ({ ...row, reason: terminalOutcome(primaryAudit, row.failed_primary_sample_id) })),
  unused_successful_reserves: [...reserveSuccessfulIds].filter((sampleId) => !selected.usedReserveIds.has(sampleId)).sort(),
  model_performance_inspected: false
};
const terminalRates = terminalAttemptRates([primaryAudit, reserveAudit]);
const unknownRate = terminalRates.unknown_technical_error;
const extractionRate = terminalRates.collector_origin_extraction_failure;
const finalCapture = {
  schema_version: "vibebench.option_b.v5_development_capture_frozen.v1",
  generated_at: new Date().toISOString(),
  status: selectedIds.size === 200 ? "LABEL_BLIND_DEVELOPMENT_CAPTURE_COMPLETE" : "LABEL_BLIND_DEVELOPMENT_CAPTURE_INCOMPLETE",
  privacy: primaryCapture.privacy,
  runtime: { primary: primaryCapture.runtime, reserve: reserveCapture.runtime },
  inputs: Object.fromEntries(inputKeys.map((key) => [key, { sha256: inputs[key].sha256, schema_version: inputs[key].value.schema_version }])),
  summary: { primary_attempted: primaryManifest.rows.length, primary_successful_pairs: primarySuccessfulIds.size, reserve_attempted: reserveManifest.rows.length, reserve_successful_pairs: reserveSuccessfulIds.size, replacements_selected: selected.replacements.length, unresolved: selected.unresolved.length, selected_successful_pairs: selectedIds.size, captures: captureRows.length }
};
inspect(finalCapture); inspect(replacementAudit);
const replacementText = `${JSON.stringify(replacementAudit, null, 2)}\n`;
const writeChunk = async (stream, hash, chunk) => {
  hash.update(chunk);
  if (!stream.write(chunk)) await once(stream, "drain");
};
const writeJsonWithRows = async (file, value, arrayKey, rows) => {
  const stream = createWriteStream(file, { flags: "wx", mode: 0o600 });
  const hash = createHash("sha256");
  const header = JSON.stringify(value, null, 2);
  if (!header.endsWith("\n}")) throw new Error("Unexpected streamed Development capture header.");
  await writeChunk(stream, hash, `${header.slice(0, -2)},\n  ${JSON.stringify(arrayKey)}: [\n`);
  for (const [index, row] of rows.entries()) await writeChunk(stream, hash, `${index ? ",\n" : ""}    ${JSON.stringify(row)}`);
  await writeChunk(stream, hash, "\n  ]\n}\n");
  stream.end();
  await once(stream, "close");
  return hash.digest("hex");
};
const gates = {
  exactly_200_successful_paired_captures: selectedIds.size === 200,
  all_primary_failures_resolved: selected.unresolved.length === 0,
  unknown_technical_error_rate_at_most_1_percent: unknownRate <= 0.01,
  collector_origin_extraction_failure_rate_at_most_2_percent: extractionRate <= 0.02,
  privacy_boundary_preserved: true,
  runtime_identity_consistent: true,
  model_performance_not_inspected: true
};
const passed = Object.values(gates).every(Boolean);
await mkdir(path.dirname(paths.output), { recursive: true });
const captureSha256 = await writeJsonWithRows(paths.output, finalCapture, "captures", captureRows);
const freeze = {
  schema_version: "vibebench.option_b.v5_development_capture_freeze.v1",
  generated_at: new Date().toISOString(),
  status: passed ? "DEVELOPMENT_CAPTURE_FROZEN_LABEL_JOIN_AUTHORIZED" : "DEVELOPMENT_CAPTURE_REJECTED_LABEL_JOIN_BLOCKED",
  gates,
  rates: { primary_technical_yield: primarySuccessfulIds.size / Math.max(1, primaryManifest.rows.length), reserve_technical_yield: reserveSuccessfulIds.size / Math.max(1, reserveManifest.rows.length), ...terminalRates },
  collector_promotion_gate: { technical_yield_at_least_90_percent: primarySuccessfulIds.size / Math.max(1, primaryManifest.rows.length) >= 0.9, note: "A failed collector-promotion gate does not invalidate a complete Development matrix, but it blocks candidate promotion." },
  artifacts: { capture: { sha256: captureSha256 }, replacement_audit: { sha256: createHash("sha256").update(replacementText).digest("hex") } }
};
for (const [file, text] of [[paths.replacementAudit, replacementText], [paths.freeze, `${JSON.stringify(freeze, null, 2)}\n`]]) await writeFile(file, text, { flag: "wx", mode: 0o600 });
process.stdout.write(`${JSON.stringify({ capture: path.relative(process.cwd(), paths.output), replacement_audit: path.relative(process.cwd(), paths.replacementAudit), freeze: path.relative(process.cwd(), paths.freeze), status: freeze.status, summary: finalCapture.summary, gates }, null, 2)}\n`);
if (!passed) process.exitCode = 1;
