import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { reviewOptionBV3Pilot } from "../lib/option-b-v3-pilot-review.mjs";

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const paths = {
  capture: path.resolve(argument("--capture", "outputs/development_v0_5_option_b_v3/option_b_local_pilot_capture_v1.json")),
  audit: path.resolve(argument("--audit", "outputs/development_v0_5_option_b_v3/option_b_local_pilot_attempt_audit_v1.json")),
  manifest: path.resolve(argument("--manifest", "outputs/development_v0_5_option_b_v3/option_b_local_pilot_manifest_v1.json")),
  captureContract: path.resolve(argument("--capture-contract", "outputs/development_v0_5_option_b_v3/option_b_capture_contract_v3.json")),
  reviewContract: path.resolve(argument("--review-contract", "outputs/development_v0_5_option_b_v3/option_b_pilot_review_contract_v1.json")),
  output: path.resolve(argument("--output", "outputs/development_v0_5_option_b_v3/option_b_local_pilot_review_v1.json"))
};

const entries = await Promise.all(Object.entries(paths).filter(([key]) => key !== "output").map(async ([key, filePath]) => [key, await readFile(filePath)]));
const buffers = Object.fromEntries(entries);
const parse = (key) => JSON.parse(buffers[key].toString("utf8"));
const capture = parse("capture");
const audit = parse("audit");
const manifest = parse("manifest");
const captureContract = parse("captureContract");
const reviewContract = parse("reviewContract");

const review = reviewOptionBV3Pilot({
  capture,
  audit,
  captureContract,
  reviewContract,
  expectedSampleIds: manifest.rows.map((row) => row.sample_id),
  captureBytes: buffers.capture.byteLength,
  auditBytes: buffers.audit.byteLength
});
const report = {
  ...review,
  generated_at: new Date().toISOString(),
  inputs: Object.fromEntries(Object.entries(buffers).map(([key, buffer]) => [key, {
    path: path.relative(process.cwd(), paths[key]),
    sha256: createHash("sha256").update(buffer).digest("hex")
  }]))
};
await writeFile(paths.output, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), paths.output), status: report.status, summary: report.summary, gates: report.gates }, null, 2)}\n`);
if (!report.first_run_approved) process.exitCode = 1;
