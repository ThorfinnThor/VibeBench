import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildOptionBVisibleFeatures,
  OPTION_B_EXCLUDED_SOURCE_FEATURES,
  OPTION_B_VISIBLE_FEATURE_NAMES
} from "../lib/option-b-visible-feature-contract-v2.mjs";

const matrixUrl = new URL("../outputs/development_v0_5_option_b/option_b_visible_feature_matrix_v2.json", import.meta.url);

test("Option-B v2 contract excludes identity, builder and framework shortcuts", () => {
  assert.equal(OPTION_B_VISIBLE_FEATURE_NAMES.length, 28);
  assert.equal(OPTION_B_VISIBLE_FEATURE_NAMES.some((name) => /host|url|provenance|builder|lovable|bolt|replit|v0|react|next|vite/i.test(name)), false);
  assert.deepEqual(OPTION_B_EXCLUDED_SOURCE_FEATURES.direct_builder_or_tool_markers, ["bolt", "lovable", "replit", "v0"]);
});

test("Option-B v2 ratios reconstruct log-count inputs deterministically", () => {
  const source = Object.fromEntries([
    "animation_classes", "arbitrary_classes", "aria", "article", "blur_classes", "buttons", "canonical", "canvases", "class_tokens", "cliches", "cta", "dark_classes", "data_attrs", "divs", "dom_tags", "faq", "favicon", "footers", "forms", "gradient_classes", "headings", "hover_classes", "html_chars", "images", "inputs", "jsonld", "labels", "list_items", "lists", "main", "meta", "modules", "navs", "og", "paragraphs", "pricing", "responsive_classes", "rounded_classes", "scripts", "sections", "shadow_classes", "stylesheets", "svgs", "tables", "tailwind_tokens", "testimonials", "text_chars", "twitter", "unique_classes", "videos", "words"
  ].map((name) => [name, 0]));
  source.class_tokens = Math.log1p(100);
  source.unique_classes = Math.log1p(25);
  source.dom_tags = Math.log1p(50);
  source.svgs = Math.log1p(3);
  source.images = Math.log1p(1);
  const features = buildOptionBVisibleFeatures(source);
  assert.equal(features.class_reuse_ratio, .75);
  assert.ok(Math.abs(features.class_density - Math.log1p(2)) < 1e-12);
  assert.ok(Math.abs(features.vector_asset_share - .75) < 1e-12);
  assert.equal(Object.values(features).every(Number.isFinite), true);
});

test("frozen Option-B v2 matrix matches the preregistered contract", async () => {
  const matrix = JSON.parse(await readFile(matrixUrl, "utf8"));
  assert.equal(matrix.research_status, "FEATURE_CONTRACT_FROZEN_BEFORE_V2_EVALUATION");
  assert.equal(matrix.contract.outcome_values_inspected_during_definition, false);
  assert.equal(matrix.contract.direct_builder_markers_used, false);
  assert.deepEqual(matrix.summary, { total: 81, strong_ai: 28, stable_human: 53, feature_count: 28 });
  assert.deepEqual(matrix.feature_names, OPTION_B_VISIBLE_FEATURE_NAMES);
  assert.equal(matrix.rows.every((row) => Object.values(row.features).every(Number.isFinite)), true);
});
