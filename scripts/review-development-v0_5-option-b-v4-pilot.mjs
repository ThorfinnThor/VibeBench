import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { assertOptionBV4Payload } from "../lib/option-b-v4-capture.mjs";

function argument(name, fallback) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; }
const capturePath = path.resolve(argument("--capture", "outputs/development_v0_5_option_b_v4/run-1/capture.json"));
const auditPath = path.resolve(argument("--audit", "outputs/development_v0_5_option_b_v4/run-1/attempt-audit.json"));
const [captureBytes, auditBytes] = await Promise.all([readFile(capturePath), readFile(auditPath)]);
const capture = JSON.parse(captureBytes);
const audit = JSON.parse(auditBytes);
const findings = [];
const isPilot = capture.schema_version === "vibebench.option_b.v4_pilot_capture.v1" && audit.schema_version === "vibebench.option_b.v4_pilot_attempt_audit.v1";
const isExtension20 = capture.schema_version === "vibebench.option_b.v4_extension_capture.v1" && audit.schema_version === "vibebench.option_b.v4_extension_attempt_audit.v1";
const isExtension81 = capture.schema_version === "vibebench.option_b.v4_extension_81_capture.v1" && audit.schema_version === "vibebench.option_b.v4_extension_81_attempt_audit.v1";
const expectedAttempts = isPilot ? 6 : isExtension20 ? 20 : isExtension81 ? 81 : 0;
if (!expectedAttempts) findings.push("schema_version");
if (capture.run_id !== audit.run_id || capture.summary.attempted !== expectedAttempts || audit.summary.attempted !== expectedAttempts) findings.push("run_or_attempt_count");
if (capture.inputs?.manifest?.sha256 !== audit.inputs?.manifest?.sha256 || capture.inputs?.contract?.sha256 !== audit.inputs?.contract?.sha256) findings.push("input_hash_mismatch");
if (capture.runtime?.isolation?.collector_direct_network !== false || capture.runtime?.isolation?.peer_pinning_egress !== true || capture.runtime?.isolation?.read_only_root !== true || capture.runtime?.isolation?.non_root !== true || capture.runtime?.isolation?.no_new_privileges !== true || capture.runtime?.isolation?.capabilities_dropped !== "ALL") findings.push("isolation_attestation");
if (!/^sha256:[a-f0-9]{64}$/.test(capture.runtime?.isolation?.collector_image_id || "") || !/^sha256:[a-f0-9]{64}$/.test(capture.runtime?.isolation?.egress_image_id || "")) findings.push("image_ids");
if (!capture.runtime?.isolation?.collector_base_digest?.includes("@sha256:") || !capture.runtime?.isolation?.egress_base_digest?.includes("@sha256:") || !/^[a-f0-9]{64}$/.test(capture.runtime?.isolation?.collector_source_sha256 || "") || !/^[a-f0-9]{64}$/.test(capture.runtime?.isolation?.egress_source_sha256 || "")) findings.push("base_or_source_fingerprints");
if (new Set(audit.attempts.map(({ sample_id }) => sample_id)).size !== expectedAttempts || audit.attempts.some((attempt) => "target_url" in attempt || "url" in attempt || "hostname" in attempt)) findings.push("attempt_identity_or_privacy");
for (const captureRow of capture.captures || []) {
  try { assertOptionBV4Payload(captureRow.payload); } catch (error) { findings.push(`payload:${captureRow.sample_id}:${error.message}`); }
}
const minimumSuccessful = isExtension81 ? 57 : isExtension20 ? 14 : 4;
if (capture.summary.successful < minimumSuccessful || capture.summary.successful !== capture.captures.length || audit.summary.successful !== capture.summary.successful) findings.push("technical_yield");
const review = {
  schema_version: "vibebench.option_b.v4_pilot_review.v1",
  generated_at: new Date().toISOString(),
  status: findings.length ? (isExtension81 ? "TECHNICAL_EXTENSION_81_REJECTED" : isExtension20 ? "TECHNICAL_EXTENSION_REJECTED" : "PILOT_REJECTED") : (isExtension81 ? "TECHNICAL_EXTENSION_81_ACCEPTABLE_MANUAL_REVIEW_REQUIRED" : isExtension20 ? "TECHNICAL_EXTENSION_ACCEPTABLE_MANUAL_REVIEW_REQUIRED" : "FIRST_RUN_TECHNICALLY_ACCEPTABLE_REPEAT_REQUIRED"),
  run_id: capture.run_id,
  inputs: { capture: { sha256: createHash("sha256").update(captureBytes).digest("hex"), bytes: captureBytes.length }, audit: { sha256: createHash("sha256").update(auditBytes).digest("hex"), bytes: auditBytes.length } },
  summary: capture.summary,
  minimum_successful: minimumSuccessful,
  findings
};
process.stdout.write(`${JSON.stringify(review, null, 2)}\n`);
if (findings.length) process.exitCode = 1;
