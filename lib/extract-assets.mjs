function attributeValue(tag, name) {
  const pattern = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, "i");
  const match = tag.match(pattern);
  return match ? (match[1] ?? match[2] ?? match[3] ?? "").replaceAll("&amp;", "&") : "";
}

function normalizeSameOrigin(value, baseUrl) {
  if (!value) return null;
  try {
    const base = new URL(baseUrl);
    const url = new URL(value, base);
    if (!["http:", "https:"].includes(url.protocol) || url.origin !== base.origin) return null;
    if (url.username || url.password) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function extractSameOriginAssets({ html, baseUrl, maxScripts = 4, maxStylesheets = 2 }) {
  return selectSameOriginAssets({ html, baseUrl, maxScripts, maxStylesheets }).assets;
}

export function selectSameOriginAssets({ html, baseUrl, maxScripts = 4, maxStylesheets = 2 }) {
  const scripts = [];
  const stylesheets = [];
  const seen = new Set();

  for (const tag of html.match(/<script\b[^>]*>/gi) || []) {
    const url = normalizeSameOrigin(attributeValue(tag, "src"), baseUrl);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    scripts.push({ kind: "script", url });
  }

  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const rel = attributeValue(tag, "rel").toLowerCase().split(/\s+/);
    if (!rel.includes("stylesheet")) continue;
    const url = normalizeSameOrigin(attributeValue(tag, "href"), baseUrl);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    stylesheets.push({ kind: "stylesheet", url });
  }

  const selectedScripts = scripts.slice(0, maxScripts);
  const selectedStylesheets = stylesheets.slice(0, maxStylesheets);
  return {
    assets: [...selectedScripts, ...selectedStylesheets],
    discovered: { scripts: scripts.length, stylesheets: stylesheets.length, total: scripts.length + stylesheets.length },
    selected: { scripts: selectedScripts.length, stylesheets: selectedStylesheets.length, total: selectedScripts.length + selectedStylesheets.length },
    ignoredByCap: Math.max(0, scripts.length - selectedScripts.length) + Math.max(0, stylesheets.length - selectedStylesheets.length)
  };
}

export function extractSameOriginManifest({ html, baseUrl }) {
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const rel = attributeValue(tag, "rel").toLowerCase().split(/\s+/);
    if (!rel.includes("manifest")) continue;
    const url = normalizeSameOrigin(attributeValue(tag, "href"), baseUrl);
    if (url) return url;
  }
  return null;
}
