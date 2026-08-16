/*
 * Privacy-minimal, label-blind derived features for the Option-B v4 browser
 * surface.  This module deliberately consumes only the frozen capture payload;
 * URLs, text, titles, hostnames and provenance are never used as features.
 */

export const OPTION_B_V4_DERIVED_FEATURE_SCHEMA = "vibebench.option_b.v4_derived_feature_contract.v1";

export const OPTION_B_V4_DERIVED_FEATURES = [
  "document:visible_elements_log1p", "document:dom_nodes_log1p", "document:text_characters_log1p",
  "document:words_log1p", "document:dom_depth_log1p", "document:height_per_viewport_log1p",
  "document:width_per_viewport", "layout:region_count_log1p", "layout:role_diversity",
  "layout:visible_children_mean_log1p", "layout:area_median", "elements:interactive_share",
  "elements:semantic_role_share", "elements:media_share", "elements:text_share",
  "repetition:structural_unique_share", "repetition:style_unique_share", "repetition:structural_repeated_share",
  "repetition:style_repeated_share", "repetition:sibling_group_mass_log1p", "style:custom_font_share",
  "style:monospace_share", "style:fixed_position_share", "style:absolute_position_share",
  "style:flex_grid_share", "style:display_diversity", "style:radius_share", "style:shadow_share",
  "style:padding_share", "style:margin_share", "style:gap_share", "assets:stylesheet_candidates_log1p",
  "assets:stylesheet_fetch_share", "assets:font_face_count_log1p", "assets:media_query_count_log1p",
  "assets:container_query_count_log1p", "assets:custom_property_count_log1p", "assets:value_type_diversity"
];

const finite = (value) => Number.isFinite(value) ? value : 0;
const log1p = (value) => Math.log1p(Math.max(0, finite(value)));
const share = (numerator, denominator) => finite(numerator) / Math.max(1, finite(denominator));
const lengthValue = (value) => value && ["px", "percent"].includes(value.kind) ? finite(value.value) : 0;
const median = (values) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const diversity = (values) => share(new Set(values.filter(Boolean)).size, values.length);

export function deriveOptionBV4Features(payload) {
  const document = payload.document;
  const elements = payload.visible_elements;
  const regions = payload.layout_regions;
  const repetition = payload.repetition;
  const assets = payload.public_assets;
  const count = elements.length;
  const styles = elements.map(({ computed_style: style }) => style);
  const nonZeroLength = (style, keys) => keys.some((key) => lengthValue(style[key]) > 0);
  const structuralCounts = repetition.structural_signature_frequency.map(({ count: value }) => value);
  const styleCounts = repetition.computed_style_signature_frequency.map(({ count: value }) => value);
  const siblingMass = repetition.repeated_sibling_group_sizes.reduce((sum, value) => sum + value, 0);
  const flexGrid = styles.filter((style) => ["flex", "inline-flex", "grid", "inline-grid"].includes(style.display)).length;
  const fontCounts = styles.reduce((counts, style) => {
    counts[style.font_primary_declared_category] = (counts[style.font_primary_declared_category] || 0) + 1;
    return counts;
  }, {});
  const features = {
    "document:visible_elements_log1p": log1p(document.visible_element_count),
    "document:dom_nodes_log1p": log1p(document.dom_node_count),
    "document:text_characters_log1p": log1p(document.visible_text_character_count),
    "document:words_log1p": log1p(document.visible_word_count),
    "document:dom_depth_log1p": log1p(document.dom_depth_max),
    "document:height_per_viewport_log1p": log1p(document.document_height / Math.max(1, document.viewport_height)),
    "document:width_per_viewport": share(document.document_width, document.viewport_width),
    "layout:region_count_log1p": log1p(regions.length),
    "layout:role_diversity": diversity(regions.map((region) => region.region_role)),
    "layout:visible_children_mean_log1p": log1p(regions.reduce((sum, region) => sum + region.visible_child_count, 0) / Math.max(1, regions.length)),
    "layout:area_median": median(regions.map((region) => Math.max(0, region.normalized_width * region.normalized_height))),
    "elements:interactive_share": share(elements.filter((element) => element.interactive).length, count),
    "elements:semantic_role_share": share(elements.filter((element) => element.semantic_role !== "none").length, count),
    "elements:media_share": share(elements.filter((element) => element.tag_category === "media").length, count),
    "elements:text_share": share(elements.filter((element) => element.tag_category === "text").length, count),
    "repetition:structural_unique_share": share(structuralCounts.length, count),
    "repetition:style_unique_share": share(styleCounts.length, count),
    "repetition:structural_repeated_share": share(structuralCounts.filter((value) => value >= 2).reduce((sum, value) => sum + value, 0), count),
    "repetition:style_repeated_share": share(styleCounts.filter((value) => value >= 2).reduce((sum, value) => sum + value, 0), count),
    "repetition:sibling_group_mass_log1p": log1p(siblingMass),
    "style:custom_font_share": share(fontCounts["custom-family"], count),
    "style:monospace_share": share(fontCounts["generic-monospace"], count),
    "style:fixed_position_share": share(styles.filter((style) => style.position === "fixed").length, count),
    "style:absolute_position_share": share(styles.filter((style) => style.position === "absolute").length, count),
    "style:flex_grid_share": share(flexGrid, count),
    "style:display_diversity": diversity(styles.map((style) => style.display)),
    "style:radius_share": share(styles.filter((style) => nonZeroLength(style, ["border_radius_tl", "border_radius_tr", "border_radius_br", "border_radius_bl"])).length, count),
    "style:shadow_share": share(styles.filter((style) => style.box_shadow_category !== "none").length, count),
    "style:padding_share": share(styles.filter((style) => nonZeroLength(style, ["padding_top", "padding_right", "padding_bottom", "padding_left"])).length, count),
    "style:margin_share": share(styles.filter((style) => nonZeroLength(style, ["margin_top", "margin_right", "margin_bottom", "margin_left"])).length, count),
    "style:gap_share": share(styles.filter((style) => nonZeroLength(style, ["row_gap", "column_gap"])).length, count),
    "assets:stylesheet_candidates_log1p": log1p(assets.same_origin_stylesheet_candidates),
    "assets:stylesheet_fetch_share": share(assets.same_origin_stylesheets_fetched, assets.same_origin_stylesheet_candidates),
    "assets:font_face_count_log1p": log1p(assets.font_face_count),
    "assets:media_query_count_log1p": log1p(assets.media_query_count),
    "assets:container_query_count_log1p": log1p(assets.container_query_count),
    "assets:custom_property_count_log1p": log1p(assets.css_custom_property_name_hashes.length),
    "assets:value_type_diversity": diversity(assets.css_custom_property_value_type.map(({ value_type }) => value_type))
  };
  for (const name of OPTION_B_V4_DERIVED_FEATURES) {
    if (!Object.hasOwn(features, name) || !Number.isFinite(features[name])) throw new Error(`Invalid derived feature ${name}.`);
  }
  return features;
}

export function assertOptionBV4DerivedFeatures(features) {
  const actual = Object.keys(features).sort();
  const expected = [...OPTION_B_V4_DERIVED_FEATURES].sort();
  if (actual.join("\0") !== expected.join("\0")) throw new Error("Derived feature map does not match the frozen contract.");
  for (const name of OPTION_B_V4_DERIVED_FEATURES) if (!Number.isFinite(features[name])) throw new Error(`Derived feature ${name} is not finite.`);
  return true;
}
