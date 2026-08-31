import assert from "node:assert/strict";
import test from "node:test";
import { extractSitemapUrls, inspectHtml } from "../scripts/audit-public-seo.mjs";

test("public SEO audit extracts only same-origin sitemap URLs", () => {
  const xml = "<urlset><url><loc>https://www.vibefootprint.com/</loc></url><url><loc>https://www.vibefootprint.com/a?x=1&amp;y=2</loc></url><url><loc>https://example.com/foreign</loc></url></urlset>";
  assert.deepEqual(extractSitemapUrls(xml, "https://www.vibefootprint.com"), ["https://www.vibefootprint.com/", "https://www.vibefootprint.com/a?x=1&y=2"]);
});

test("public SEO audit extracts canonical metadata, headings, JSON-LD and internal links", () => {
  const html = `<!doctype html><html lang="en"><head><title>Pricing | VibeFootprint</title><meta name="description" content="One audit."><link href="https://www.vibefootprint.com/pricing" rel="canonical"><script type="application/ld+json">{"@type":"WebPage"}</script></head><body><h1>One audit</h1><a href="/guides">Guides</a><a href="https://example.com">External</a></body></html>`;
  assert.deepEqual(inspectHtml(html, "https://www.vibefootprint.com/pricing"), {
    title: "Pricing | VibeFootprint",
    headings: ["One audit"],
    canonical: "https://www.vibefootprint.com/pricing",
    description: "One audit.",
    robots: "",
    language: "en",
    jsonLdErrors: [],
    internalLinks: ["https://www.vibefootprint.com/guides"]
  });
});

test("public SEO audit reports malformed structured data", () => {
  const html = `<html lang="en"><head><title>Broken</title><meta name="description" content="Broken data"><link rel="canonical" href="https://www.vibefootprint.com/broken"><script type="application/ld+json">{broken}</script></head><body><h1>Broken</h1></body></html>`;
  assert.equal(inspectHtml(html, "https://www.vibefootprint.com/broken").jsonLdErrors.length, 1);
});
