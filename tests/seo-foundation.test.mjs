import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
const robots = readFileSync(new URL("../app/robots.ts", import.meta.url), "utf8");
const content = readFileSync(new URL("../lib/seo-pages.ts", import.meta.url), "utf8");
const scanner = readFileSync(new URL("../components/VibeFootprintHome.tsx", import.meta.url), "utf8");
const editorial = readFileSync(new URL("../lib/editorial-pages.ts", import.meta.url), "utf8");
const editorialComponent = readFileSync(new URL("../components/EditorialPage.tsx", import.meta.url), "utf8");
const seoContentComponent = readFileSync(new URL("../components/SeoContentPage.tsx", import.meta.url), "utf8");
const guideComponent = readFileSync(new URL("../components/GuidePage.tsx", import.meta.url), "utf8");

test("SEO foundation exposes canonical metadata and structured identity", () => {
  assert.match(layout, /metadataBase/);
  assert.match(layout, /GOOGLE_SITE_VERIFICATION/);
  assert.match(layout, /WebApplication/);
  assert.match(layout, /WebSite/);
  assert.match(layout, /Organization/);
  assert.match(home, /canonical: "\/"/);
});

test("the public website is English-only", () => {
  assert.match(layout, /<html lang="en"/);
  assert.doesNotMatch(layout, /de_DE|alternateLocale|x-vibefootprint-locale/);
  assert.doesNotMatch(sitemap, /\/de|x-default|alternates/);
  assert.doesNotMatch(scanner, /language-switcher|href="\/de"/);
  assert.equal(existsSync(new URL("../app/de/page.tsx", import.meta.url)), false);
  assert.equal(existsSync(new URL("../proxy.ts", import.meta.url)), false);
});

test("sitemap includes core pages, guide hubs and published guides", () => {
  assert.match(sitemap, /englishSeoPages/);
  assert.match(sitemap, /allEditorialPages/);
  assert.match(sitemap, /editorialHub/);
  assert.match(sitemap, /allGuidePages/);
  assert.match(sitemap, /guideClusters/);
  assert.match(sitemap, /status === "published"/);
  assert.match(sitemap, /absoluteUrl/);
});

test("editorial SEO pages cover distinct intents with explicit evidence boundaries", () => {
  assert.match(editorial, /how-to-tell-if-a-website-was-vibe-coded/);
  assert.match(editorial, /vibe-coded-vs-template-website/);
  assert.match(editorial, /vibe-coding-website-audit-framework/);
  assert.match(editorial, /how-to-make-a-vibe-coded-website-look-less-generic/);
  assert.match(editorial, /how-to-review-ai-generated-frontend-code/);
  assert.match(editorial, /can-you-detect-ai-generated-website-code/);
  assert.match(editorial, /Evidence boundary|evidence boundary/);
});

test("robots permits public pages and keeps the scan API out of the crawl surface", () => {
  assert.match(robots, /allow: "\/"/);
  assert.match(robots, /"\/api\/"/);
  assert.match(robots, /OAI-SearchBot/);
  assert.doesNotMatch(robots, /_next/);
  assert.match(robots, /sitemap/);
});

test("core search content preserves the product interpretation boundary", () => {
  assert.match(content, /does not establish authorship/);
  assert.match(content, /security baseline/i);
  assert.match(content, /vibe-coding-security-checklist/);
  assert.doesNotMatch(content, /germanSeoPages|locale: "de"/);
});

test("GEO entity and responsibility information is visible and internally linked", () => {
  assert.match(content, /slug: "about"/);
  assert.match(content, /What is VibeFootprint\?/);
  assert.match(content, /Who publishes and maintains the information/);
  assert.match(content, /SeitenHafen361/);
  assert.match(content, /Schayan Yousefian/);
  assert.match(content, /individual B2B offer/);
  assert.match(scanner, /href="\/about"/);
  assert.match(guideComponent, /href="\/about"/);
});

test("visible answer structures match conservative structured data", () => {
  assert.match(seoContentComponent, /"@type": "WebPage"/);
  assert.match(seoContentComponent, /"@type": "FAQPage"/);
  assert.match(seoContentComponent, /acceptedAnswer/);
  assert.match(editorialComponent, /"@type": "FAQPage"/);
  assert.match(editorialComponent, /Published by/);
  assert.match(editorialComponent, /Last reviewed/);
  assert.match(guideComponent, /isPartOf/);
});
