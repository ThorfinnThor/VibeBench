import { aggregateOptionBV4Surface, assertOptionBV4Payload, installOptionBV4SurfaceHelpers, waitForOptionBV4Readiness } from "./option-b-v4-capture.mjs";

// v5 is deliberately a separate namespace. v4 remains the immutable reference
// collector; compatibility with its privacy-minimal payload is explicit here.
export const OPTION_B_V5_COLLECTOR_VERSION = "option-b-v5-isolated-development-1";
export const OPTION_B_V5_STABILIZATION_STYLE_ID = "vibebench-option-b-v5-stabilization";
export const OPTION_B_V5_OUTCOMES = Object.freeze([
  "success", "invalid_url", "private_or_disallowed_target", "egress_policy_blocked", "dns_unresolved",
  "tcp_connection_failed", "tls_certificate_error", "http_rate_limited", "http_blocked_or_denied",
  "http_not_found", "http_legal_block", "http_error", "navigation_timeout", "navigation_context_replaced",
  "surface_helper_installation_failed", "dom_readiness_timeout", "ineligible_empty_or_interstitial",
  "capture_surface_unstable", "computed_style_extraction_failed", "structural_aggregation_failed",
  "serialization_failed", "unknown_technical_error"
]);
export const OPTION_B_V5_RETRYABLE_OUTCOMES = Object.freeze(new Set([
  "http_rate_limited", "dns_unresolved", "tcp_connection_failed", "navigation_timeout",
  "navigation_context_replaced", "surface_helper_installation_failed", "dom_readiness_timeout",
  "ineligible_empty_or_interstitial", "capture_surface_unstable", "computed_style_extraction_failed",
  "unknown_technical_error"
]));

export const classifyOptionBV5Error = (error, stage = "http_navigation", status = null) => {
  const message = String(error?.message || error || "");
  if (/gültige öffentliche URL|invalid public URL/i.test(message)) return "invalid_url";
  if (/Nur öffentliche HTTP|Zugangsdaten|Standardports|nicht öffentliche|reservierte|lokale|private/i.test(message)) return "private_or_disallowed_target";
  if (status === 429) return "http_rate_limited";
  if (status === 401 || status === 403) return "http_blocked_or_denied";
  if (status === 404) return "http_not_found";
  if (status === 451) return "http_legal_block";
  if (status >= 400) return "http_error";
  if (/ERR_TUNNEL_CONNECTION_FAILED|proxy|egress|blockedbyclient/i.test(message)) return "egress_policy_blocked";
  if (/ENOTFOUND|ERR_NAME_NOT_RESOLVED|dns/i.test(message)) return "dns_unresolved";
  if (/ECONNREFUSED|ECONNRESET|ERR_CONNECTION_|socket|tcp/i.test(message)) return "tcp_connection_failed";
  if (/CERT|certificate|TLS|SSL/i.test(message)) return "tls_certificate_error";
  if (/navigation_context_replaced|execution context was destroyed/i.test(message)) return "navigation_context_replaced";
  if (/surface_helper_installation_failed/i.test(message)) return "surface_helper_installation_failed";
  if (/ineligible_empty_or_interstitial/i.test(message)) return "ineligible_empty_or_interstitial";
  if (/capture_surface_unstable/i.test(message)) return "capture_surface_unstable";
  if (/dom_readiness_timeout/i.test(message)) return "dom_readiness_timeout";
  if (/timeout/i.test(message)) return stage === "http_navigation" ? "navigation_timeout" : "dom_readiness_timeout";
  if (stage === "computed_style_extraction") return "computed_style_extraction_failed";
  if (stage === "structural_aggregation") return "structural_aggregation_failed";
  if (stage === "serialization") return "serialization_failed";
  return "unknown_technical_error";
};

export const retryDelayOptionBV5 = (outcome, retryNumber) => outcome === "http_rate_limited"
  ? Math.min(8_000, 2_000 * (2 ** retryNumber))
  : 500 + retryNumber * 750;

// Keep the v4 payload contract as the compatibility baseline while v5 adds
// execution metadata in the audit envelope, never in the persisted payload.
export const aggregateOptionBV5Surface = (raw) => aggregateOptionBV4Surface(raw);
export const assertOptionBV5Payload = (payload) => assertOptionBV4Payload(payload);

export async function installOptionBV5SurfaceHelpers(page) {
  try {
    await installOptionBV4SurfaceHelpers(page);
    await page.evaluate((styleId) => {
      const source = window.__VIBEBENCH_OPTION_B_V4_SURFACE__;
      if (!source) throw new Error("surface_helper_installation_failed");
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = "*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;caret-color:transparent!important}";
      (document.head || document.documentElement).append(style);
      const styleCache = new WeakMap();
      const depthCache = new WeakMap();
      const visibilityCache = new WeakMap();
      const styleFor = (element) => {
        if (!styleCache.has(element)) styleCache.set(element, getComputedStyle(element));
        return styleCache.get(element);
      };
      const depthFor = (element) => {
        if (depthCache.has(element)) return depthCache.get(element);
        let depth = 0;
        for (let current = element.parentElement; current; current = current.parentElement) depth += 1;
        depthCache.set(element, depth);
        return depth;
      };
      const isVisibleCached = (element) => {
        if (visibilityCache.has(element)) return visibilityCache.get(element);
        if (!(element instanceof Element) || element.closest("[hidden],[inert]")) { visibilityCache.set(element, false); return false; }
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0 || !element.getClientRects().length) { visibilityCache.set(element, false); return false; }
        let left = rect.left, right = rect.right, top = rect.top, bottom = rect.bottom;
        for (let current = element; current; current = current.parentElement) {
          const computed = styleFor(current);
          if (computed.display === "none" || ["hidden", "collapse"].includes(computed.visibility) || Number(computed.opacity) <= 0) { visibilityCache.set(element, false); return false; }
          if (current !== element) {
            const parentRect = current.getBoundingClientRect();
            if (["hidden", "clip", "scroll", "auto"].includes(computed.overflowX)) { left = Math.max(left, parentRect.left); right = Math.min(right, parentRect.right); }
            if (["hidden", "clip", "scroll", "auto"].includes(computed.overflowY)) { top = Math.max(top, parentRect.top); bottom = Math.min(bottom, parentRect.bottom); }
            if (right <= left || bottom <= top) { visibilityCache.set(element, false); return false; }
          }
        }
        visibilityCache.set(element, true);
        return true;
      };
      Object.defineProperty(window, "__VIBEBENCH_OPTION_B_V5_SURFACE__", { value: Object.freeze({ ...source, styleFor, depthFor, isVisibleCached }), writable: false, configurable: false });
    }, OPTION_B_V5_STABILIZATION_STYLE_ID);
  } catch (error) {
    throw new Error(`surface_helper_installation_failed: ${error?.message || error}`);
  }
}

export async function waitForOptionBV5Readiness(page, readiness) {
  try {
    return await waitForOptionBV4Readiness(page, readiness);
  } catch (error) {
    if (/timeout/i.test(String(error?.message || error))) throw new Error("dom_readiness_timeout");
    throw error;
  }
}

export async function extractOptionBV5Surface(page, budgets) {
  try {
    const raw = await page.evaluate(({ budgets: limits, stabilizationStyleId }) => {
      const helper = window.__VIBEBENCH_OPTION_B_V5_SURFACE__;
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
      const shadowCategory = (shadow) => !shadow || shadow === "none" ? "none" : shadow.split(/,(?![^()]*(?:\)|$))/).length > 1 ? "multiple" : "single";
      const all = [...document.body.querySelectorAll("*")];
      const allVisible = all.filter((element) => helper.depthFor(element) <= limits.maximum_dom_depth && helper.isVisibleCached(element));
      const visible = allVisible.slice(0, limits.maximum_visible_elements);
      const visibleSet = new Set(visible);
      const indexes = new Map(visible.map((element, index) => [element, index + 1]));
      const elements = visible.map((element, index) => {
        const style = helper.styleFor(element);
        const fonts = fontCategories(style.fontFamily);
        const rect = element.getBoundingClientRect();
        const visibleChildren = [...element.children].filter((child) => visibleSet.has(child));
        const role = helper.semanticRole(element);
        const structuralSignature = [tagCategory(element), role, Math.min(9, Math.floor(helper.depthFor(element) / 2)), visibleChildren.slice(0, 12).map(tagCategory).join(".")].join("|");
        const borderWidths = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].map(cssLength);
        const maximumBorder = borderWidths.filter((item) => ["px", "zero"].includes(item.kind)).sort((left, right) => right.value - left.value)[0] || { kind: "other", value: null };
        return {
          dom_preorder_index: index + 1,
          parent_preorder_index: indexes.get(element.parentElement) || 0,
          tag_category: tagCategory(element), semantic_role: role,
          normalized_x: normalized(rect.x, innerWidth), normalized_y: normalized(rect.y, innerHeight), normalized_width: normalized(rect.width, innerWidth), normalized_height: normalized(rect.height, innerHeight),
          dom_depth: helper.depthFor(element), visible_child_count: visibleChildren.length, interactive: helper.isInteractive(element), structural_signature: structuralSignature,
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
      const regionRoles = new Set(["banner", "navigation", "main", "region", "article", "complementary", "contentinfo", "form"]);
      const layoutRegions = visible.filter((element) => regionRoles.has(helper.semanticRole(element))).map((element) => {
        const rect = element.getBoundingClientRect();
        return { dom_preorder_index: indexes.get(element), region_role: helper.semanticRole(element), normalized_x: normalized(rect.x, innerWidth), normalized_y: normalized(rect.y, innerHeight), normalized_width: normalized(rect.width, innerWidth), normalized_height: normalized(rect.height, innerHeight), visible_child_count: [...element.children].filter((child) => visibleSet.has(child)).length };
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
      const customProperties = new Set();
      const customPropertyValueTypes = [];
      let fetched = 0;
      let inaccessible = 0;
      let capped = 0;
      let fontFaces = 0;
      let mediaQueries = 0;
      let containerQueries = 0;
      let totalBytes = 0;
      const sheets = [...document.styleSheets].filter((sheet) => {
        if (sheet.ownerNode?.id === stabilizationStyleId) return false;
        if (!sheet.href) return true;
        try { return new URL(sheet.href, location.href).origin === location.origin; } catch { return false; }
      });
      for (const [sheetIndex, sheet] of sheets.entries()) {
        if (sheetIndex >= limits.maximum_same_origin_stylesheets || totalBytes >= limits.maximum_total_stylesheet_bytes) {
          capped += sheets.length - sheetIndex;
          break;
        }
        let rules;
        try { rules = [...sheet.cssRules]; } catch { inaccessible += 1; continue; }
        fetched += 1;
        let sheetBytes = 0;
        let budgetExhausted = false;
        const visitRules = (items) => {
          for (const rule of items) {
            if (budgetExhausted) return;
            const bytes = utf8Bytes(rule.cssText || "");
            if (sheetBytes + bytes > limits.maximum_stylesheet_bytes_each || totalBytes + bytes > limits.maximum_total_stylesheet_bytes) {
              budgetExhausted = true;
              return;
            }
            sheetBytes += bytes;
            totalBytes += bytes;
            if (rule.type === CSSRule.FONT_FACE_RULE) fontFaces += 1;
            if (rule.type === CSSRule.MEDIA_RULE) mediaQueries += 1;
            if (rule.constructor?.name === "CSSContainerRule") containerQueries += 1;
            if (rule.style) for (const name of [...rule.style]) if (name.startsWith("--")) { customProperties.add(name); customPropertyValueTypes.push(valueType(rule.style.getPropertyValue(name))); }
            if (rule.cssRules) visitRules([...rule.cssRules]);
          }
        };
        visitRules(rules);
        if (budgetExhausted) capped += 1;
      }
      const visibleText = document.body.innerText || "";
      return {
        document: { viewport_width: innerWidth, viewport_height: innerHeight, document_width: document.documentElement.scrollWidth, document_height: document.documentElement.scrollHeight, visible_element_count: visible.length, visible_element_limit_reached: allVisible.length > limits.maximum_visible_elements, visible_text_character_count: visibleText.length, visible_word_count: (visibleText.match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) || []).length, dom_depth_max: elements.reduce((maximum, element) => Math.max(maximum, element.dom_depth), 0), dom_node_count: all.length },
        layout_regions: layoutRegions,
        elements,
        public_assets: { same_origin_stylesheet_candidates: sheets.length, same_origin_stylesheets_fetched: fetched, stylesheet_fetch_outcomes: { readable: fetched, inaccessible, capped }, css_custom_property_names: [...customProperties], css_custom_property_value_types: customPropertyValueTypes, font_face_count: fontFaces, media_query_count: mediaQueries, container_query_count: containerQueries }
      };
    }, { budgets, stabilizationStyleId: OPTION_B_V5_STABILIZATION_STYLE_ID });
    const payload = aggregateOptionBV4Surface(raw);
    assertOptionBV4Payload(payload);
    return payload;
  } catch (error) {
    throw new Error(`computed_style_extraction_failed: ${error?.message || error}`);
  }
}
