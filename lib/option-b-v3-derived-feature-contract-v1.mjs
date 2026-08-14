const shareTolerance = 0.05;
const logTolerance = 0.10;

export const OPTION_B_V3_DERIVED_FEATURE_DEFINITIONS = Object.freeze([
  { name: "page_height_viewports_log", group: "document", formula: "log1p(document_height / viewport_height)", drift_tolerance: logTolerance },
  { name: "visible_elements_log", group: "document", formula: "log1p(visible_element_count)", drift_tolerance: logTolerance },
  { name: "dom_nodes_log", group: "document", formula: "log1p(dom_node_count)", drift_tolerance: logTolerance },
  { name: "visible_element_share", group: "document", formula: "visible_element_count / dom_node_count", drift_tolerance: shareTolerance },
  { name: "text_chars_per_visible_log", group: "document", formula: "log1p(visible_text_character_count / visible_element_count)", drift_tolerance: logTolerance },
  { name: "words_per_visible_log", group: "document", formula: "log1p(visible_word_count / visible_element_count)", drift_tolerance: logTolerance },
  { name: "max_dom_depth_scaled", group: "document", formula: "min(dom_depth_max, 80) / 80", drift_tolerance: shareTolerance },
  { name: "region_density", group: "layout", formula: "layout_region_count / visible_element_count", drift_tolerance: shareTolerance },
  { name: "region_role_diversity", group: "layout", formula: "unique region roles / layout_region_count", drift_tolerance: shareTolerance },
  { name: "mean_region_height_viewports_log", group: "layout", formula: "log1p(mean normalized region height)", drift_tolerance: logTolerance },
  { name: "interactive_share", group: "composition", formula: "interactive elements / visible elements", drift_tolerance: shareTolerance },
  { name: "container_share", group: "composition", formula: "container elements / visible elements", drift_tolerance: shareTolerance },
  { name: "text_element_share", group: "composition", formula: "text or heading elements / visible elements", drift_tolerance: shareTolerance },
  { name: "media_element_share", group: "composition", formula: "media elements / visible elements", drift_tolerance: shareTolerance },
  { name: "form_element_share", group: "composition", formula: "form elements / visible elements", drift_tolerance: shareTolerance },
  { name: "list_element_share", group: "composition", formula: "list elements / visible elements", drift_tolerance: shareTolerance },
  { name: "semantic_role_share", group: "composition", formula: "elements with a semantic role / visible elements", drift_tolerance: shareTolerance },
  { name: "mean_depth_scaled", group: "composition", formula: "mean min(dom_depth, 80) / 80", drift_tolerance: shareTolerance },
  { name: "full_width_element_share", group: "geometry", formula: "elements with normalized width >= 0.9 / visible elements", drift_tolerance: shareTolerance },
  { name: "above_fold_share", group: "geometry", formula: "elements intersecting normalized vertical interval [0, 1] / visible elements", drift_tolerance: shareTolerance },
  { name: "flex_grid_share", group: "layout_style", formula: "elements with flex, inline-flex, grid or inline-grid display / visible elements", drift_tolerance: shareTolerance },
  { name: "positioned_share", group: "layout_style", formula: "elements with non-static position / visible elements", drift_tolerance: shareTolerance },
  { name: "system_sans_share", group: "typography", formula: "elements using system-sans category / visible elements", drift_tolerance: shareTolerance },
  { name: "large_type_share", group: "typography", formula: "elements with font size >= 24px / visible elements", drift_tolerance: shareTolerance },
  { name: "bold_type_share", group: "typography", formula: "elements with font weight >= 600 / visible elements", drift_tolerance: shareTolerance },
  { name: "font_size_diversity", group: "typography", formula: "unique rounded font sizes / visible elements", drift_tolerance: shareTolerance },
  { name: "positive_gap_share", group: "spacing_decoration", formula: "elements with positive row or column gap / visible elements", drift_tolerance: shareTolerance },
  { name: "positive_padding_share", group: "spacing_decoration", formula: "elements with any positive padding / visible elements", drift_tolerance: shareTolerance },
  { name: "nonzero_radius_share", group: "spacing_decoration", formula: "elements with any positive border radius / visible elements", drift_tolerance: shareTolerance },
  { name: "bordered_share", group: "spacing_decoration", formula: "elements with positive border width / visible elements", drift_tolerance: shareTolerance },
  { name: "shadow_share", group: "spacing_decoration", formula: "elements with non-none box shadow category / visible elements", drift_tolerance: shareTolerance },
  { name: "clipped_overflow_share", group: "spacing_decoration", formula: "elements with hidden, clip, scroll or auto overflow / visible elements", drift_tolerance: shareTolerance },
  { name: "structural_signature_reuse", group: "repetition", formula: "1 - unique structural signatures / visible elements", drift_tolerance: shareTolerance },
  { name: "style_signature_reuse", group: "repetition", formula: "1 - unique computed-style signatures / visible elements", drift_tolerance: shareTolerance },
  { name: "largest_structural_cluster_share", group: "repetition", formula: "largest structural signature count / visible elements", drift_tolerance: shareTolerance },
  { name: "largest_style_cluster_share", group: "repetition", formula: "largest computed-style signature count / visible elements", drift_tolerance: shareTolerance },
  { name: "repeated_sibling_share", group: "repetition", formula: "min(1, sum repeated sibling group sizes / visible elements)", drift_tolerance: shareTolerance },
  { name: "custom_properties_per_stylesheet_log", group: "public_css", formula: "log1p(custom property names / max(1, fetched stylesheets))", drift_tolerance: logTolerance },
  { name: "custom_property_type_diversity", group: "public_css", formula: "observed custom property value types / 9 known types", drift_tolerance: shareTolerance },
  { name: "media_queries_per_stylesheet_log", group: "public_css", formula: "log1p(media query count / max(1, fetched stylesheets))", drift_tolerance: logTolerance },
  { name: "stylesheet_readability_share", group: "public_css", formula: "fetched same-origin stylesheets / same-origin stylesheet candidates", drift_tolerance: shareTolerance },
  { name: "font_faces_log", group: "public_css", formula: "log1p(font face count)", drift_tolerance: logTolerance }
]);

export const OPTION_B_V3_DERIVED_FEATURE_NAMES = Object.freeze(
  OPTION_B_V3_DERIVED_FEATURE_DEFINITIONS.map(({ name }) => name)
);

const finite = (value, name) => {
  if (!Number.isFinite(value)) throw new Error(`Expected finite numeric ${name}`);
  return value;
};
const ratio = (numerator, denominator) => denominator > 0 ? numerator / denominator : 0;
const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const countWhere = (values, predicate) => values.reduce((count, value) => count + (predicate(value) ? 1 : 0), 0);
const rounded = (value) => Math.round(value * 1e8) / 1e8;

export function buildOptionBV3DerivedFeatures(payload) {
  if (!payload || typeof payload !== "object") throw new Error("Expected an Option B v3 payload object");
  const { document, layout_regions: regions, visible_elements: elements, repetition, public_assets: assets } = payload;
  if (!document || !Array.isArray(regions) || !Array.isArray(elements) || !repetition || !assets) {
    throw new Error("Incomplete Option B v3 payload");
  }
  if (document.visible_element_limit_reached) throw new Error("Visible element limit reached; derived features would be censored");
  if (elements.length !== document.visible_element_count) throw new Error("Visible element count does not match payload rows");

  const n = elements.length;
  const styles = elements.map((element) => element.computed_style || {});
  const structuralFrequency = repetition.structural_signature_frequency || [];
  const styleFrequency = repetition.computed_style_signature_frequency || [];
  const siblingSizes = repetition.repeated_sibling_group_sizes || [];
  const fetchedStylesheets = finite(assets.same_origin_stylesheets_fetched, "same_origin_stylesheets_fetched");
  const featureValues = {
    page_height_viewports_log: Math.log1p(ratio(document.document_height, document.viewport_height)),
    visible_elements_log: Math.log1p(document.visible_element_count),
    dom_nodes_log: Math.log1p(document.dom_node_count),
    visible_element_share: ratio(document.visible_element_count, document.dom_node_count),
    text_chars_per_visible_log: Math.log1p(ratio(document.visible_text_character_count, n)),
    words_per_visible_log: Math.log1p(ratio(document.visible_word_count, n)),
    max_dom_depth_scaled: Math.min(80, document.dom_depth_max) / 80,
    region_density: ratio(regions.length, n),
    region_role_diversity: ratio(new Set(regions.map((region) => region.region_role)).size, regions.length),
    mean_region_height_viewports_log: Math.log1p(mean(regions.map((region) => finite(region.normalized_height, "normalized region height")))),
    interactive_share: ratio(countWhere(elements, (element) => element.interactive === true), n),
    container_share: ratio(countWhere(elements, (element) => element.tag_category === "container"), n),
    text_element_share: ratio(countWhere(elements, (element) => ["text", "heading"].includes(element.tag_category)), n),
    media_element_share: ratio(countWhere(elements, (element) => element.tag_category === "media"), n),
    form_element_share: ratio(countWhere(elements, (element) => element.tag_category === "form"), n),
    list_element_share: ratio(countWhere(elements, (element) => element.tag_category === "list"), n),
    semantic_role_share: ratio(countWhere(elements, (element) => element.semantic_role !== "none"), n),
    mean_depth_scaled: ratio(mean(elements.map((element) => Math.min(80, finite(element.dom_depth, "dom_depth")))), 80),
    full_width_element_share: ratio(countWhere(elements, (element) => element.normalized_width >= 0.9), n),
    above_fold_share: ratio(countWhere(elements, (element) => element.normalized_y < 1 && element.normalized_y + element.normalized_height > 0), n),
    flex_grid_share: ratio(countWhere(styles, (style) => ["flex", "inline-flex", "grid", "inline-grid"].includes(style.display)), n),
    positioned_share: ratio(countWhere(styles, (style) => style.position !== "static"), n),
    system_sans_share: ratio(countWhere(styles, (style) => style.font_family_category === "system-sans"), n),
    large_type_share: ratio(countWhere(styles, (style) => style.font_size_px >= 24), n),
    bold_type_share: ratio(countWhere(styles, (style) => style.font_weight >= 600), n),
    font_size_diversity: ratio(new Set(styles.map((style) => style.font_size_px)).size, n),
    positive_gap_share: ratio(countWhere(styles, (style) => style.row_gap_px > 0 || style.column_gap_px > 0), n),
    positive_padding_share: ratio(countWhere(styles, (style) => [style.padding_top_px, style.padding_right_px, style.padding_bottom_px, style.padding_left_px].some((value) => value > 0)), n),
    nonzero_radius_share: ratio(countWhere(styles, (style) => [style.border_radius_tl_px, style.border_radius_tr_px, style.border_radius_br_px, style.border_radius_bl_px].some((value) => value > 0)), n),
    bordered_share: ratio(countWhere(styles, (style) => style.border_width_px > 0), n),
    shadow_share: ratio(countWhere(styles, (style) => style.box_shadow_category && style.box_shadow_category !== "none"), n),
    clipped_overflow_share: ratio(countWhere(styles, (style) => [style.overflow_x, style.overflow_y].some((value) => ["hidden", "clip", "scroll", "auto"].includes(value))), n),
    structural_signature_reuse: n ? 1 - structuralFrequency.length / n : 0,
    style_signature_reuse: n ? 1 - styleFrequency.length / n : 0,
    largest_structural_cluster_share: ratio(Math.max(0, ...structuralFrequency.map(({ count }) => count)), n),
    largest_style_cluster_share: ratio(Math.max(0, ...styleFrequency.map(({ count }) => count)), n),
    repeated_sibling_share: Math.min(1, ratio(siblingSizes.reduce((sum, value) => sum + value, 0), n)),
    custom_properties_per_stylesheet_log: Math.log1p(ratio(assets.css_custom_property_name_hashes?.length || 0, Math.max(1, fetchedStylesheets))),
    custom_property_type_diversity: Math.min(1, ratio(assets.css_custom_property_value_type?.length || 0, 9)),
    media_queries_per_stylesheet_log: Math.log1p(ratio(assets.media_query_count, Math.max(1, fetchedStylesheets))),
    stylesheet_readability_share: ratio(fetchedStylesheets, assets.same_origin_stylesheet_candidates),
    font_faces_log: Math.log1p(assets.font_face_count)
  };

  const keys = Object.keys(featureValues);
  if (keys.length !== OPTION_B_V3_DERIVED_FEATURE_NAMES.length || keys.some((key, index) => key !== OPTION_B_V3_DERIVED_FEATURE_NAMES[index])) {
    throw new Error("Executable feature order differs from the frozen definition order");
  }
  return Object.fromEntries(keys.map((key) => [key, rounded(finite(featureValues[key], key))]));
}
