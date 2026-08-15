import { createHash } from "node:crypto";

export const OPTION_B_V4_COLLECTOR_VERSION = "option-b-v4-isolated-pilot-1";
export const OPTION_B_V4_STABILIZATION_STYLE_ID = "vibebench-option-b-v4-stabilization";
const sha256Pattern = /^[a-f0-9]{64}$/;

const hash = (value) => createHash("sha256").update(String(value)).digest("hex");
const countFrequency = (values, key = "signature_hash") => Object.entries(values.reduce((counts, value) => {
  counts[value] = (counts[value] || 0) + 1;
  return counts;
}, {})).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).map(([value, count]) => ({ [key]: value, count }));

export function aggregateOptionBV4Surface(raw) {
  const elements = raw.elements.map((element) => ({
    dom_preorder_index: element.dom_preorder_index,
    tag_category: element.tag_category,
    semantic_role: element.semantic_role,
    normalized_x: element.normalized_x,
    normalized_y: element.normalized_y,
    normalized_width: element.normalized_width,
    normalized_height: element.normalized_height,
    dom_depth: element.dom_depth,
    visible_child_count: element.visible_child_count,
    interactive: element.interactive,
    structural_signature_hash: hash(element.structural_signature),
    computed_style_signature_hash: hash(JSON.stringify(element.computed_style)),
    computed_style: element.computed_style
  }));
  const byIndex = new Map(elements.map((element) => [element.dom_preorder_index, element]));
  const siblingCounts = new Map();
  for (const rawElement of raw.elements) {
    if (!rawElement.parent_preorder_index) continue;
    const element = byIndex.get(rawElement.dom_preorder_index);
    const key = `${rawElement.parent_preorder_index}:${element.structural_signature_hash}`;
    siblingCounts.set(key, (siblingCounts.get(key) || 0) + 1);
  }
  const layoutRegions = raw.layout_regions.map((region) => ({
    region_role: region.region_role,
    normalized_x: region.normalized_x,
    normalized_y: region.normalized_y,
    normalized_width: region.normalized_width,
    normalized_height: region.normalized_height,
    visible_child_count: region.visible_child_count,
    structural_signature_hash: byIndex.get(region.dom_preorder_index)?.structural_signature_hash || null
  }));
  return {
    document: raw.document,
    layout_regions: layoutRegions,
    visible_elements: elements,
    repetition: {
      structural_signature_frequency: countFrequency(elements.map((element) => element.structural_signature_hash)),
      computed_style_signature_frequency: countFrequency(elements.map((element) => element.computed_style_signature_hash)),
      repeated_sibling_group_sizes: [...siblingCounts.values()].filter((count) => count >= 2).sort((left, right) => right - left),
      repeated_region_signature_frequency: countFrequency(layoutRegions.map((region) => region.structural_signature_hash).filter(Boolean))
    },
    public_assets: {
      same_origin_stylesheet_candidates: raw.public_assets.same_origin_stylesheet_candidates,
      same_origin_stylesheets_fetched: raw.public_assets.same_origin_stylesheets_fetched,
      stylesheet_fetch_outcomes: raw.public_assets.stylesheet_fetch_outcomes,
      css_custom_property_name_hashes: raw.public_assets.css_custom_property_names.map(hash).sort(),
      css_custom_property_value_type: countFrequency(raw.public_assets.css_custom_property_value_types, "value_type"),
      font_face_count: raw.public_assets.font_face_count,
      media_query_count: raw.public_assets.media_query_count,
      container_query_count: raw.public_assets.container_query_count
    }
  };
}

function exactKeys(value, expected, at) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${at} must be an object.`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.join("\0") !== wanted.join("\0")) throw new Error(`${at} has unexpected or missing fields.`);
}

function finiteNumber(value, at, { integer = false, minimum = -Infinity, maximum = Infinity } = {}) {
  if (!Number.isFinite(value) || (integer && !Number.isInteger(value)) || value < minimum || value > maximum) throw new Error(`${at} is outside its schema.`);
}

function typedLength(value, at) {
  exactKeys(value, ["kind", "value"], at);
  if (!["px", "percent", "zero", "keyword", "other"].includes(value.kind)) throw new Error(`${at}.kind is invalid.`);
  if (["px", "percent", "zero"].includes(value.kind)) finiteNumber(value.value, `${at}.value`, { minimum: -100000, maximum: 100000 });
  else if (value.value !== null) throw new Error(`${at}.value must be null for ${value.kind}.`);
}

function validateStyle(style, at) {
  const lengthKeys = ["font_size", "line_height", "letter_spacing", "padding_top", "padding_right", "padding_bottom", "padding_left", "margin_top", "margin_right", "margin_bottom", "margin_left", "row_gap", "column_gap", "border_radius_tl", "border_radius_tr", "border_radius_br", "border_radius_bl", "border_width"];
  exactKeys(style, ["display", "position", "font_primary_declared_category", "font_fallback_declared_categories", "font_weight", "text_align", "box_shadow_category", "opacity", "overflow_x", "overflow_y", ...lengthKeys], at);
  for (const key of ["display", "position", "font_primary_declared_category", "text_align", "box_shadow_category", "overflow_x", "overflow_y"]) {
    if (typeof style[key] !== "string" || !style[key] || style[key].length > 64) throw new Error(`${at}.${key} is invalid.`);
  }
  if (!Array.isArray(style.font_fallback_declared_categories) || style.font_fallback_declared_categories.some((item) => typeof item !== "string" || item.length > 32)) throw new Error(`${at}.font_fallback_declared_categories is invalid.`);
  finiteNumber(style.font_weight, `${at}.font_weight`, { minimum: 1, maximum: 1000 });
  finiteNumber(style.opacity, `${at}.opacity`, { minimum: 0, maximum: 1 });
  for (const key of lengthKeys) typedLength(style[key], `${at}.${key}`);
}

function frequencyRows(rows, at, key) {
  if (!Array.isArray(rows)) throw new Error(`${at} must be an array.`);
  for (const [index, row] of rows.entries()) {
    exactKeys(row, [key, "count"], `${at}[${index}]`);
    if (key === "signature_hash" && !sha256Pattern.test(row[key])) throw new Error(`${at}[${index}].${key} is invalid.`);
    if (key === "value_type" && (typeof row[key] !== "string" || !row[key])) throw new Error(`${at}[${index}].${key} is invalid.`);
    finiteNumber(row.count, `${at}[${index}].count`, { integer: true, minimum: 1 });
  }
}

export function assertOptionBV4Payload(payload) {
  exactKeys(payload, ["document", "layout_regions", "visible_elements", "repetition", "public_assets"], "payload");
  exactKeys(payload.document, ["viewport_width", "viewport_height", "document_width", "document_height", "visible_element_count", "visible_element_limit_reached", "visible_text_character_count", "visible_word_count", "dom_depth_max", "dom_node_count"], "payload.document");
  for (const key of ["viewport_width", "viewport_height", "document_width", "document_height", "visible_element_count", "visible_text_character_count", "visible_word_count", "dom_depth_max", "dom_node_count"]) finiteNumber(payload.document[key], `payload.document.${key}`, { integer: true, minimum: 0, maximum: 10000000 });
  if (typeof payload.document.visible_element_limit_reached !== "boolean") throw new Error("payload.document.visible_element_limit_reached must be boolean.");
  if (!Array.isArray(payload.visible_elements) || payload.visible_elements.length !== payload.document.visible_element_count) throw new Error("payload.visible_elements count mismatch.");
  for (const [index, element] of payload.visible_elements.entries()) {
    const at = `payload.visible_elements[${index}]`;
    exactKeys(element, ["dom_preorder_index", "tag_category", "semantic_role", "normalized_x", "normalized_y", "normalized_width", "normalized_height", "dom_depth", "visible_child_count", "interactive", "structural_signature_hash", "computed_style_signature_hash", "computed_style"], at);
    for (const key of ["dom_preorder_index", "dom_depth", "visible_child_count"]) finiteNumber(element[key], `${at}.${key}`, { integer: true, minimum: 0 });
    for (const key of ["normalized_x", "normalized_y", "normalized_width", "normalized_height"]) finiteNumber(element[key], `${at}.${key}`, { minimum: -10000, maximum: 10000 });
    if (typeof element.tag_category !== "string" || typeof element.semantic_role !== "string" || typeof element.interactive !== "boolean") throw new Error(`${at} has invalid semantic fields.`);
    if (!sha256Pattern.test(element.structural_signature_hash) || !sha256Pattern.test(element.computed_style_signature_hash)) throw new Error(`${at} has invalid hashes.`);
    validateStyle(element.computed_style, `${at}.computed_style`);
  }
  if (!Array.isArray(payload.layout_regions)) throw new Error("payload.layout_regions must be an array.");
  for (const [index, region] of payload.layout_regions.entries()) {
    const at = `payload.layout_regions[${index}]`;
    exactKeys(region, ["region_role", "normalized_x", "normalized_y", "normalized_width", "normalized_height", "visible_child_count", "structural_signature_hash"], at);
    if (typeof region.region_role !== "string") throw new Error("Invalid region role.");
    if (region.structural_signature_hash !== null && !sha256Pattern.test(region.structural_signature_hash)) throw new Error("Invalid region hash.");
    for (const key of ["normalized_x", "normalized_y", "normalized_width", "normalized_height"]) finiteNumber(region[key], `${at}.${key}`, { minimum: -10000, maximum: 10000 });
    finiteNumber(region.visible_child_count, `${at}.visible_child_count`, { integer: true, minimum: 0 });
  }
  exactKeys(payload.repetition, ["structural_signature_frequency", "computed_style_signature_frequency", "repeated_sibling_group_sizes", "repeated_region_signature_frequency"], "payload.repetition");
  frequencyRows(payload.repetition.structural_signature_frequency, "payload.repetition.structural_signature_frequency", "signature_hash");
  frequencyRows(payload.repetition.computed_style_signature_frequency, "payload.repetition.computed_style_signature_frequency", "signature_hash");
  frequencyRows(payload.repetition.repeated_region_signature_frequency, "payload.repetition.repeated_region_signature_frequency", "signature_hash");
  if (!Array.isArray(payload.repetition.repeated_sibling_group_sizes) || payload.repetition.repeated_sibling_group_sizes.some((value) => !Number.isInteger(value) || value < 2)) throw new Error("Invalid sibling group sizes.");
  exactKeys(payload.public_assets, ["same_origin_stylesheet_candidates", "same_origin_stylesheets_fetched", "stylesheet_fetch_outcomes", "css_custom_property_name_hashes", "css_custom_property_value_type", "font_face_count", "media_query_count", "container_query_count"], "payload.public_assets");
  for (const key of ["same_origin_stylesheet_candidates", "same_origin_stylesheets_fetched", "font_face_count", "media_query_count", "container_query_count"]) finiteNumber(payload.public_assets[key], `payload.public_assets.${key}`, { integer: true, minimum: 0 });
  exactKeys(payload.public_assets.stylesheet_fetch_outcomes, ["readable", "inaccessible", "capped"], "payload.public_assets.stylesheet_fetch_outcomes");
  for (const key of ["readable", "inaccessible", "capped"]) finiteNumber(payload.public_assets.stylesheet_fetch_outcomes[key], `payload.public_assets.stylesheet_fetch_outcomes.${key}`, { integer: true, minimum: 0 });
  if (!Array.isArray(payload.public_assets.css_custom_property_name_hashes) || payload.public_assets.css_custom_property_name_hashes.some((item) => !sha256Pattern.test(item))) throw new Error("Invalid custom-property hashes.");
  frequencyRows(payload.public_assets.css_custom_property_value_type, "payload.public_assets.css_custom_property_value_type", "value_type");
  return true;
}

export async function installOptionBV4SurfaceHelpers(page) {
  await page.evaluate((styleId) => {
    const helperKey = "__VIBEBENCH_OPTION_B_V4_SURFACE__";
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = "*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;caret-color:transparent!important}";
    (document.head || document.documentElement).append(style);
    const accessibleNamePresent = (element) => Boolean(element.getAttribute("aria-label")?.trim() || element.getAttribute("aria-labelledby")?.trim() || element.getAttribute("title")?.trim());
    const semanticRole = (element) => {
      const explicit = element.getAttribute("role")?.trim().split(/\s+/)[0];
      const validRoles = new Set(["alert", "alertdialog", "application", "article", "banner", "button", "cell", "checkbox", "columnheader", "combobox", "complementary", "contentinfo", "definition", "dialog", "directory", "document", "feed", "figure", "form", "grid", "gridcell", "group", "heading", "img", "link", "list", "listbox", "listitem", "log", "main", "marquee", "math", "menu", "menubar", "menuitem", "menuitemcheckbox", "menuitemradio", "meter", "navigation", "none", "note", "option", "presentation", "progressbar", "radio", "radiogroup", "region", "row", "rowgroup", "rowheader", "scrollbar", "search", "searchbox", "separator", "slider", "spinbutton", "status", "switch", "tab", "table", "tablist", "tabpanel", "term", "textbox", "timer", "toolbar", "tooltip", "tree", "treegrid", "treeitem"]);
      if (validRoles.has(explicit)) return explicit;
      const tag = element.tagName.toLowerCase();
      if (tag === "nav") return "navigation";
      if (tag === "main") return "main";
      if (tag === "aside") return "complementary";
      if (tag === "article") return "article";
      if (tag === "header" && !element.closest("article,aside,main,nav,section")) return "banner";
      if (tag === "footer" && !element.closest("article,aside,main,nav,section")) return "contentinfo";
      if (tag === "section" && accessibleNamePresent(element)) return "region";
      if (tag === "form" && accessibleNamePresent(element)) return "form";
      return "none";
    };
    const isVisible = (element) => {
      if (!(element instanceof Element) || element.closest("[hidden],[inert]")) return false;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0 || !element.getClientRects().length) return false;
      let left = rect.left, right = rect.right, top = rect.top, bottom = rect.bottom;
      for (let current = element; current; current = current.parentElement) {
        const computed = getComputedStyle(current);
        if (computed.display === "none" || ["hidden", "collapse"].includes(computed.visibility) || Number(computed.opacity) <= 0) return false;
        if (current !== element) {
          const parentRect = current.getBoundingClientRect();
          if (["hidden", "clip", "scroll", "auto"].includes(computed.overflowX)) { left = Math.max(left, parentRect.left); right = Math.min(right, parentRect.right); }
          if (["hidden", "clip", "scroll", "auto"].includes(computed.overflowY)) { top = Math.max(top, parentRect.top); bottom = Math.min(bottom, parentRect.bottom); }
          if (right <= left || bottom <= top) return false;
        }
      }
      return true;
    };
    const isInteractive = (element) => {
      if (element.closest("[inert]") || element.matches(":disabled") || element.getAttribute("aria-disabled") === "true") return false;
      const tabIndex = element.getAttribute("tabindex");
      if (tabIndex !== null) return Number(tabIndex) >= 0;
      const tag = element.tagName.toLowerCase();
      if (tag === "a" || tag === "area") return element.hasAttribute("href");
      if (["button", "input", "select", "textarea", "summary"].includes(tag)) return true;
      return element.getAttribute("contenteditable") === "true";
    };
    Object.defineProperty(window, helperKey, { value: Object.freeze({ isVisible, semanticRole, isInteractive }), writable: false, configurable: false });
  }, OPTION_B_V4_STABILIZATION_STYLE_ID);
}

export async function waitForOptionBV4Readiness(page, readiness) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 3000))]);
  });
  let previous = null;
  let stableSamples = 0;
  const started = Date.now();
  while (Date.now() - started < readiness.timeout_ms) {
    const current = await page.evaluate(() => {
      const helper = window.__VIBEBENCH_OPTION_B_V4_SURFACE__;
      if (!helper) throw new Error("capture_surface_unstable");
      const visible = [...document.body.querySelectorAll("*")].filter(helper.isVisible).length;
      return { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, visible };
    });
    if (previous) {
      const dimensionStable = Math.abs(current.width - previous.width) <= readiness.dimension_delta_px_max && Math.abs(current.height - previous.height) <= readiness.dimension_delta_px_max;
      const elementStable = Math.abs(current.visible - previous.visible) / Math.max(1, previous.visible) <= readiness.visible_element_delta_share_max;
      stableSamples = dimensionStable && elementStable ? stableSamples + 1 : 0;
      if (stableSamples >= readiness.required_consecutive_stable_samples) return current;
    }
    previous = current;
    await page.waitForTimeout(readiness.sampling_interval_ms);
  }
  throw new Error("dom_readiness_timeout");
}

export async function extractOptionBV4Surface(page, budgets) {
  const raw = await page.evaluate(({ budgets: limits, stabilizationStyleId }) => {
    const helper = window.__VIBEBENCH_OPTION_B_V4_SURFACE__;
    if (!helper || !document.getElementById(stabilizationStyleId)) throw new Error("capture_surface_unstable");
    const round = (value) => Number.isFinite(value) ? Math.round(value * 2) / 2 : 0;
    const normalized = (value, denominator) => Math.round((value / Math.max(1, denominator)) * 10000) / 10000;
    const cssLength = (value) => {
      const input = String(value || "").trim().toLowerCase();
      if (input === "0" || input === "0px") return { kind: "zero", value: 0 };
      const pixels = input.match(/^(-?(?:\d+|\d*\.\d+))px$/);
      if (pixels) return { kind: "px", value: round(Number(pixels[1])) };
      const percent = input.match(/^(-?(?:\d+|\d*\.\d+))%$/);
      if (percent) return { kind: "percent", value: round(Number(percent[1])) };
      if (/^(?:normal|auto|none|medium|thin|thick)$/.test(input)) return { kind: "keyword", value: null };
      return { kind: "other", value: null };
    };
    const fontCategory = (family) => {
      const value = family.trim().replace(/^['"]|['"]$/g, "").toLowerCase();
      if (["ui-monospace", "monospace"].includes(value)) return "generic-monospace";
      if (["serif", "ui-serif"].includes(value)) return "generic-serif";
      if (["sans-serif", "ui-sans-serif"].includes(value)) return "generic-sans";
      if (["system-ui", "-apple-system", "blinkmacsystemfont"].includes(value)) return "generic-system";
      if (["cursive", "fantasy", "math", "fangsong", "emoji"].includes(value)) return `generic-${value}`;
      return "custom-family";
    };
    const fontCategories = (family) => {
      const items = String(family || "").split(/,(?=(?:[^'"]|'[^']*'|"[^"]*")*$)/).map(fontCategory);
      return { primary: items[0] || "custom-family", fallbacks: [...new Set(items.slice(1))] };
    };
    const tagCategory = (element) => {
      const tag = element.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) return "heading";
      if (["p", "span", "strong", "em", "small", "blockquote", "code", "pre"].includes(tag)) return "text";
      if (["a", "button", "input", "select", "textarea", "summary"].includes(tag)) return "interactive";
      if (["img", "svg", "picture", "video", "canvas"].includes(tag)) return "media";
      if (["ul", "ol", "li", "dl", "dt", "dd"].includes(tag)) return "list";
      if (["header", "nav", "main", "section", "article", "aside", "footer"].includes(tag)) return "region";
      if (["form", "label", "fieldset", "legend"].includes(tag)) return "form";
      return "container";
    };
    const depth = (element) => { let result = 0; for (let current = element.parentElement; current; current = current.parentElement) result += 1; return result; };
    const shadowCategory = (shadow) => !shadow || shadow === "none" ? "none" : shadow.split(/,(?![^()]*(?:\)|$))/).length > 1 ? "multiple" : "single";
    const all = [...document.body.querySelectorAll("*")];
    const allVisible = all.filter((element) => helper.isVisible(element) && depth(element) <= limits.maximum_dom_depth);
    const visible = allVisible.slice(0, limits.maximum_visible_elements);
    const indexes = new Map(visible.map((element, index) => [element, index + 1]));
    const elements = visible.map((element, index) => {
      const style = getComputedStyle(element);
      const fonts = fontCategories(style.fontFamily);
      const rect = element.getBoundingClientRect();
      const visibleChildren = [...element.children].filter(helper.isVisible);
      const role = helper.semanticRole(element);
      const structuralSignature = [tagCategory(element), role, Math.min(9, Math.floor(depth(element) / 2)), visibleChildren.slice(0, 12).map(tagCategory).join(".")].join("|");
      const borderWidths = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].map(cssLength);
      const maximumBorder = borderWidths.filter((item) => ["px", "zero"].includes(item.kind)).sort((left, right) => right.value - left.value)[0] || { kind: "other", value: null };
      return {
        dom_preorder_index: index + 1,
        parent_preorder_index: indexes.get(element.parentElement) || 0,
        tag_category: tagCategory(element), semantic_role: role,
        normalized_x: normalized(rect.x, innerWidth), normalized_y: normalized(rect.y, innerHeight), normalized_width: normalized(rect.width, innerWidth), normalized_height: normalized(rect.height, innerHeight),
        dom_depth: depth(element), visible_child_count: visibleChildren.length, interactive: helper.isInteractive(element), structural_signature: structuralSignature,
        computed_style: {
          display: style.display, position: style.position,
          font_primary_declared_category: fonts.primary, font_fallback_declared_categories: fonts.fallbacks,
          font_size: cssLength(style.fontSize), font_weight: Number(style.fontWeight) || 400, line_height: cssLength(style.lineHeight), letter_spacing: cssLength(style.letterSpacing), text_align: style.textAlign,
          padding_top: cssLength(style.paddingTop), padding_right: cssLength(style.paddingRight), padding_bottom: cssLength(style.paddingBottom), padding_left: cssLength(style.paddingLeft),
          margin_top: cssLength(style.marginTop), margin_right: cssLength(style.marginRight), margin_bottom: cssLength(style.marginBottom), margin_left: cssLength(style.marginLeft),
          row_gap: cssLength(style.rowGap), column_gap: cssLength(style.columnGap),
          border_radius_tl: cssLength(style.borderTopLeftRadius), border_radius_tr: cssLength(style.borderTopRightRadius), border_radius_br: cssLength(style.borderBottomRightRadius), border_radius_bl: cssLength(style.borderBottomLeftRadius), border_width: maximumBorder,
          box_shadow_category: shadowCategory(style.boxShadow), opacity: Math.round(Number(style.opacity) * 100) / 100, overflow_x: style.overflowX, overflow_y: style.overflowY
        }
      };
    });
    const layoutRegions = visible.filter((element) => ["banner", "navigation", "main", "region", "article", "complementary", "contentinfo", "form"].includes(helper.semanticRole(element))).map((element) => {
      const rect = element.getBoundingClientRect();
      return { dom_preorder_index: indexes.get(element), region_role: helper.semanticRole(element), normalized_x: normalized(rect.x, innerWidth), normalized_y: normalized(rect.y, innerHeight), normalized_width: normalized(rect.width, innerWidth), normalized_height: normalized(rect.height, innerHeight), visible_child_count: [...element.children].filter(helper.isVisible).length };
    });
    const valueType = (value) => {
      const input = String(value || "").trim().toLowerCase();
      if (!input) return "empty";
      if (/var\(/.test(input)) return "token-reference";
      if (/(?:#(?:[a-f0-9]{3,8})|rgba?\(|hsla?\(|oklch\(|transparent|currentcolor)/i.test(input)) return "color";
      if (/gradient\(/.test(input)) return "gradient";
      if (/^-?(?:\d+|\d*\.\d+)(?:px|r?em|%|v[wh]|vmin|vmax|ch|ex)$/i.test(input)) return "length";
      if (/^-?(?:\d+|\d*\.\d+)$/.test(input)) return "number";
      if (/^(?:true|false|none|auto|inherit|initial|unset|revert|normal)$/i.test(input)) return "keyword";
      if (/^[a-z-]+\(/i.test(input)) return "function";
      return "composite";
    };
    const utf8Bytes = (value) => new TextEncoder().encode(String(value)).byteLength;
    const customProperties = new Set(), customPropertyValueTypes = [];
    let fetched = 0, inaccessible = 0, capped = 0, fontFaces = 0, mediaQueries = 0, containerQueries = 0, totalBytes = 0;
    const sheets = [...document.styleSheets].filter((sheet) => {
      if (sheet.ownerNode?.id === stabilizationStyleId) return false;
      if (!sheet.href) return true;
      try { return new URL(sheet.href, location.href).origin === location.origin; } catch { return false; }
    });
    for (const [sheetIndex, sheet] of sheets.entries()) {
      if (sheetIndex >= limits.maximum_same_origin_stylesheets || totalBytes >= limits.maximum_total_stylesheet_bytes) { capped += 1; continue; }
      let rules;
      try { rules = [...sheet.cssRules]; } catch { inaccessible += 1; continue; }
      fetched += 1;
      let sheetBytes = 0;
      const visit = (items) => items.forEach((rule) => {
        const bytes = utf8Bytes(rule.cssText || "");
        if (sheetBytes + bytes > limits.maximum_stylesheet_bytes_each || totalBytes + bytes > limits.maximum_total_stylesheet_bytes) return;
        sheetBytes += bytes; totalBytes += bytes;
        if (rule.type === CSSRule.FONT_FACE_RULE) fontFaces += 1;
        if (rule.type === CSSRule.MEDIA_RULE) mediaQueries += 1;
        if (rule.constructor?.name === "CSSContainerRule") containerQueries += 1;
        if (rule.style) for (const name of [...rule.style]) if (name.startsWith("--")) { customProperties.add(name); customPropertyValueTypes.push(valueType(rule.style.getPropertyValue(name))); }
        if (rule.cssRules) visit([...rule.cssRules]);
      });
      visit(rules);
    }
    const visibleText = document.body.innerText || "";
    return {
      document: { viewport_width: innerWidth, viewport_height: innerHeight, document_width: document.documentElement.scrollWidth, document_height: document.documentElement.scrollHeight, visible_element_count: visible.length, visible_element_limit_reached: allVisible.length > limits.maximum_visible_elements, visible_text_character_count: visibleText.length, visible_word_count: (visibleText.match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) || []).length, dom_depth_max: elements.reduce((maximum, element) => Math.max(maximum, element.dom_depth), 0), dom_node_count: all.length },
      layout_regions: layoutRegions, elements,
      public_assets: { same_origin_stylesheet_candidates: sheets.length, same_origin_stylesheets_fetched: fetched, stylesheet_fetch_outcomes: { readable: fetched, inaccessible, capped }, css_custom_property_names: [...customProperties], css_custom_property_value_types: customPropertyValueTypes, font_face_count: fontFaces, media_query_count: mediaQueries, container_query_count: containerQueries }
    };
  }, { budgets, stabilizationStyleId: OPTION_B_V4_STABILIZATION_STYLE_ID });
  const payload = aggregateOptionBV4Surface(raw);
  assertOptionBV4Payload(payload);
  return payload;
}
