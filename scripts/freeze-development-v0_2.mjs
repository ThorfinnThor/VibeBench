import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const files = [
  "data/development-samples-v0_2.mjs",
  "outputs/development_v0_2/vibebench_development_extension_40_v0_2.json",
  "outputs/development_v0_2/vibebench_development_v0_2_freeze_audit.json"
];
const outputPath = path.resolve("outputs/development_v0_2/vibebench_development_v0_2_frozen_manifest.json");

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

const [sourceText, manifestText, auditText] = await Promise.all(files.map((file) => readFile(path.resolve(file), "utf8")));
const manifest = JSON.parse(manifestText);
const audit = JSON.parse(auditText);
if (manifest.samples?.length !== 40 || manifest.samples.some((row) => row.status !== "READY")) {
  throw new Error("Cannot freeze: Development manifest is not 40/40 READY.");
}
if (!audit.freeze_ready || audit.summary?.api_ok !== 40 || audit.summary?.level_matches !== 40 || audit.summary?.content_eligible !== 40) {
  throw new Error("Cannot freeze: reachability/baseline audit is not clean.");
}
if (audit.manifest_sha256 !== sha256(manifestText)) {
  throw new Error("Cannot freeze: audit was produced from a different Development manifest.");
}

const frozen = {
  schema_version: "v0.2-development-frozen-manifest",
  frozen_at: new Date().toISOString(),
  status: "FROZEN",
  purpose: "Immutable Development-only corpus for v0.2 rule research; not an independent evaluation set.",
  rows: 40,
  groups: manifest.groups,
  constraints: {
    completed_holdout_as_source: false,
    completed_holdout_for_tuning: false,
    production_rule_change_authorized: false,
    new_holdout_required_for_evaluation: true
  },
  files: Object.fromEntries(files.map((file, index) => [file, { sha256: sha256([sourceText, manifestText, auditText][index]) }]))
};
await writeFile(outputPath, `${JSON.stringify(frozen, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), status: frozen.status, rows: frozen.rows, files: frozen.files }, null, 2)}\n`);
