import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertMinimalPilotPrivacy } from "../lib/option-b-v3-minimal-capture.mjs";

const sourceDir = path.resolve("outputs/development_v0_5_option_b_v3");
const destinationDir = path.join(sourceDir, "pilot_run_1");
const files = {
  capture: "option_b_local_pilot_capture_v1.json",
  audit: "option_b_local_pilot_attempt_audit_v1.json",
  review: "option_b_local_pilot_review_v1.json"
};

const loaded = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, name]) => {
  const bytes = await readFile(path.join(sourceDir, name));
  return [key, { name, bytes, value: JSON.parse(bytes.toString("utf8")), sha256: createHash("sha256").update(bytes).digest("hex") }];
})));

if (loaded.review.value.status !== "FIRST_RUN_TECHNICALLY_ACCEPTABLE_REPEAT_REQUIRED" || loaded.review.value.first_run_approved !== true) {
  throw new Error("Only a technically acceptable first run may be frozen.");
}
if (loaded.review.value.full_batch_approved !== false) throw new Error("First-run review must not approve the full batch.");
if (!loaded.capture.value.run_id || loaded.capture.value.run_id !== loaded.audit.value.run_id) throw new Error("Capture and audit run IDs do not match.");
if (loaded.review.value.inputs.capture.sha256 !== loaded.capture.sha256 || loaded.review.value.inputs.audit.sha256 !== loaded.audit.sha256) {
  throw new Error("Review input hashes do not match the current capture and audit.");
}
assertMinimalPilotPrivacy(loaded.capture.value);
assertMinimalPilotPrivacy(loaded.audit.value);

await mkdir(destinationDir, { recursive: false });
for (const item of Object.values(loaded)) await rename(path.join(sourceDir, item.name), path.join(destinationDir, item.name));

const frozen = {
  schema_version: "vibebench.option_b.local_pilot_freeze.v1",
  frozen_at: new Date().toISOString(),
  status: "FIRST_RUN_FROZEN_REPEAT_REQUIRED",
  run_id: loaded.capture.value.run_id,
  generated_at: loaded.capture.value.generated_at,
  runtime: loaded.capture.value.runtime,
  summary: loaded.review.value.summary,
  full_batch_approved: false,
  repeat_window: {
    minimum_separation_hours: 24,
    maximum_separation_hours: 72,
    earliest_utc: new Date(Date.parse(loaded.capture.value.generated_at) + 24 * 60 * 60 * 1000).toISOString(),
    latest_utc: new Date(Date.parse(loaded.capture.value.generated_at) + 72 * 60 * 60 * 1000).toISOString()
  },
  artifacts: Object.fromEntries(Object.entries(loaded).map(([key, item]) => [key, {
    path: path.relative(process.cwd(), path.join(destinationDir, item.name)),
    bytes: item.bytes.byteLength,
    sha256: item.sha256
  }]))
};
await writeFile(path.join(destinationDir, "option_b_local_pilot_freeze_v1.json"), `${JSON.stringify(frozen, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(frozen, null, 2)}\n`);
