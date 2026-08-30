import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const defaultOrigin = "https://www.vibefootprint.com";
const key = "75aac989d1f432b965d085549187c9ab";
const keyPath = fileURLToPath(new URL(`../public/${key}.txt`, import.meta.url));

function decodeXml(value) {
  return value.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", "\"").replaceAll("&apos;", "'");
}

export function extractSitemapUrls(xml, expectedOrigin) {
  const origin = new URL(expectedOrigin).origin;
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
  return [...new Set(matches.map((match) => decodeXml(match[1].trim())).filter((value) => {
    try { return new URL(value).origin === origin; } catch { return false; }
  }))];
}

export async function submitIndexNow({ fetchImpl = fetch, origin = process.env.INDEXNOW_SITE_ORIGIN || defaultOrigin } = {}) {
  const normalizedOrigin = new URL(origin).origin;
  const sitemapResponse = await fetchImpl(`${normalizedOrigin}/sitemap.xml`);
  if (!sitemapResponse.ok) throw new Error(`Could not load sitemap: HTTP ${sitemapResponse.status}`);
  const urlList = extractSitemapUrls(await sitemapResponse.text(), normalizedOrigin);
  if (!urlList.length) throw new Error("Sitemap contains no same-origin URLs.");
  if (urlList.length > 10_000) throw new Error("IndexNow accepts at most 10,000 URLs per request.");

  const localKey = readFileSync(keyPath, "utf8").trim();
  if (localKey !== key) throw new Error("IndexNow key file does not match the configured key.");
  const response = await fetchImpl(process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(normalizedOrigin).hostname,
      key,
      keyLocation: `${normalizedOrigin}/${key}.txt`,
      urlList
    })
  });
  if (![200, 202].includes(response.status)) throw new Error(`IndexNow rejected the submission: HTTP ${response.status}`);
  return { status: response.status, count: urlList.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = await submitIndexNow();
  console.log(`IndexNow accepted ${result.count} URLs (HTTP ${result.status}).`);
}
