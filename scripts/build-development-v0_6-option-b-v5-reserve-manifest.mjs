import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildOptionBV5DevelopmentPackage,
  collectorManifest,
  OPTION_B_V5_DEVELOPMENT_FREEZE_AT,
  OPTION_B_V5_PRIMARY_QUOTAS,
  sha256Text
} from "../lib/option-b-v5-development-manifests.mjs";

const outputDir = path.resolve("outputs/development_v0_6_option_b_v5");
const browserPath = path.resolve("outputs/development_v0_5_option_b/option_b_browser_surface_matrix_v1.json");
const poolPath = path.resolve("outputs/development_v0_5/vibebench_development_v0_5_candidate_pool.json");
const exclusionPaths = [
  "outputs/confirmation_v0_2/vibebench_confirmation_holdout_100_v0_2.json",
  "outputs/confirmation_v0_3/vibebench_confirmation_holdout_100_v0_3.json",
  "outputs/confirmation_v0_4/vibebench_confirmation_holdout_100_v0_4.json"
].map((file) => path.resolve(file));
const outputPaths = {
  primary: path.join(outputDir, "option_b_v5_development_primary_manifest_v1.json"),
  reserve: path.join(outputDir, "option_b_v5_development_reserve_manifest_v1.json"),
  registry: path.join(outputDir, "option_b_v5_development_evaluation_registry_v1.json"),
  replacement: path.join(outputDir, "option_b_v5_development_replacement_policy_v1.json"),
  freeze: path.join(outputDir, "option_b_v5_development_package_v1.freeze.json")
};

const [browserText, poolText, ...exclusionTexts] = await Promise.all([
  readFile(browserPath, "utf8"),
  readFile(poolPath, "utf8"),
  ...exclusionPaths.map((file) => readFile(file, "utf8"))
]);
const browser = JSON.parse(browserText);
const pool = JSON.parse(poolText);
const excludedFamilies = new Set(exclusionTexts.flatMap((text) => {
  const value = JSON.parse(text);
  return (value.rows || value.samples || []).map(({ project_family_id }) => project_family_id).filter(Boolean);
}));
const built = buildOptionBV5DevelopmentPackage({ browserRows: browser.rows, poolRows: pool.candidates, excludedFamilies });
if (built.primary.length !== 200 || built.reserve.length < 50) throw new Error(`Expected 200 primary and at least 50 reserve rows; found ${built.primary.length}/${built.reserve.length}.`);

const sourceRecords = [
  { path: path.relative(process.cwd(), browserPath), sha256: sha256Text(browserText), schema_version: browser.schema_version },
  { path: path.relative(process.cwd(), poolPath), sha256: sha256Text(poolText), schema_version: pool.schema_version },
  ...exclusionTexts.map((text, index) => ({ path: path.relative(process.cwd(), exclusionPaths[index]), sha256: sha256Text(text), schema_version: JSON.parse(text).schema_version }))
];
const primary = collectorManifest({ rows: built.primary, partition: "primary", sources: sourceRecords });
const reserve = collectorManifest({ rows: built.reserve, partition: "reserve", sources: sourceRecords });
const registry = {
  schema_version: "vibebench.option_b.v5_development_evaluation_registry.v1",
  locked_at: OPTION_B_V5_DEVELOPMENT_FREEZE_AT,
  status: "LABELS_SEPARATE_FROM_COLLECTOR_MANIFESTS",
  estimand: "declared AI-builder provenance versus a pre-AI-origin public-site proxy; not authorship probability",
  target_group_definition: "project_family_id; all viewport rows for one family remain in the same evaluation fold",
  selection: { model_scores_inspected: false, prior_capture_features_inspected: false, confirmation_families_excluded: true },
  summary: {
    total: built.registry.length,
    primary: built.primary.length,
    reserve: built.reserve.length,
    primary_targets: Object.fromEntries([0, 1].map((target) => [target, built.primary.filter((row) => row.target === target).length])),
    reserve_targets: Object.fromEntries([0, 1].map((target) => [target, built.reserve.filter((row) => row.target === target).length]))
  },
  rows: built.registry
};
const replacement = {
  schema_version: "vibebench.option_b.v5_development_replacement_policy.v1",
  locked_at: OPTION_B_V5_DEVELOPMENT_FREEZE_AT,
  status: "PRE_REGISTERED_BEFORE_DEVELOPMENT_CAPTURE",
  eligible_failure_classes: ["http_not_found", "http_error", "dns_unresolved", "tcp_connection_failed", "tls_certificate_error", "ineligible_empty_or_interstitial", "capture_surface_unstable", "computed_style_extraction_failed", "structural_aggregation_failed", "unknown_technical_error"],
  prohibited_replacement_reasons: ["model_score", "prediction", "misclassification", "feature_value"],
  selection_rule: "For a terminal technical failure, choose the first unused reserve sample in the same frozen replacement bucket. Never inspect labels, features, predictions or scores during execution.",
  primary_bucket_by_sample_id: Object.fromEntries(built.primary.map(({ sample_id, replacement_bucket }) => [sample_id, replacement_bucket])),
  reserve_by_bucket: built.reserveByBucket
};
const serialized = Object.fromEntries(Object.entries({ primary, reserve, registry, replacement }).map(([key, value]) => [key, `${JSON.stringify(value, null, 2)}\n`]));
const freeze = {
  schema_version: "vibebench.option_b.v5_development_package_freeze.v1",
  locked_at: OPTION_B_V5_DEVELOPMENT_FREEZE_AT,
  status: "MANIFESTS_AND_REPLACEMENT_ORDER_FROZEN_FEATURE_SCHEMA_PENDING",
  capture_may_start: false,
  blocking_gate: "FEATURE_CONTRACT_V2_AND_EXPANSION_RUNTIME_MUST_BE_FROZEN",
  primary_quotas: OPTION_B_V5_PRIMARY_QUOTAS,
  artifacts: Object.fromEntries(Object.entries(serialized).map(([key, text]) => [key, { path: path.relative(process.cwd(), outputPaths[key]), sha256: createHash("sha256").update(text).digest("hex") }]))
};
serialized.freeze = `${JSON.stringify(freeze, null, 2)}\n`;

await mkdir(outputDir, { recursive: true });
for (const [key, text] of Object.entries(serialized)) {
  try {
    await writeFile(outputPaths[key], text, { flag: "wx", mode: 0o600 });
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    if (await readFile(outputPaths[key], "utf8") !== text) throw new Error(`Frozen v5 Development artifact differs: ${path.basename(outputPaths[key])}`);
  }
}
process.stdout.write(`${JSON.stringify({ outputs: Object.fromEntries(Object.entries(outputPaths).map(([key, file]) => [key, path.relative(process.cwd(), file)])), summary: registry.summary, reserves: Object.fromEntries(Object.entries(built.reserveByBucket).map(([key, rows]) => [key, rows.length])), capture_may_start: false }, null, 2)}\n`);
