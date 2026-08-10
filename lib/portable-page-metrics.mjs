const count = (text, pattern) => (text.match(pattern) || []).length;

export function collectPortablePageMetrics({ html, assets, fetchedAssets }) {
  const classValues = [...html.matchAll(/\sclass=["']([^"']*)["']/gi)].map((match) => match[1]);
  const classTokens = classValues.flatMap((value) => value.trim().split(/\s+/).filter(Boolean));
  const inlineScriptBytes = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .reduce((total, match) => total + new TextEncoder().encode(match[1]).length, 0);
  return {
    script_tags: count(html, /<script\b/gi),
    module_scripts: count(html, /<script\b[^>]*\btype=["']module["']/gi),
    stylesheet_links: count(html, /<link\b[^>]*\brel=["'][^"']*stylesheet/gi),
    preload_links: count(html, /<link\b[^>]*\brel=["'][^"']*(?:preload|modulepreload)/gi),
    inline_styles: count(html, /\sstyle=["']/gi),
    inline_script_bytes: inlineScriptBytes,
    data_attributes: count(html, /\sdata-[\w-]+=/gi),
    aria_attributes: count(html, /\saria-[\w-]+=/gi),
    class_attributes: classValues.length,
    class_tokens: classTokens.length,
    unique_class_tokens: new Set(classTokens).size,
    dom_tags: count(html, /<(?:main|section|article|aside|nav|header|footer|div|span|button|form|input|select|textarea|img|svg|h[1-6]|p|a)\b/gi),
    forms: count(html, /<form\b/gi),
    inputs: count(html, /<(?:input|select|textarea)\b/gi),
    buttons: count(html, /<button\b/gi),
    headings: count(html, /<h[1-6]\b/gi),
    images: count(html, /<img\b/gi),
    svgs: count(html, /<svg\b/gi),
    same_origin_scripts_requested: assets.filter((asset) => asset.kind === "script").length,
    same_origin_styles_requested: assets.filter((asset) => asset.kind === "stylesheet").length,
    same_origin_scripts_fetched: fetchedAssets.filter((asset) => asset.kind === "script").length,
    same_origin_styles_fetched: fetchedAssets.filter((asset) => asset.kind === "stylesheet").length,
    asset_bytes_fetched: fetchedAssets.reduce((total, asset) => total + new TextEncoder().encode(asset.text).length, 0)
  };
}
