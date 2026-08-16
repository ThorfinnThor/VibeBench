import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  OPTION_B_V5_DERIVED_FEATURE_SCHEMA,
  OPTION_B_V5_DERIVED_FEATURES,
  OPTION_B_V5_RESPONSIVE_FEATURES,
  OPTION_B_V5_VIEWPORT_FEATURES
} from "../lib/option-b-v5-derived-feature-contract.mjs";

const modulePath = path.resolve("lib/option-b-v5-derived-feature-contract.mjs");
const captureContractPath = path.resolve("outputs/development_v0_6_option_b_v5/option_b_capture_contract_v5.json");
const outputPath = path.resolve("outputs/development_v0_6_option_b_v5/option_b_v5_feature_contract_v2.freeze.json");
const [moduleText, captureContractText] = await Promise.all([readFile(modulePath, "utf8"), readFile(captureContractPath, "utf8")]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const output = {
  schema_version: "vibebench.option_b.v5_feature_contract_freeze.v2",
  locked_at: "2026-08-16T18:30:00.000Z",
  status: "FEATURE_CONTRACT_V2_FROZEN_FOR_DEVELOPMENT_CAPTURE",
  production_model_affected: false,
  contract: {
    schema_version: OPTION_B_V5_DERIVED_FEATURE_SCHEMA,
    row_granularity: "one site/project family with one desktop and one mobile payload",
    viewport_feature_count_each: OPTION_B_V5_VIEWPORT_FEATURES.length,
    responsive_feature_count: OPTION_B_V5_RESPONSIVE_FEATURES.length,
    total_feature_count: OPTION_B_V5_DERIVED_FEATURES.length,
    feature_names: OPTION_B_V5_DERIVED_FEATURES
  },
  implementation: { path: path.relative(process.cwd(), modulePath), sha256: sha256(moduleText) },
  capture_contract: { path: path.relative(process.cwd(), captureContractPath), sha256: sha256(captureContractText), schema_version: JSON.parse(captureContractText).schema_version },
  privacy: {
    consumes_aggregate_capture_payload_only: true,
    prohibited_inputs: ["target_url", "resolved_url", "hostname", "title", "raw_html", "full_visible_text", "label", "target", "target_group", "cohort", "provenance_url", "class_name", "id"],
    literal_font_names_persisted: false,
    literal_css_tokens_persisted: false
  },
  included_families: ["v4_compatibility", "frequency_shape", "typography_distribution", "spacing_geometry", "semantic_structure", "responsive_delta"],
  deferred_candidates: {
    public_ui_pattern_counters: ["tailwind_like_token_count", "responsive_variant_share", "hover_variant_share", "arbitrary_value_share", "gradient_pattern_count", "rounded_pattern_count", "shadow_pattern_count", "data_slot_count", "radix_attribute_count", "aria_state_attribute_count"],
    reason: "The successfully repeated v5 capture payload does not persist these counters. Adding them after the pilot would silently change the frozen collector contract; they require a later collector namespace and a new technical repeat."
  },
  gates: { all_values_must_be_finite: true, desktop_mobile_pair_required: true, labels_join_only_after_capture_freeze: true }
};
const serialized = `${JSON.stringify(output, null, 2)}\n`;
try {
  await writeFile(outputPath, serialized, { flag: "wx", mode: 0o600 });
} catch (error) {
  if (error?.code !== "EEXIST") throw error;
  if (await readFile(outputPath, "utf8") !== serialized) throw new Error("Frozen Feature Contract v2 differs from the current implementation.");
}
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), status: output.status, feature_count: OPTION_B_V5_DERIVED_FEATURES.length, sha256: sha256(serialized) }, null, 2)}\n`);
