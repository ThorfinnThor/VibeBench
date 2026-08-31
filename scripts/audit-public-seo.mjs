const defaultOrigin = "https://www.vibefootprint.com";

function decodeHtml(value) {
  return value.replaceAll("&amp;", "&").replaceAll("&quot;", "\"").replaceAll("&#39;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/g)].map((match) => [match[1].toLowerCase(), decodeHtml(match[3])]));
}

export function extractSitemapUrls(xml, origin) {
  const expectedOrigin = new URL(origin).origin;
  return [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decodeHtml(match[1].trim())).filter((value) => {
    try { return new URL(value).origin === expectedOrigin; } catch { return false; }
  }))];
}

export function inspectHtml(html, pageUrl) {
  const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => attributes(match[0]));
  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => attributes(match[0]));
  const anchorTags = [...html.matchAll(/<a\b[^>]*>/gi)].map((match) => attributes(match[0]));
  const title = stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => stripTags(match[1]));
  const canonical = linkTags.find((item) => item.rel?.split(/\s+/).includes("canonical"))?.href || "";
  const description = metaTags.find((item) => item.name?.toLowerCase() === "description")?.content || "";
  const robots = metaTags.find((item) => item.name?.toLowerCase() === "robots")?.content?.toLowerCase() || "";
  const language = attributes(html.match(/<html\b[^>]*>/i)?.[0] || "").lang || "";
  const jsonLdErrors = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap((match) => {
    try { JSON.parse(match[1]); return []; } catch (error) { return [error instanceof Error ? error.message : "Invalid JSON-LD"]; }
  });
  const internalLinks = anchorTags.flatMap((item) => {
    if (!item.href || /^(mailto:|tel:|javascript:)/i.test(item.href)) return [];
    try {
      const url = new URL(item.href, pageUrl);
      if (url.origin !== new URL(pageUrl).origin) return [];
      url.hash = "";
      return [url.toString()];
    } catch { return []; }
  });
  return { title, headings, canonical, description, robots, language, jsonLdErrors, internalLinks: [...new Set(internalLinks)] };
}

async function mapConcurrent(items, concurrency, callback) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await callback(items[index], index);
    }
  }));
  return results;
}

export async function auditPublicSeo({ origin = process.env.SEO_AUDIT_ORIGIN || defaultOrigin, fetchImpl = fetch } = {}) {
  const normalizedOrigin = new URL(origin).origin;
  const sitemapResponse = await fetchImpl(`${normalizedOrigin}/sitemap.xml`, { headers: { "User-Agent": "VibeFootprint-SEO-Audit/1.0" } });
  if (!sitemapResponse.ok) throw new Error(`Sitemap returned HTTP ${sitemapResponse.status}.`);
  const urls = extractSitemapUrls(await sitemapResponse.text(), normalizedOrigin);
  if (!urls.length) throw new Error("The sitemap contains no same-origin URLs.");

  const pages = await mapConcurrent(urls, 10, async (url) => {
    try {
      const response = await fetchImpl(url, { headers: { "User-Agent": "VibeFootprint-SEO-Audit/1.0" } });
      const contentType = response.headers.get("content-type") || "";
      const html = contentType.includes("text/html") ? await response.text() : "";
      return { url, status: response.status, finalUrl: response.url || url, contentType, inspection: html ? inspectHtml(html, response.url || url) : null };
    } catch (error) {
      return { url, status: 0, finalUrl: url, contentType: "", inspection: null, fetchError: error instanceof Error ? error.message : String(error) };
    }
  });

  const errors = [];
  const warnings = [];
  const titles = new Map();
  const descriptions = new Map();
  const incoming = new Map(urls.map((url) => [url, 0]));
  for (const page of pages) {
    if (page.status !== 200) { errors.push(`${page.url}: HTTP ${page.status || "fetch failure"}${page.fetchError ? ` (${page.fetchError})` : ""}`); continue; }
    if (!page.inspection) { errors.push(`${page.url}: sitemap URL is not an HTML document (${page.contentType || "unknown content type"}).`); continue; }
    const data = page.inspection;
    if (!data.title) errors.push(`${page.url}: missing title.`);
    if (!data.description) errors.push(`${page.url}: missing meta description.`);
    if (data.headings.length !== 1) errors.push(`${page.url}: expected one H1, found ${data.headings.length}.`);
    if (data.language !== "en") errors.push(`${page.url}: expected html lang=en, found ${data.language || "none"}.`);
    if (data.robots.includes("noindex")) errors.push(`${page.url}: sitemap URL is marked noindex.`);
    if (!data.canonical) errors.push(`${page.url}: missing canonical URL.`);
    else if (new URL(data.canonical, page.finalUrl).toString() !== page.finalUrl) errors.push(`${page.url}: canonical points to ${data.canonical}.`);
    if (data.jsonLdErrors.length) errors.push(`${page.url}: invalid JSON-LD (${data.jsonLdErrors.join("; ")}).`);
    if (data.title.length > 65) warnings.push(`${page.url}: title is ${data.title.length} characters.`);
    if (data.description.length > 165) warnings.push(`${page.url}: description is ${data.description.length} characters.`);
    if (data.title) titles.set(data.title, [...(titles.get(data.title) || []), page.url]);
    if (data.description) descriptions.set(data.description, [...(descriptions.get(data.description) || []), page.url]);
    for (const link of data.internalLinks) if (incoming.has(link) && link !== page.url) incoming.set(link, incoming.get(link) + 1);
  }
  for (const [value, matchingUrls] of titles) if (matchingUrls.length > 1) errors.push(`Duplicate title "${value}" on ${matchingUrls.join(", ")}.`);
  for (const [value, matchingUrls] of descriptions) if (matchingUrls.length > 1) errors.push(`Duplicate description "${value}" on ${matchingUrls.join(", ")}.`);
  for (const [url, count] of incoming) if (url !== `${normalizedOrigin}/` && count === 0) errors.push(`${url}: orphaned sitemap URL with no internal link.`);
  return { origin: normalizedOrigin, sitemapUrls: urls.length, htmlPages: pages.filter((page) => page.inspection).length, errors, warnings };
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const result = await auditPublicSeo();
  console.log(`SEO crawl audited ${result.htmlPages}/${result.sitemapUrls} sitemap pages.`);
  for (const warning of result.warnings) console.warn(`WARN ${warning}`);
  for (const error of result.errors) console.error(`ERROR ${error}`);
  if (result.errors.length) process.exitCode = 1;
  else console.log(`SEO crawl passed with ${result.warnings.length} warning${result.warnings.length === 1 ? "" : "s"}.`);
}
