import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { assertOptionBV5Payload } from "../lib/option-b-v5-capture.mjs";

const arg = (name, fallback) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; };
const capturePath = path.resolve(arg("--capture", "outputs/development_v0_6_option_b_v5/option_b_v5_capture.json"));
const auditPath = path.resolve(arg("--audit", "outputs/development_v0_6_option_b_v5/option_b_v5_attempt_audit.json"));
const [captureBytes, auditBytes] = await Promise.all([readFile(capturePath), readFile(auditPath)]);
const capture = JSON.parse(captureBytes);
const audit = JSON.parse(auditBytes);
const findings = [];
if (capture.schema_version !== "vibebench.option_b.v5_smoke_capture.v1" || audit.schema_version !== "vibebench.option_b.v5_smoke_attempt_audit.v1") findings.push("schema_version");
if (capture.run_id !== audit.run_id || capture.summary.attempted !== 6) findings.push("run_or_site_count");
if (capture.runtime?.isolation?.collector_direct_network !== false || capture.runtime?.isolation?.read_only_root !== true || capture.runtime?.isolation?.non_root !== true || capture.runtime?.isolation?.no_new_privileges !== true || capture.runtime?.isolation?.capabilities_dropped !== "ALL") findings.push("isolation_attestation");
const blocked = /^(target_url|resolved_url|url|hostname|label|target|target_group|cohort|provenance_url|raw_html|html|visible_text|text|screenshot|image)$/i;
const inspect = (value, at = "output") => { if (Array.isArray(value)) return value.forEach((item, index) => inspect(item, `${at}[${index}]`)); if (!value || typeof value !== "object") return; for (const [key, item] of Object.entries(value)) { if (blocked.test(key)) findings.push(`privacy:${at}.${key}`); inspect(item, `${at}.${key}`); } };
inspect(capture); inspect(audit);
for (const row of capture.captures || []) { try { assertOptionBV5Payload(row.payload); } catch (error) { findings.push(`payload:${row.sample_id}:${error.message}`); } }
if ((capture.summary.successful || 0) < 1 || capture.summary.successful !== new Set((capture.captures || []).map(({ sample_id }) => sample_id)).size) findings.push("technical_yield");
const review = { schema_version: "vibebench.option_b.v5_smoke_review.v1", generated_at: new Date().toISOString(), status: findings.length ? "V5_SMOKE_REJECTED" : "V5_SMOKE_TECHNICALLY_ACCEPTABLE_PHASE_1_COMPLETE", phase_gate: "STOP_BEFORE_GROUP_CV_NESTED_EVALUATION_CANDIDATE_FREEZE", run_id: capture.run_id, inputs: { capture: { sha256: createHash("sha256").update(captureBytes).digest("hex"), bytes: captureBytes.length }, audit: { sha256: createHash("sha256").update(auditBytes).digest("hex"), bytes: auditBytes.length } }, summary: capture.summary, findings };
process.stdout.write(`${JSON.stringify(review, null, 2)}\n`);
if (findings.length) process.exitCode = 1;
