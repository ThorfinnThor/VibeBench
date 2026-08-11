import { analyzeHtml } from "./analyze-html.mjs";
import { extractSameOriginAssets } from "./extract-assets.mjs";
import { collectPortablePageMetrics } from "./portable-page-metrics.mjs";
import { collectProductionExtendedMetrics } from "./production-v0_4-features.mjs";

const maxHtmlBytes = 1_500_000;
const maxAssetBytes = 300_000;
const count = (text, pattern) => (text.match(pattern) || []).length;

async function readLimited(response, maxBytes) {
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > maxBytes) throw new Error(`Declared body exceeds ${maxBytes} bytes.`);
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    const remaining = maxBytes - total;
    chunks.push(value.subarray(0, remaining));
    total += Math.min(value.byteLength, remaining);
    if (value.byteLength > remaining) { await reader.cancel(); break; }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

async function fetchMain(initialUrl) {
  let current = new URL(initialUrl);
  for (let redirect = 0; redirect <= 5; redirect += 1) {
    const response = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(20_000), headers: { "user-agent": "VibeBench/0.5-development-research", accept: "text/html,application/xhtml+xml" } });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`Redirect ${response.status} without location.`);
      current = new URL(location, current);
      if (!["http:", "https:"].includes(current.protocol)) throw new Error("Unsupported redirect protocol.");
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (!/html|xhtml/i.test(contentType)) throw new Error(`Unsupported content type: ${contentType}`);
    return { response, html: await readLimited(response, maxHtmlBytes), resolvedUrl: current.toString() };
  }
  throw new Error("Too many redirects.");
}

async function fetchAsset(initialUrl, origin) {
  let current = new URL(initialUrl);
  for (let redirect = 0; redirect <= 3; redirect += 1) {
    if (current.origin !== origin) throw new Error("Cross-origin asset blocked.");
    const response = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(10_000), headers: { "user-agent": "VibeBench/0.5-development-research", accept: "text/css,application/javascript,text/javascript,text/plain" } });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Asset redirect without location.");
      current = new URL(location, current);
      continue;
    }
    if (!response.ok) throw new Error(`Asset HTTP ${response.status}`);
    return readLimited(response, maxAssetBytes);
  }
  throw new Error("Too many asset redirects.");
}

export const V05_METRICS = [
  "title_chars", "meta_description_chars", "canonical_links", "open_graph_tags", "twitter_card_tags", "favicon_links",
  "main_tags", "article_tags", "ordered_lists", "unordered_lists", "list_items", "blockquotes", "label_tags", "details_tags",
  "cta_phrases", "marketing_cliche_phrases", "faq_tokens", "pricing_tokens", "testimonial_tokens", "emoji_count",
  "responsive_class_tokens", "dark_class_tokens", "hover_class_tokens", "gradient_class_tokens", "blur_class_tokens", "large_rounding_tokens", "shadow_class_tokens", "animation_class_tokens",
  "mui_fingerprints", "chakra_fingerprints", "mantine_fingerprints", "bootstrap_fingerprints", "antd_fingerprints", "daisyui_fingerprints", "headlessui_fingerprints", "heroicons_fingerprints", "fontawesome_fingerprints", "phosphor_fingerprints", "magicui_fingerprints", "aceternity_fingerprints",
  "hashed_asset_refs", "chunk_refs", "source_map_refs", "webpack_fingerprints", "turbopack_fingerprints", "astro_fingerprints", "svelte_fingerprints", "vue_fingerprints",
  "media_queries", "container_queries", "clamp_functions", "font_face_rules", "css_asset_bytes", "script_asset_bytes"
];

export function collectV05Metrics(html, fetchedAssets) {
  const assetText = fetchedAssets.map((asset) => asset.text).join("\n");
  const combined = `${html}\n${assetText}`;
  const visible = html.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z0-9#]+;/gi, " ").replace(/\s+/g, " ").trim();
  const classValues = [...html.matchAll(/\sclass=["']([^"']*)["']/gi)].map((match) => match[1]);
  const classTokens = classValues.flatMap((value) => value.split(/\s+/).filter(Boolean));
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, " ").trim() || "";
  const description = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] || html.match(/<meta\b[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)?.[1] || "";
  const emoji = visible.match(/[\p{Extended_Pictographic}]/gu) || [];
  return {
    title_chars: title.length,
    meta_description_chars: description.length,
    canonical_links: count(html, /<link\b[^>]*rel=["'][^"']*canonical/gi),
    open_graph_tags: count(html, /<meta\b[^>]*property=["']og:/gi),
    twitter_card_tags: count(html, /<meta\b[^>]*(?:name|property)=["']twitter:/gi),
    favicon_links: count(html, /<link\b[^>]*rel=["'][^"']*(?:icon|shortcut icon)/gi),
    main_tags: count(html, /<main\b/gi), article_tags: count(html, /<article\b/gi), ordered_lists: count(html, /<ol\b/gi), unordered_lists: count(html, /<ul\b/gi), list_items: count(html, /<li\b/gi), blockquotes: count(html, /<blockquote\b/gi), label_tags: count(html, /<label\b/gi), details_tags: count(html, /<details\b/gi),
    cta_phrases: count(visible, /\b(?:get started|start free|try (?:it )?free|join now|book a demo|request a demo|learn more|explore now|sign up|contact us)\b/gi),
    marketing_cliche_phrases: count(visible, /\b(?:everything you need|built for|designed for|unlock (?:the|your)|supercharge|seamless(?:ly)?|effortless(?:ly)?|reimagine|transform your|next[- ]generation|all[- ]in[- ]one|powerful and|in minutes|in seconds)\b/gi),
    faq_tokens: count(combined, /\b(?:frequently asked questions|faq)\b/gi), pricing_tokens: count(combined, /\b(?:pricing|price-card|pricing-card|pricing-tier)\b/gi), testimonial_tokens: count(combined, /\b(?:testimonials?|customer stories|what our customers say|social-proof)\b/gi), emoji_count: emoji.length,
    responsive_class_tokens: classTokens.filter((token) => /^(?:sm|md|lg|xl|2xl):/.test(token)).length,
    dark_class_tokens: classTokens.filter((token) => /^dark:/.test(token)).length,
    hover_class_tokens: classTokens.filter((token) => /^(?:hover|group-hover):/.test(token)).length,
    gradient_class_tokens: classTokens.filter((token) => /(?:gradient|from-|via-|to-)/.test(token)).length,
    blur_class_tokens: classTokens.filter((token) => /(?:backdrop-)?blur/.test(token)).length,
    large_rounding_tokens: classTokens.filter((token) => /rounded-(?:xl|2xl|3xl|full)/.test(token)).length,
    shadow_class_tokens: classTokens.filter((token) => /^shadow(?:-|$)/.test(token)).length,
    animation_class_tokens: classTokens.filter((token) => /^(?:animate-|transition|duration-|ease-)/.test(token)).length,
    mui_fingerprints: count(combined, /(?:@mui\/|Mui[A-Z]|material-ui)/g), chakra_fingerprints: count(combined, /(?:@chakra-ui|chakra-)/gi), mantine_fingerprints: count(combined, /(?:@mantine|mantine-)/gi), bootstrap_fingerprints: count(combined, /(?:bootstrap(?:\.min)?\.(?:css|js)|\bbtn-(?:primary|secondary)|\bcontainer-fluid\b)/gi), antd_fingerprints: count(combined, /(?:antd|ant-design|\bant-(?:btn|modal|layout|menu))/gi), daisyui_fingerprints: count(combined, /(?:daisyui|data-theme=["'][a-z])/gi), headlessui_fingerprints: count(combined, /(?:@headlessui|headlessui)/gi), heroicons_fingerprints: count(combined, /(?:@heroicons|heroicon)/gi), fontawesome_fingerprints: count(combined, /(?:fontawesome|font-awesome|fa-solid|fa-regular)/gi), phosphor_fingerprints: count(combined, /(?:phosphor-react|@phosphor-icons)/gi), magicui_fingerprints: count(combined, /(?:magicui|magic-ui)/gi), aceternity_fingerprints: count(combined, /aceternity/gi),
    hashed_asset_refs: count(html, /(?:src|href)=["'][^"']*[._-][a-f0-9]{8,}\.(?:js|css)/gi), chunk_refs: count(combined, /(?:chunk|chunks)[._/-]/gi), source_map_refs: count(assetText, /sourceMappingURL=/gi), webpack_fingerprints: count(combined, /(?:webpackChunk|__webpack_require__|webpack-runtime)/gi), turbopack_fingerprints: count(combined, /(?:turbopack|__turbopack)/gi), astro_fingerprints: count(combined, /(?:astro-island|astro:|_astro\/)/gi), svelte_fingerprints: count(combined, /(?:svelte-|__svelte|sveltekit)/gi), vue_fingerprints: count(combined, /(?:__vue|vue-router|data-v-[a-f0-9]{6,})/gi),
    media_queries: count(assetText, /@media\b/gi), container_queries: count(assetText, /@container\b/gi), clamp_functions: count(combined, /\bclamp\s*\(/gi), font_face_rules: count(assetText, /@font-face\b/gi),
    css_asset_bytes: fetchedAssets.filter((asset) => asset.kind === "stylesheet").reduce((sum, asset) => sum + new TextEncoder().encode(asset.text).length, 0),
    script_asset_bytes: fetchedAssets.filter((asset) => asset.kind === "script").reduce((sum, asset) => sum + new TextEncoder().encode(asset.text).length, 0)
  };
}

export async function scanDevelopmentPageV05(row) {
  const started = Date.now();
  try {
    const { response, html, resolvedUrl } = await fetchMain(row.target_url);
    const resolved = new URL(resolvedUrl);
    const assets = extractSameOriginAssets({ html, baseUrl: resolvedUrl });
    const settled = await Promise.allSettled(assets.map(async (asset) => ({ ...asset, text: await fetchAsset(asset.url, resolved.origin) })));
    const fetchedAssets = settled.filter((result) => result.status === "fulfilled").map((result) => result.value);
    const assetText = fetchedAssets.map((asset) => asset.text).join("\n");
    const headers = Object.fromEntries(response.headers.entries());
    const analysis = analyzeHtml({ html, url: resolvedUrl, headers, assetText });
    return { sample_id: row.sample_id, target_group: row.target_group, label: row.label, builder: row.builder, target_url: row.target_url, resolved_url: resolvedUrl, ok: true, duration_ms: Date.now() - started, stack_signals: analysis.stackSignals, direct_evidence: analysis.directEvidence, context_evidence: analysis.contextEvidence, header_evidence: analysis.headerEvidence, structural_hints: analysis.structuralHints, page_metrics: collectPortablePageMetrics({ html, assets, fetchedAssets }), extended_metrics: collectProductionExtendedMetrics(html, assetText), v0_5_metrics: collectV05Metrics(html, fetchedAssets), asset_scan: { requested: assets.length, fetched: fetchedAssets.length, errors: settled.length - fetchedAssets.length } };
  } catch (error) {
    return { sample_id: row.sample_id, target_group: row.target_group, label: row.label, builder: row.builder, target_url: row.target_url, ok: false, duration_ms: Date.now() - started, error: error instanceof Error ? error.message : String(error) };
  }
}
