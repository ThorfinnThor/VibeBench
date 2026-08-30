import { allEditorialPages } from "../../lib/editorial-pages";
import { absoluteUrl } from "../../lib/site";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" })[character] || character);
}

export function GET() {
  const pages = [...allEditorialPages].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const items = pages.map((page) => {
    const url = absoluteUrl(`/${page.slug}`);
    return `<item><title>${escapeXml(page.title)}</title><link>${escapeXml(url)}</link><guid isPermaLink="true">${escapeXml(url)}</guid><description>${escapeXml(page.description)}</description><pubDate>${new Date(`${page.updatedAt}T00:00:00.000Z`).toUTCString()}</pubDate></item>`;
  }).join("");
  const latestUpdate = pages[0]?.updatedAt || "2026-08-31";
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>VibeFootprint Insights</title><link>${escapeXml(absoluteUrl("/insights"))}</link><description>Original evidence-led guidance for websites built at AI speed.</description><language>en</language><lastBuildDate>${new Date(`${latestUpdate}T00:00:00.000Z`).toUTCString()}</lastBuildDate><atom:link href="${escapeXml(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400"
    }
  });
}
