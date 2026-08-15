import { analyzeHtml } from "./analyze-html.mjs";
import { extractSameOriginAssets } from "./extract-assets.mjs";
import { collectPortablePageMetrics } from "./portable-page-metrics.mjs";
import { readLimitedText } from "./bounded-response.mjs";

const maxHtmlBytes = 1_500_000;
const maxAssetBytes = 300_000;
const encoder = new TextEncoder();
const count = (text, pattern) => (text.match(pattern) || []).length;

const canonicalHost = (value) => new URL(value).hostname.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");

async function fetchMain(initialUrl) {
  let current = new URL(initialUrl);
  const expectedHost = canonicalHost(current);
  for (let redirect = 0; redirect <= 5; redirect += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
      headers: { "user-agent": "VibeBench/0.3-development-research", accept: "text/html,application/xhtml+xml" }
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`Redirect ${response.status} without location.`);
      current = new URL(location, current);
      if (!["http:", "https:"].includes(current.protocol)) throw new Error("Unsupported redirect protocol.");
      if (canonicalHost(current) !== expectedHost) throw new Error("Sample identity changed across redirect.");
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (!["text/html", "application/xhtml+xml"].includes(contentType.split(";", 1)[0].trim().toLowerCase())) throw new Error(`Unsupported content type: ${contentType}`);
    const body = await readLimitedText(response, maxHtmlBytes);
    if (body.truncated) throw new Error("Main document exceeded the frozen byte limit.");
    return { response, html: body.text, html_bytes: body.bytes, resolvedUrl: current.toString() };
  }
  throw new Error("Too many redirects.");
}

async function fetchAsset(initialUrl, origin) {
  let current = new URL(initialUrl);
  for (let redirect = 0; redirect <= 3; redirect += 1) {
    if (current.origin !== origin) throw new Error("Cross-origin asset blocked.");
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
      headers: { "user-agent": "VibeBench/0.3-development-research", accept: "text/css,application/javascript,text/javascript,text/plain" }
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Asset redirect without location.");
      current = new URL(location, current);
      continue;
    }
    if (!response.ok) throw new Error(`Asset HTTP ${response.status}`);
    const body = await readLimitedText(response, maxAssetBytes);
    if (body.truncated) throw new Error("Asset exceeded the frozen byte limit.");
    return body.text;
  }
  throw new Error("Too many asset redirects.");
}

function extendedMetrics(html, assetText) {
  const combined = `${html}\n${assetText}`;
  const visible = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = visible.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) || [];
  const classValues = [...html.matchAll(/\sclass=["']([^"']*)["']/gi)].map((match) => match[1]);
  const classTokens = classValues.flatMap((value) => value.split(/\s+/).filter(Boolean));
  const externalHosts = new Set([...combined.matchAll(/(?:https?:)?\/\/([a-z0-9.-]+)(?=[:/"'`\s)])/gi)].map((match) => match[1].toLowerCase().replace(/^www\./, "")));
  const shadcnVariables = ["background", "foreground", "card", "popover", "primary", "secondary", "muted", "accent", "destructive", "border", "input", "ring", "radius"];
  return {
    html_bytes: encoder.encode(html).length,
    visible_text_chars: visible.length,
    visible_words: words.length,
    unique_visible_words: new Set(words).size,
    paragraphs: count(html, /<p\b/gi),
    sections: count(html, /<section\b/gi),
    anchors: count(html, /<a\b/gi),
    navs: count(html, /<nav\b/gi),
    footers: count(html, /<footer\b/gi),
    dialogs: count(html, /<(?:dialog)\b|role=["']dialog/gi),
    tables: count(html, /<table\b/gi),
    code_blocks: count(html, /<(?:pre|code)\b/gi),
    canvases: count(html, /<canvas\b/gi),
    videos: count(html, /<video\b/gi),
    meta_tags: count(html, /<meta\b/gi),
    jsonld_scripts: count(html, /<script\b[^>]*application\/ld\+json/gi),
    comments: count(html, /<!--[\s\S]*?-->/g),
    id_attributes: count(html, /\sid=["']/gi),
    role_attributes: count(html, /\srole=["']/gi),
    alt_attributes: count(html, /\salt=["']/gi),
    custom_elements: count(html, /<[a-z][a-z0-9]*-[a-z0-9-]+\b/gi),
    tailwind_like_tokens: classTokens.filter((token) => /^(?:sm:|md:|lg:|xl:|2xl:|hover:|focus:|dark:|group-|peer-|bg-|text-|p[trblxy]?-|m[trblxy]?-|grid|flex|gap-|rounded|shadow|border|w-|h-|max-w-|min-h-)/.test(token)).length,
    arbitrary_class_tokens: classTokens.filter((token) => /\[[^\]]+\]/.test(token)).length,
    css_variables: count(combined, /--[a-z][a-z0-9-]*\s*:/gi),
    gradients: count(combined, /(?:linear|radial|conic)-gradient\s*\(/gi),
    keyframes: count(assetText, /@keyframes\b/gi),
    external_host_count: externalHosts.size,
    shadcn_variable_coverage: shadcnVariables.filter((name) => new RegExp(`--${name}\\s*:`, "i").test(combined)).length,
    data_slot_attributes: count(combined, /data-slot=/gi),
    radix_fingerprints: count(combined, /(?:data-radix-|radix-ui|@radix-ui)/gi),
    lucide_fingerprints: count(combined, /(?:lucide-react|lucide-|data-lucide)/gi),
    cva_fingerprints: count(combined, /(?:class-variance-authority|cva\()/gi),
    tailwind_merge_fingerprints: count(combined, /(?:tailwind-merge|twMerge)/gi),
    next_themes_fingerprints: count(combined, /next-themes/gi),
    sonner_fingerprints: count(combined, /\bsonner\b/gi),
    cmdk_fingerprints: count(combined, /\bcmdk\b/gi),
    recharts_fingerprints: count(combined, /\brecharts\b/gi),
    embla_fingerprints: count(combined, /embla-carousel/gi),
    tanstack_fingerprints: count(combined, /(?:@tanstack|react-query)/gi),
    react_hook_form_fingerprints: count(combined, /react-hook-form/gi),
    zod_fingerprints: count(combined, /(?:\bzod\b|z\.object\()/gi),
    framer_motion_fingerprints: count(combined, /framer-motion/gi),
    ui_cliche_tokens: count(combined, /(?:bg-gradient-to-|backdrop-blur|rounded-2xl|rounded-3xl|shadow-xl|min-h-screen|max-w-7xl|container mx-auto|animate-pulse|group-hover:|from-primary|to-primary)/gi),
    vite_fingerprints: count(combined, /(?:vite\/client|__vite|vite\.svg)/gi),
    next_fingerprints: count(combined, /(?:__next_data__|_next\/static|next-route-announcer)/gi)
  };
}

export async function scanDevelopmentPage(row) {
  const started = Date.now();
  try {
    const { response, html, html_bytes, resolvedUrl } = await fetchMain(row.target_url);
    const resolved = new URL(resolvedUrl);
    const assets = extractSameOriginAssets({ html, baseUrl: resolvedUrl });
    const settled = await Promise.allSettled(assets.map(async (asset) => ({ ...asset, text: await fetchAsset(asset.url, resolved.origin) })));
    const fetchedAssets = settled.filter((result) => result.status === "fulfilled").map((result) => result.value);
    const assetText = fetchedAssets.map((asset) => asset.text).join("\n");
    const headers = Object.fromEntries(response.headers.entries());
    const analysis = analyzeHtml({ html, url: resolvedUrl, headers, assetText });
    return {
      sample_id: row.sample_id,
      target_group: row.target_group,
      label: row.label,
      builder: row.builder,
      target_url: row.target_url,
      resolved_url: resolvedUrl,
      ok: true,
      capture_complete: true,
      capture_contract_version: "development-page-scan-bounded-v2",
      html_bytes,
      duration_ms: Date.now() - started,
      stack_signals: analysis.stackSignals,
      direct_evidence: analysis.directEvidence,
      context_evidence: analysis.contextEvidence,
      header_evidence: analysis.headerEvidence,
      structural_hints: analysis.structuralHints,
      page_metrics: collectPortablePageMetrics({ html, assets, fetchedAssets }),
      extended_metrics: extendedMetrics(html, assetText),
      asset_scan: { requested: assets.length, fetched: fetchedAssets.length, errors: settled.length - fetchedAssets.length }
    };
  } catch (error) {
    return {
      sample_id: row.sample_id,
      target_group: row.target_group,
      label: row.label,
      builder: row.builder,
      target_url: row.target_url,
      ok: false,
      duration_ms: Date.now() - started,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
