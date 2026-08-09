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
  const scripts = [];
  const stylesheets = [];
  const seen = new Set();

  for (const tag of html.match(/<script\b[^>]*>/gi) || []) {
    const url = normalizeSameOrigin(attributeValue(tag, "src"), baseUrl);
    if (!url || seen.has(url) || scripts.length >= maxScripts) continue;
    seen.add(url);
    scripts.push({ kind: "script", url });
  }

  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const rel = attributeValue(tag, "rel").toLowerCase().split(/\s+/);
    if (!rel.includes("stylesheet")) continue;
    const url = normalizeSameOrigin(attributeValue(tag, "href"), baseUrl);
    if (!url || seen.has(url) || stylesheets.length >= maxStylesheets) continue;
    seen.add(url);
    stylesheets.push({ kind: "stylesheet", url });
  }

  return [...scripts, ...stylesheets];
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
