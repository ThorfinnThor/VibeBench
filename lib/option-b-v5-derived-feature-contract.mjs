/*
 * Feature Contract v2 consumes only the frozen, privacy-minimal v5 browser
 * payload. It creates one row per site by combining desktop, mobile and
 * responsive deltas. URLs, text, labels, class names and provenance are not
 * accepted by this module.
 */
import { OPTION_B_V4_DERIVED_FEATURES, deriveOptionBV4Features } from "./option-b-v4-derived-feature-contract.mjs";

export const OPTION_B_V5_DERIVED_FEATURE_SCHEMA = "vibebench.option_b.v5_derived_feature_contract.v2";

const ADDITIONAL_VIEWPORT_FEATURES = [
  "repetition:structural_top1_share", "repetition:structural_top3_share", "repetition:structural_top10_share",
  "repetition:structural_entropy", "repetition:structural_effective_clusters",
  "repetition:style_top1_share", "repetition:style_top3_share", "repetition:style_top10_share",
  "repetition:style_entropy", "repetition:style_effective_clusters",
  "style:font_size_p25", "style:font_size_median", "style:font_size_p75", "style:font_size_iqr",
  "style:font_weight_diversity", "style:line_height_diversity", "style:letter_spacing_nonzero_share",
  "style:padding_value_diversity", "style:margin_value_diversity", "style:gap_value_diversity",
  "style:radius_median", "style:radius_p90", "style:radius_value_diversity",
  "layout:region_area_variance", "layout:x_alignment_concentration", "layout:y_alignment_concentration",
  "layout:region_aspect_ratio_diversity",
  "semantic:heading_share", "semantic:landmark_share", "semantic:landmark_diversity",
  "semantic:interactive_share", "semantic:form_control_share", "semantic:named_region_share",
  "semantic:list_share", "semantic:media_share"
];
export const OPTION_B_V5_VIEWPORT_FEATURES = Object.freeze([...OPTION_B_V4_DERIVED_FEATURES, ...ADDITIONAL_VIEWPORT_FEATURES]);
export const OPTION_B_V5_RESPONSIVE_FEATURES = Object.freeze([
  "responsive:visible_element_delta", "responsive:document_height_ratio", "responsive:document_width_ratio",
  "responsive:region_count_delta", "responsive:interactive_share_delta", "responsive:semantic_role_share_delta",
  "responsive:style_cluster_delta", "responsive:layout_reflow_score", "responsive:navigation_structure_delta"
]);
export const OPTION_B_V5_DERIVED_FEATURES = Object.freeze([
  ...["desktop", "mobile"].flatMap((viewport) => OPTION_B_V5_VIEWPORT_FEATURES.map((name) => `${viewport}:${name}`)),
  ...OPTION_B_V5_RESPONSIVE_FEATURES
]);

const finite = (value) => Number.isFinite(value) ? value : 0;
const share = (numerator, denominator) => finite(numerator) / Math.max(1, finite(denominator));
const signedShare = (next, previous) => (finite(next) - finite(previous)) / Math.max(1, finite(previous));
const lengthValue = (value) => value && ["px", "percent", "zero"].includes(value.kind) ? finite(value.value) : null;
const keyForLength = (value) => value && `${value.kind}:${value.value ?? "null"}`;
const quantile = (values, q) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
};
const diversity = (values) => share(new Set(values.filter((value) => value !== null && value !== undefined && value !== "")).size, values.length);
const variance = (values) => {
  if (!values.length) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + ((value - average) ** 2), 0) / values.length;
};
const concentration = (values) => values.length ? Math.max(...Object.values(values.reduce((counts, value) => {
  const key = String(Math.round(finite(value) * 100) / 100);
  counts[key] = (counts[key] || 0) + 1;
  return counts;
}, {}))) / values.length : 0;
const frequencyShape = (rows, total) => {
  const counts = rows.map(({ count }) => count).filter(Number.isFinite).sort((left, right) => right - left);
  const denominator = Math.max(1, total);
  const probabilities = counts.map((count) => count / denominator);
  const entropy = probabilities.reduce((sum, probability) => probability > 0 ? sum - probability * Math.log2(probability) : sum, 0);
  return {
    top1_share: (counts[0] || 0) / denominator,
    top3_share: counts.slice(0, 3).reduce((sum, count) => sum + count, 0) / denominator,
    top10_share: counts.slice(0, 10).reduce((sum, count) => sum + count, 0) / denominator,
    entropy,
    effective_clusters: 2 ** entropy
  };
};

export function deriveOptionBV5ViewportFeatures(payload) {
  const features = { ...deriveOptionBV4Features(payload) };
  const elements = payload.visible_elements;
  const styles = elements.map(({ computed_style }) => computed_style);
  const regions = payload.layout_regions;
  const count = elements.length;
  const structural = frequencyShape(payload.repetition.structural_signature_frequency, count);
  const style = frequencyShape(payload.repetition.computed_style_signature_frequency, count);
  for (const [prefix, shape] of [["structural", structural], ["style", style]]) {
    for (const [name, value] of Object.entries(shape)) features[`repetition:${prefix}_${name}`] = value;
  }
  const fontSizes = styles.map(({ font_size }) => font_size?.kind === "px" ? finite(font_size.value) : null).filter((value) => value !== null);
  features["style:font_size_p25"] = quantile(fontSizes, 0.25);
  features["style:font_size_median"] = quantile(fontSizes, 0.5);
  features["style:font_size_p75"] = quantile(fontSizes, 0.75);
  features["style:font_size_iqr"] = features["style:font_size_p75"] - features["style:font_size_p25"];
  features["style:font_weight_diversity"] = diversity(styles.map(({ font_weight }) => font_weight));
  features["style:line_height_diversity"] = diversity(styles.map(({ line_height }) => keyForLength(line_height)));
  features["style:letter_spacing_nonzero_share"] = share(styles.filter(({ letter_spacing }) => Math.abs(lengthValue(letter_spacing) || 0) > 0).length, count);
  const valuesFor = (keys) => styles.flatMap((item) => keys.map((key) => keyForLength(item[key])));
  const paddingKeys = ["padding_top", "padding_right", "padding_bottom", "padding_left"];
  const marginKeys = ["margin_top", "margin_right", "margin_bottom", "margin_left"];
  const gapKeys = ["row_gap", "column_gap"];
  const radiusKeys = ["border_radius_tl", "border_radius_tr", "border_radius_br", "border_radius_bl"];
  features["style:padding_value_diversity"] = diversity(valuesFor(paddingKeys));
  features["style:margin_value_diversity"] = diversity(valuesFor(marginKeys));
  features["style:gap_value_diversity"] = diversity(valuesFor(gapKeys));
  const radii = styles.flatMap((item) => radiusKeys.map((key) => lengthValue(item[key]))).filter((value) => value !== null && value >= 0);
  features["style:radius_median"] = quantile(radii, 0.5);
  features["style:radius_p90"] = quantile(radii, 0.9);
  features["style:radius_value_diversity"] = diversity(valuesFor(radiusKeys));
  const areas = regions.map(({ normalized_width, normalized_height }) => Math.max(0, normalized_width * normalized_height));
  features["layout:region_area_variance"] = variance(areas);
  features["layout:x_alignment_concentration"] = concentration(regions.map(({ normalized_x }) => normalized_x));
  features["layout:y_alignment_concentration"] = concentration(regions.map(({ normalized_y }) => normalized_y));
  features["layout:region_aspect_ratio_diversity"] = diversity(regions.map(({ normalized_width, normalized_height }) => Math.round(share(normalized_width, normalized_height) * 10) / 10));
  const landmarks = new Set(["banner", "navigation", "main", "region", "article", "complementary", "contentinfo", "form", "search"]);
  features["semantic:heading_share"] = share(elements.filter(({ tag_category, semantic_role }) => tag_category === "heading" || semantic_role === "heading").length, count);
  features["semantic:landmark_share"] = share(elements.filter(({ semantic_role }) => landmarks.has(semantic_role)).length, count);
  features["semantic:landmark_diversity"] = diversity(elements.filter(({ semantic_role }) => landmarks.has(semantic_role)).map(({ semantic_role }) => semantic_role));
  features["semantic:interactive_share"] = share(elements.filter(({ interactive }) => interactive).length, count);
  features["semantic:form_control_share"] = share(elements.filter(({ tag_category, semantic_role }) => tag_category === "form" || ["textbox", "searchbox", "combobox", "checkbox", "radio", "switch", "slider", "spinbutton"].includes(semantic_role)).length, count);
  features["semantic:named_region_share"] = share(elements.filter(({ semantic_role }) => semantic_role === "region").length, count);
  features["semantic:list_share"] = share(elements.filter(({ tag_category, semantic_role }) => tag_category === "list" || ["list", "listitem"].includes(semantic_role)).length, count);
  features["semantic:media_share"] = share(elements.filter(({ tag_category, semantic_role }) => tag_category === "media" || ["img", "figure"].includes(semantic_role)).length, count);
  assertFeatureMap(features, OPTION_B_V5_VIEWPORT_FEATURES, "viewport");
  return features;
}

const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const layoutReflow = (desktop, mobile) => {
  const byRole = (regions) => regions.reduce((map, region) => {
    if (!map.has(region.region_role)) map.set(region.region_role, []);
    map.get(region.region_role).push(region);
    return map;
  }, new Map());
  const left = byRole(desktop.layout_regions);
  const right = byRole(mobile.layout_regions);
  const roles = new Set([...left.keys(), ...right.keys()]);
  const distances = [];
  for (const role of roles) {
    const a = (left.get(role) || []).sort((x, y) => x.normalized_y - y.normalized_y);
    const b = (right.get(role) || []).sort((x, y) => x.normalized_y - y.normalized_y);
    const length = Math.max(a.length, b.length);
    for (let index = 0; index < length; index += 1) {
      if (!a[index] || !b[index]) distances.push(1);
      else distances.push(mean(["normalized_x", "normalized_y", "normalized_width", "normalized_height"].map((key) => Math.min(1, Math.abs(a[index][key] - b[index][key])))));
    }
  }
  return mean(distances);
};

export function deriveOptionBV5ResponsiveFeatures({ desktop, mobile }) {
  const desktopCount = desktop.visible_elements.length;
  const mobileCount = mobile.visible_elements.length;
  const interactive = (payload) => share(payload.visible_elements.filter(({ interactive: value }) => value).length, payload.visible_elements.length);
  const semantic = (payload) => share(payload.visible_elements.filter(({ semantic_role }) => semantic_role !== "none").length, payload.visible_elements.length);
  const styleClusters = (payload) => payload.repetition.computed_style_signature_frequency.length;
  const navigationCount = (payload) => payload.visible_elements.filter(({ semantic_role }) => semantic_role === "navigation").length;
  const features = {
    "responsive:visible_element_delta": signedShare(mobileCount, desktopCount),
    "responsive:document_height_ratio": share(mobile.document.document_height, desktop.document.document_height),
    "responsive:document_width_ratio": share(mobile.document.document_width, desktop.document.document_width),
    "responsive:region_count_delta": signedShare(mobile.layout_regions.length, desktop.layout_regions.length),
    "responsive:interactive_share_delta": interactive(mobile) - interactive(desktop),
    "responsive:semantic_role_share_delta": semantic(mobile) - semantic(desktop),
    "responsive:style_cluster_delta": signedShare(styleClusters(mobile), styleClusters(desktop)),
    "responsive:layout_reflow_score": layoutReflow(desktop, mobile),
    "responsive:navigation_structure_delta": signedShare(navigationCount(mobile), navigationCount(desktop))
  };
  assertFeatureMap(features, OPTION_B_V5_RESPONSIVE_FEATURES, "responsive");
  return features;
}

export function deriveOptionBV5Features({ desktop, mobile }) {
  const desktopFeatures = deriveOptionBV5ViewportFeatures(desktop);
  const mobileFeatures = deriveOptionBV5ViewportFeatures(mobile);
  const features = {
    ...Object.fromEntries(Object.entries(desktopFeatures).map(([name, value]) => [`desktop:${name}`, value])),
    ...Object.fromEntries(Object.entries(mobileFeatures).map(([name, value]) => [`mobile:${name}`, value])),
    ...deriveOptionBV5ResponsiveFeatures({ desktop, mobile })
  };
  assertOptionBV5DerivedFeatures(features);
  return features;
}

function assertFeatureMap(features, expected, context) {
  if (!features || typeof features !== "object" || Array.isArray(features)) throw new Error(`${context} features must be an object.`);
  const actual = Object.keys(features).sort();
  const wanted = [...expected].sort();
  if (actual.join("\0") !== wanted.join("\0")) throw new Error(`${context} feature map does not match the frozen contract.`);
  for (const name of expected) if (!Number.isFinite(features[name])) throw new Error(`${context} feature ${name} is not finite.`);
  return true;
}

export function assertOptionBV5DerivedFeatures(features) {
  return assertFeatureMap(features, OPTION_B_V5_DERIVED_FEATURES, "paired");
}
