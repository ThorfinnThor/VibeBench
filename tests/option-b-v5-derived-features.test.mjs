import assert from "node:assert/strict";
import test from "node:test";
import { aggregateOptionBV5Surface, assertOptionBV5Payload } from "../lib/option-b-v5-capture.mjs";
import { assertOptionBV5DerivedFeatures, deriveOptionBV5Features, OPTION_B_V5_DERIVED_FEATURES } from "../lib/option-b-v5-derived-feature-contract.mjs";

const zero = { kind: "zero", value: 0 };
const keyword = { kind: "keyword", value: null };
const style = { display: "block", position: "static", font_primary_declared_category: "generic-sans", font_fallback_declared_categories: [], font_size: { kind: "px", value: 16 }, font_weight: 400, line_height: keyword, letter_spacing: keyword, text_align: "start", padding_top: zero, padding_right: zero, padding_bottom: zero, padding_left: zero, margin_top: zero, margin_right: zero, margin_bottom: zero, margin_left: zero, row_gap: keyword, column_gap: keyword, border_radius_tl: zero, border_radius_tr: zero, border_radius_br: zero, border_radius_bl: zero, border_width: zero, box_shadow_category: "none", opacity: 1, overflow_x: "visible", overflow_y: "visible" };
const raw = { document: { viewport_width: 1440, viewport_height: 900, document_width: 1440, document_height: 900, visible_element_count: 1, visible_element_limit_reached: false, visible_text_character_count: 100, visible_word_count: 20, dom_depth_max: 2, dom_node_count: 2 }, layout_regions: [{ dom_preorder_index: 1, region_role: "main", normalized_x: 0, normalized_y: 0, normalized_width: 1, normalized_height: 1, visible_child_count: 0 }], elements: [{ dom_preorder_index: 1, parent_preorder_index: 0, tag_category: "region", semantic_role: "main", normalized_x: 0, normalized_y: 0, normalized_width: 1, normalized_height: 1, dom_depth: 2, visible_child_count: 0, interactive: false, structural_signature: "main", computed_style: style }], public_assets: { same_origin_stylesheet_candidates: 0, same_origin_stylesheets_fetched: 0, stylesheet_fetch_outcomes: { readable: 0, inaccessible: 0, capped: 0 }, css_custom_property_names: [], css_custom_property_value_types: [], font_face_count: 0, media_query_count: 0, container_query_count: 0 } };

test("v5 derived features are finite, fixed and URL-independent", () => {
  const payload = aggregateOptionBV5Surface(raw);
  assert.equal(assertOptionBV5Payload(payload), true);
  const features = deriveOptionBV5Features(payload);
  assert.equal(assertOptionBV5DerivedFeatures(features), true);
  assert.equal(Object.keys(features).length, OPTION_B_V5_DERIVED_FEATURES.length);
  assert.equal(Object.values(features).every(Number.isFinite), true);
});
