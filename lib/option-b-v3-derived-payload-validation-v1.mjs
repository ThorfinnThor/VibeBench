const HASH = /^[a-f0-9]{64}$/;
const REQUIRED_STYLE_FIELDS = Object.freeze([
  "display", "position", "font_family_category", "font_size_px", "font_weight",
  "row_gap_px", "column_gap_px", "padding_top_px", "padding_right_px",
  "padding_bottom_px", "padding_left_px", "border_radius_tl_px",
  "border_radius_tr_px", "border_radius_br_px", "border_radius_bl_px",
  "border_width_px", "box_shadow_category", "overflow_x", "overflow_y"
]);

const object = (value, name) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Expected object ${name}`);
  return value;
};
const array = (value, name) => {
  if (!Array.isArray(value)) throw new Error(`Expected array ${name}`);
  return value;
};
const finite = (value, name, minimum = 0) => {
  if (!Number.isFinite(value) || value < minimum) throw new Error(`Invalid numeric ${name}`);
  return value;
};
const integer = (value, name, minimum = 0) => {
  if (!Number.isInteger(value) || value < minimum) throw new Error(`Invalid integer ${name}`);
  return value;
};
const frequency = (rows, name, expectedTotal) => {
  const seen = new Set();
  let total = 0;
  for (const [index, row] of array(rows, name).entries()) {
    object(row, `${name}[${index}]`);
    if (!HASH.test(row.signature_hash) || seen.has(row.signature_hash)) throw new Error(`Invalid or duplicate hash in ${name}`);
    seen.add(row.signature_hash);
    total += integer(row.count, `${name}[${index}].count`, 1);
  }
  if (total !== expectedTotal) throw new Error(`${name} counts ${total}, expected ${expectedTotal}`);
};

export function assertOptionBV3DerivedPayload(payload) {
  object(payload, "payload");
  const document = object(payload.document, "document");
  const elements = array(payload.visible_elements, "visible_elements");
  const regions = array(payload.layout_regions, "layout_regions");
  const repetition = object(payload.repetition, "repetition");
  const assets = object(payload.public_assets, "public_assets");
  const n = integer(document.visible_element_count, "document.visible_element_count", 1);
  if (elements.length !== n) throw new Error("Visible element count does not match payload rows");
  finite(document.document_height, "document.document_height", 1);
  finite(document.viewport_height, "document.viewport_height", 1);
  integer(document.dom_node_count, "document.dom_node_count", n);
  integer(document.visible_text_character_count, "document.visible_text_character_count");
  integer(document.visible_word_count, "document.visible_word_count");
  integer(document.dom_depth_max, "document.dom_depth_max");
  if (typeof document.visible_element_limit_reached !== "boolean") throw new Error("Invalid visible_element_limit_reached");

  const preorder = new Set();
  for (const [index, element] of elements.entries()) {
    object(element, `visible_elements[${index}]`);
    const id = integer(element.dom_preorder_index, `visible_elements[${index}].dom_preorder_index`, 1);
    if (preorder.has(id)) throw new Error("Duplicate dom_preorder_index");
    preorder.add(id);
    for (const key of ["normalized_x", "normalized_y", "normalized_width", "normalized_height"]) finite(element[key], `visible_elements[${index}].${key}`, key.includes("width") || key.includes("height") ? Number.EPSILON : -Infinity);
    integer(element.dom_depth, `visible_elements[${index}].dom_depth`);
    integer(element.visible_child_count, `visible_elements[${index}].visible_child_count`);
    if (typeof element.interactive !== "boolean") throw new Error(`Invalid visible_elements[${index}].interactive`);
    if (!HASH.test(element.structural_signature_hash) || !HASH.test(element.computed_style_signature_hash)) throw new Error("Invalid element signature hash");
    const style = object(element.computed_style, `visible_elements[${index}].computed_style`);
    for (const field of REQUIRED_STYLE_FIELDS) {
      if (!(field in style)) throw new Error(`Missing computed style field ${field}`);
      if (field.endsWith("_px") || field === "font_weight") finite(style[field], `computed_style.${field}`);
      else if (typeof style[field] !== "string") throw new Error(`Invalid computed style field ${field}`);
    }
  }

  for (const [index, region] of regions.entries()) {
    object(region, `layout_regions[${index}]`);
    if (typeof region.region_role !== "string") throw new Error("Invalid layout region role");
    for (const key of ["normalized_x", "normalized_y", "normalized_width", "normalized_height"]) finite(region[key], `layout_regions[${index}].${key}`, key.includes("width") || key.includes("height") ? Number.EPSILON : -Infinity);
    if (region.structural_signature_hash !== null && !HASH.test(region.structural_signature_hash)) throw new Error("Invalid layout region signature hash");
  }

  frequency(repetition.structural_signature_frequency, "structural_signature_frequency", n);
  frequency(repetition.computed_style_signature_frequency, "computed_style_signature_frequency", n);
  const signedRegions = regions.filter(({ structural_signature_hash }) => structural_signature_hash).length;
  frequency(repetition.repeated_region_signature_frequency, "repeated_region_signature_frequency", signedRegions);
  for (const [index, size] of array(repetition.repeated_sibling_group_sizes, "repeated_sibling_group_sizes").entries()) integer(size, `repeated_sibling_group_sizes[${index}]`, 2);

  const candidates = integer(assets.same_origin_stylesheet_candidates, "same_origin_stylesheet_candidates");
  const fetched = integer(assets.same_origin_stylesheets_fetched, "same_origin_stylesheets_fetched");
  if (fetched > candidates) throw new Error("Fetched stylesheet count exceeds candidates");
  array(assets.css_custom_property_name_hashes, "css_custom_property_name_hashes").forEach((value) => {
    if (!HASH.test(value)) throw new Error("Invalid custom property hash");
  });
  array(assets.css_custom_property_value_type, "css_custom_property_value_type").forEach((row, index) => {
    object(row, `css_custom_property_value_type[${index}]`);
    if (typeof row.value_type !== "string") throw new Error("Invalid custom property value type");
    integer(row.count, `css_custom_property_value_type[${index}].count`, 1);
  });
  integer(assets.font_face_count, "font_face_count");
  integer(assets.media_query_count, "media_query_count");
  integer(assets.container_query_count, "container_query_count");
  return payload;
}
