import { readFile } from "node:fs/promises";
import path from "node:path";

function argument(name) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : null; }
const firstPath = path.resolve(argument("--first") || "outputs/development_v0_5_option_b_v4/run-1/capture.json");
const secondPath = path.resolve(argument("--second") || "outputs/development_v0_5_option_b_v4/run-2/capture.json");
const [first, second] = await Promise.all([firstPath, secondPath].map(async (file) => JSON.parse(await readFile(file, "utf8"))));
const hours = (Date.parse(second.generated_at) - Date.parse(first.generated_at)) / 3600000;
const firstBySample = new Map(first.captures.map((row) => [row.sample_id, row]));
const secondBySample = new Map(second.captures.map((row) => [row.sample_id, row]));
const common = [...firstBySample.keys()].filter((sampleId) => secondBySample.has(sampleId));
const samples = common.map((sampleId) => {
  const left = firstBySample.get(sampleId).payload;
  const right = secondBySample.get(sampleId).payload;
  const leftSignatures = new Set(left.repetition.structural_signature_frequency.map(({ signature_hash }) => signature_hash));
  const rightSignatures = new Set(right.repetition.structural_signature_frequency.map(({ signature_hash }) => signature_hash));
  const intersection = [...leftSignatures].filter((value) => rightSignatures.has(value)).length;
  const union = new Set([...leftSignatures, ...rightSignatures]).size;
  return { sample_id: sampleId, visible_element_delta_share: Math.abs(left.document.visible_element_count - right.document.visible_element_count) / Math.max(1, left.document.visible_element_count), structural_signature_jaccard: union ? intersection / union : 1 };
});
const gates = {
  elapsed_24_to_72_hours: hours >= 24 && hours <= 72,
  same_manifest_and_contract: first.inputs?.manifest?.sha256 === second.inputs?.manifest?.sha256 && first.inputs?.contract?.sha256 === second.inputs?.contract?.sha256,
  same_runtime_sources: first.runtime?.isolation?.collector_base_digest === second.runtime?.isolation?.collector_base_digest && first.runtime?.isolation?.egress_base_digest === second.runtime?.isolation?.egress_base_digest && first.runtime?.isolation?.collector_source_sha256 === second.runtime?.isolation?.collector_source_sha256 && first.runtime?.isolation?.egress_source_sha256 === second.runtime?.isolation?.egress_source_sha256,
  each_run_at_least_four_successes: first.summary?.successful >= 4 && second.summary?.successful >= 4,
  at_least_four_common_successes: common.length >= 4
};
const integrityPassed = Object.values(gates).every(Boolean);
const result = {
  schema_version: "vibebench.option_b.v4_pilot_repeat_comparison.v1",
  generated_at: new Date().toISOString(),
  status: integrityPassed ? "REPEAT_INTEGRITY_ACCEPTABLE_MANUAL_TECHNICAL_REVIEW_REQUIRED" : "REPEAT_INTEGRITY_REJECTED",
  elapsed_hours: hours,
  gates,
  summary: { first: first.summary, second: second.summary, common_successes: common.length },
  descriptive_stability_only: { samples },
  next_gate: "Only after manual technical review may one fixed 20-site extension be approved; the 81-site run remains prohibited."
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!integrityPassed) process.exitCode = 1;
