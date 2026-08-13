import { createHash } from "node:crypto";

export const OPTION_B_V3_COLLECTOR_VERSION = "option-b-v3-minimal-local-pilot-2";
const prohibitedPersistedKeys = /^(?:target_url|resolved_url|url|hostname|label|target|target_group|cohort|provenance_url|raw_html|html|visible_text|text|screenshot|image)$/i;

const hash = (value) => createHash("sha256").update(String(value)).digest("hex");
const frequency = (values) => Object.entries(values.reduce((counts, value) => {
  counts[value] = (counts[value] || 0) + 1;
  return counts;
}, {})).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([signature_hash, count]) => ({ signature_hash, count }));

const categoryFrequency = (values) => Object.entries(values.reduce((counts, value) => {
  counts[value] = (counts[value] || 0) + 1;
  return counts;
}, {})).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value_type, count]) => ({ value_type, count }));

export function aggregateRenderedSurface(raw) {
  const elements = raw.elements.map((element) => {
    const structuralSignatureHash = hash(element.structural_signature);
    const computedStyleSignatureHash = hash(JSON.stringify(element.computed_style));
    return {
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
      structural_signature_hash: structuralSignatureHash,
      computed_style_signature_hash: computedStyleSignatureHash,
      computed_style: element.computed_style
    };
  });
  const elementByIndex = new Map(elements.map((element) => [element.dom_preorder_index, element]));
  const layoutRegions = raw.layout_regions.map((region) => ({
    region_role: region.region_role,
    normalized_x: region.normalized_x,
    normalized_y: region.normalized_y,
    normalized_width: region.normalized_width,
    normalized_height: region.normalized_height,
    visible_child_count: region.visible_child_count,
    structural_signature_hash: elementByIndex.get(region.dom_preorder_index)?.structural_signature_hash || null
  }));
  const siblingGroups = Object.entries(raw.elements.reduce((groups, element) => {
    if (!element.parent_preorder_index) return groups;
    const item = elements.find((candidate) => candidate.dom_preorder_index === element.dom_preorder_index);
    const key = `${element.parent_preorder_index}:${item.structural_signature_hash}`;
    groups[key] = (groups[key] || 0) + 1;
    return groups;
  }, {})).map(([key, count]) => ({ parent_preorder_index: Number(key.split(":")[0]), structural_signature_hash: key.slice(key.indexOf(":") + 1), count })).filter((group) => group.count >= 2).sort((a, b) => b.count - a.count);
  const customPropertyNameHashes = raw.public_assets.css_custom_property_names.map(hash).sort();

  return {
    document: raw.document,
    layout_regions: layoutRegions,
    visible_elements: elements,
    repetition: {
      structural_signature_frequency: frequency(elements.map((element) => element.structural_signature_hash)),
      computed_style_signature_frequency: frequency(elements.map((element) => element.computed_style_signature_hash)),
      repeated_sibling_group_sizes: siblingGroups.map((group) => group.count).sort((a, b) => b - a),
      repeated_region_signature_frequency: frequency(layoutRegions.map((region) => region.structural_signature_hash).filter(Boolean))
    },
    public_assets: {
      same_origin_stylesheet_candidates: raw.public_assets.same_origin_stylesheet_candidates,
      same_origin_stylesheets_fetched: raw.public_assets.same_origin_stylesheets_fetched,
      stylesheet_fetch_outcomes: raw.public_assets.stylesheet_fetch_outcomes,
      css_custom_property_name_hashes: customPropertyNameHashes,
      css_custom_property_value_type: categoryFrequency(raw.public_assets.css_custom_property_value_types),
      font_face_count: raw.public_assets.font_face_count,
      media_query_count: raw.public_assets.media_query_count,
      container_query_count: raw.public_assets.container_query_count
    }
  };
}

export function assertMinimalPilotPrivacy(value, path = "output") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertMinimalPilotPrivacy(item, `${path}[${index}]`));
    return true;
  }
  if (!value || typeof value !== "object") return true;
  for (const [key, item] of Object.entries(value)) {
    if (prohibitedPersistedKeys.test(key)) throw new Error(`Prohibited persisted field at ${path}.${key}`);
    assertMinimalPilotPrivacy(item, `${path}.${key}`);
  }
  return true;
}

export async function waitForRenderedReadiness(page, readiness) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 3000))]);
  });
  let previous = null;
  let stableSamples = 0;
  const started = Date.now();
  while (Date.now() - started < readiness.timeout_ms) {
    const current = await page.evaluate(() => {
      const visible = [...document.body.querySelectorAll("*")].filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
      }).length;
      return { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, visible };
    });
    if (previous) {
      const dimensionStable = Math.abs(current.width - previous.width) <= readiness.dimension_delta_px_max && Math.abs(current.height - previous.height) <= readiness.dimension_delta_px_max;
      const elementDelta = Math.abs(current.visible - previous.visible) / Math.max(1, previous.visible);
      stableSamples = dimensionStable && elementDelta <= readiness.visible_element_delta_share_max ? stableSamples + 1 : 0;
      if (stableSamples >= readiness.required_consecutive_stable_samples) return current;
    }
    previous = current;
    await page.waitForTimeout(readiness.sampling_interval_ms);
  }
  throw new Error("dom_readiness_timeout");
}

export async function extractRenderedSurface(page, {
  maximumVisibleElements = 2000,
  maximumDomDepth = 80,
  maximumSameOriginStylesheets = 8,
  maximumStylesheetBytesEach = 300000,
  maximumTotalStylesheetBytes = 1500000
} = {}) {
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;caret-color:transparent!important}" });
  const raw = await page.evaluate(({
    maximumVisibleElements: limit,
    maximumDomDepth: depthLimit,
    maximumSameOriginStylesheets: stylesheetLimit,
    maximumStylesheetBytesEach: stylesheetBytesLimit,
    maximumTotalStylesheetBytes: totalStylesheetBytesLimit
  }) => {
    const roundHalf = (value) => Number.isFinite(value) ? Math.round(value * 2) / 2 : 0;
    const px = (value) => roundHalf(Number.parseFloat(value) || 0);
    const unit = (value, denominator) => Math.round((value / Math.max(1, denominator)) * 10000) / 10000;
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
    const role = (element) => element.getAttribute("role") || ({ header: "banner", nav: "navigation", main: "main", aside: "complementary", footer: "contentinfo", section: "region", article: "article", form: "form" })[element.tagName.toLowerCase()] || "none";
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
    };
    const depth = (element) => {
      let value = 0;
      for (let current = element.parentElement; current; current = current.parentElement) value += 1;
      return value;
    };
    const fontCategory = (family) => /monospace/i.test(family) ? "monospace" : /serif/i.test(family) && !/sans-serif/i.test(family) ? "serif" : /system-ui|-apple-system|blinkmacsystemfont/i.test(family) ? "system-sans" : "sans";
    const shadowCategory = (shadow) => !shadow || shadow === "none" ? "none" : shadow.split(/,(?![^()]*(?:\)|$))/).length > 1 ? "multiple" : "single";
    const all = [...document.body.querySelectorAll("*")];
    const visibleElements = all.filter((element) => visible(element) && depth(element) <= depthLimit).slice(0, limit);
    const indexes = new Map(visibleElements.map((element, index) => [element, index + 1]));
    const viewportWidth = innerWidth;
    const viewportHeight = innerHeight;
    const elements = visibleElements.map((element, index) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const children = [...element.children].filter(visible);
      const structuralSignature = [tagCategory(element), role(element), Math.min(9, Math.floor(depth(element) / 2)), children.slice(0, 12).map(tagCategory).join(".")].join("|");
      return {
        dom_preorder_index: index + 1,
        parent_preorder_index: indexes.get(element.parentElement) || 0,
        tag_category: tagCategory(element),
        semantic_role: role(element),
        normalized_x: unit(rect.x, viewportWidth),
        normalized_y: unit(rect.y, viewportHeight),
        normalized_width: unit(rect.width, viewportWidth),
        normalized_height: unit(rect.height, viewportHeight),
        dom_depth: depth(element),
        visible_child_count: children.length,
        interactive: /^(a|button|input|select|textarea|summary)$/.test(element.tagName.toLowerCase()) || Boolean(element.getAttribute("tabindex")),
        structural_signature: structuralSignature,
        computed_style: {
          display: style.display,
          position: style.position,
          font_family_category: fontCategory(style.fontFamily),
          font_size_px: px(style.fontSize),
          font_weight: Number(style.fontWeight) || 400,
          line_height_px: style.lineHeight === "normal" ? 0 : px(style.lineHeight),
          letter_spacing_px: style.letterSpacing === "normal" ? 0 : px(style.letterSpacing),
          text_align: style.textAlign,
          padding_top_px: px(style.paddingTop), padding_right_px: px(style.paddingRight), padding_bottom_px: px(style.paddingBottom), padding_left_px: px(style.paddingLeft),
          margin_top_px: px(style.marginTop), margin_right_px: px(style.marginRight), margin_bottom_px: px(style.marginBottom), margin_left_px: px(style.marginLeft),
          row_gap_px: style.rowGap === "normal" ? 0 : px(style.rowGap), column_gap_px: style.columnGap === "normal" ? 0 : px(style.columnGap),
          border_radius_tl_px: px(style.borderTopLeftRadius), border_radius_tr_px: px(style.borderTopRightRadius), border_radius_br_px: px(style.borderBottomRightRadius), border_radius_bl_px: px(style.borderBottomLeftRadius),
          border_width_px: Math.max(px(style.borderTopWidth), px(style.borderRightWidth), px(style.borderBottomWidth), px(style.borderLeftWidth)),
          box_shadow_category: shadowCategory(style.boxShadow),
          opacity: Math.round(Number(style.opacity) * 100) / 100,
          overflow_x: style.overflowX,
          overflow_y: style.overflowY
        }
      };
    });
    const regions = visibleElements.filter((element) => ["header", "nav", "main", "section", "article", "aside", "footer"].includes(element.tagName.toLowerCase()) || ["banner", "navigation", "main", "region", "article", "complementary", "contentinfo"].includes(role(element))).map((element) => {
      const rect = element.getBoundingClientRect();
      return { dom_preorder_index: indexes.get(element), region_role: role(element), normalized_x: unit(rect.x, viewportWidth), normalized_y: unit(rect.y, viewportHeight), normalized_width: unit(rect.width, viewportWidth), normalized_height: unit(rect.height, viewportHeight), visible_child_count: [...element.children].filter(visible).length };
    });
    const cssValueType = (value) => {
      const normalized = String(value || "").trim().toLowerCase();
      if (!normalized) return "empty";
      if (/var\(/.test(normalized)) return "token-reference";
      if (/(?:^|\s|,)(?:#(?:[a-f0-9]{3,8})|rgba?\(|hsla?\(|oklch\(|oklab\(|lab\(|lch\(|color\(|transparent|currentcolor)(?:$|\s|,)/i.test(normalized)) return "color";
      if (/gradient\(/.test(normalized)) return "gradient";
      if (/^-?(?:\d+|\d*\.\d+)(?:px|r?em|%|v[wh]|vmin|vmax|ch|ex|cm|mm|in|pt|pc)$/i.test(normalized)) return "length";
      if (/^-?(?:\d+|\d*\.\d+)$/.test(normalized)) return "number";
      if (/^(?:true|false|none|auto|inherit|initial|unset|revert|normal)$/i.test(normalized)) return "keyword";
      if (/^[a-z-]+\(/i.test(normalized)) return "function";
      return "composite";
    };
    const utf8ByteLength = (value) => {
      let bytes = 0;
      for (const character of String(value)) {
        const codePoint = character.codePointAt(0);
        bytes += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
      }
      return bytes;
    };
    const customProperties = new Set();
    const customPropertyValueTypes = [];
    let fetchedSheets = 0, inaccessibleSheets = 0, cappedSheets = 0, fontFaceCount = 0, mediaQueryCount = 0, containerQueryCount = 0, totalStylesheetBytes = 0;
    const sameOriginSheets = [...document.styleSheets].filter((sheet) => {
      if (!sheet.href) return true;
      try { return new URL(sheet.href, location.href).origin === location.origin; } catch { return false; }
    });
    for (const [sheetIndex, sheet] of sameOriginSheets.entries()) {
      if (sheetIndex >= stylesheetLimit || totalStylesheetBytes >= totalStylesheetBytesLimit) {
        cappedSheets += 1;
        continue;
      }
      let rules;
      try { rules = [...sheet.cssRules]; } catch { inaccessibleSheets += 1; continue; }
      fetchedSheets += 1;
      let sheetBytes = 0;
      const visit = (items) => items.forEach((rule) => {
        const ruleBytes = utf8ByteLength(rule.cssText || "");
        if (sheetBytes + ruleBytes > stylesheetBytesLimit || totalStylesheetBytes + ruleBytes > totalStylesheetBytesLimit) return;
        sheetBytes += ruleBytes;
        totalStylesheetBytes += ruleBytes;
        if (rule.type === CSSRule.FONT_FACE_RULE) fontFaceCount += 1;
        if (rule.type === CSSRule.MEDIA_RULE) mediaQueryCount += 1;
        if (rule.constructor?.name === "CSSContainerRule") containerQueryCount += 1;
        if (rule.style) for (const name of [...rule.style]) if (name.startsWith("--")) {
          customProperties.add(name);
          customPropertyValueTypes.push(cssValueType(rule.style.getPropertyValue(name)));
        }
        if (rule.cssRules) visit([...rule.cssRules]);
      });
      visit(rules);
    }
    const visibleText = document.body.innerText || "";
    return {
      document: {
        viewport_width: viewportWidth,
        viewport_height: viewportHeight,
        document_width: document.documentElement.scrollWidth,
        document_height: document.documentElement.scrollHeight,
        visible_element_count: visibleElements.length,
        visible_element_limit_reached: all.filter(visible).length > limit,
        visible_text_character_count: visibleText.length,
        visible_word_count: (visibleText.match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) || []).length,
        dom_depth_max: elements.reduce((maximum, element) => Math.max(maximum, element.dom_depth), 0),
        dom_node_count: all.length
      },
      layout_regions: regions,
      elements,
      public_assets: {
        same_origin_stylesheet_candidates: sameOriginSheets.length,
        same_origin_stylesheets_fetched: fetchedSheets,
        stylesheet_fetch_outcomes: { readable: fetchedSheets, inaccessible: inaccessibleSheets, capped: cappedSheets },
        css_custom_property_names: [...customProperties],
        css_custom_property_value_types: customPropertyValueTypes,
        font_face_count: fontFaceCount,
        media_query_count: mediaQueryCount,
        container_query_count: containerQueryCount
      }
    };
  }, { maximumVisibleElements, maximumDomDepth, maximumSameOriginStylesheets, maximumStylesheetBytesEach, maximumTotalStylesheetBytes });
  return aggregateRenderedSurface(raw);
}
