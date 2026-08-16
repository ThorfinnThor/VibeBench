import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { aggregateOptionBV5Surface, assertOptionBV5Payload, OPTION_B_V5_COLLECTOR_VERSION } from "../lib/option-b-v5-capture.mjs";

const length = (kind = "zero", value = 0) => ({ kind, value });
const style = { display: "block", position: "static", font_primary_declared_category: "custom-family", font_fallback_declared_categories: ["generic-sans"], font_size: length("px", 16), font_weight: 400, line_height: length("keyword", null), letter_spacing: length("keyword", null), text_align: "start", padding_top: length(), padding_right: length(), padding_bottom: length(), padding_left: length(), margin_top: length(), margin_right: length(), margin_bottom: length(), margin_left: length(), row_gap: length("keyword", null), column_gap: length("keyword", null), border_radius_tl: length(), border_radius_tr: length(), border_radius_br: length(), border_radius_bl: length(), border_width: length(), box_shadow_category: "none", opacity: 1, overflow_x: "visible", overflow_y: "visible" };
const fixture = () => ({ document: { viewport_width: 390, viewport_height: 844, document_width: 390, document_height: 1100, visible_element_count: 2, visible_element_limit_reached: false, visible_text_character_count: 80, visible_word_count: 12, dom_depth_max: 3, dom_node_count: 5 }, layout_regions: [{ dom_preorder_index: 1, region_role: "main", normalized_x: 0, normalized_y: 0, normalized_width: 1, normalized_height: 1, visible_child_count: 1 }], elements: [{ dom_preorder_index: 1, parent_preorder_index: 0, tag_category: "region", semantic_role: "main", normalized_x: 0, normalized_y: 0, normalized_width: 1, normalized_height: 1, dom_depth: 2, visible_child_count: 1, interactive: false, structural_signature: "region|main|1|interactive", computed_style: style }, { dom_preorder_index: 2, parent_preorder_index: 1, tag_category: "interactive", semantic_role: "none", normalized_x: .1, normalized_y: .1, normalized_width: .2, normalized_height: .1, dom_depth: 3, visible_child_count: 0, interactive: true, structural_signature: "interactive|none|1|", computed_style: { ...style, display: "inline-block" } }], public_assets: { same_origin_stylesheet_candidates: 1, same_origin_stylesheets_fetched: 1, stylesheet_fetch_outcomes: { readable: 1, inaccessible: 0, capped: 0 }, css_custom_property_names: ["--space"], css_custom_property_value_types: ["length"], font_face_count: 0, media_query_count: 1, container_query_count: 0 } });

test("v5 owns a separate namespace and preserves the privacy-minimal capture schema", () => {
  const payload = aggregateOptionBV5Surface(fixture());
  assert.equal(assertOptionBV5Payload(payload), true);
  assert.match(OPTION_B_V5_COLLECTOR_VERSION, /^option-b-v5-/);
  assert.equal("target_url" in payload, false);
  assert.equal(payload.document.viewport_width, 390);
});

test("v5 extraction uses page-local caches and terminates CSS traversal at the frozen budget", async () => {
  const source = await readFile(new URL("../lib/option-b-v5-capture.mjs", import.meta.url), "utf8");
  assert.match(source, /new WeakMap\(\)/);
  assert.match(source, /isVisibleCached/);
  assert.match(source, /helper\.styleFor\(element\)/);
  assert.match(source, /helper\.depthFor\(element\)/);
  assert.match(source, /let budgetExhausted = false/);
  assert.match(source, /if \(budgetExhausted\) return/);
  assert.match(source, /option-b-v4-capture/);
});

test("v5 Development runner streams large capture rows instead of retaining the full payload matrix", async () => {
  const source = await readFile(new URL("../scripts/run-development-v0_6-option-b-v5-isolated.mjs", import.meta.url), "utf8");
  assert.match(source, /createWriteStream\(captureRowsPath/);
  assert.match(source, /atomicJsonWithRows\(outputPath, captureOutput, "captures"/);
  assert.match(source, /await unlink\(rowsFile\)/);
  assert.doesNotMatch(source, /captures\.push\(/);
});
