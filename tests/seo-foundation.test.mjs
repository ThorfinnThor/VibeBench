import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
const robots = readFileSync(new URL("../app/robots.ts", import.meta.url), "utf8");
const content = readFileSync(new URL("../lib/seo-pages.ts", import.meta.url), "utf8");
const scanner = readFileSync(new URL("../components/VibeFootprintHome.tsx", import.meta.url), "utf8");

test("SEO foundation exposes canonical metadata and structured identity", () => {
  assert.match(layout, /metadataBase/);
  assert.match(layout, /GOOGLE_SITE_VERIFICATION/);
  assert.match(layout, /WebApplication/);
  assert.match(layout, /Organization/);
  assert.match(home, /canonical: "\/"/);
});

test("the public website is English-only", () => {
  assert.match(layout, /<html lang="en">/);
  assert.doesNotMatch(layout, /de_DE|alternateLocale|x-vibefootprint-locale/);
  assert.doesNotMatch(sitemap, /\/de|x-default|alternates/);
  assert.doesNotMatch(scanner, /language-switcher|href="\/de"/);
  assert.equal(existsSync(new URL("../app/de/page.tsx", import.meta.url)), false);
  assert.equal(existsSync(new URL("../proxy.ts", import.meta.url)), false);
});

test("sitemap includes core pages, guide hubs and published guides", () => {
  assert.match(sitemap, /englishSeoPages/);
  assert.match(sitemap, /allGuidePages/);
  assert.match(sitemap, /guideClusters/);
  assert.match(sitemap, /status === "published"/);
  assert.match(sitemap, /absoluteUrl/);
});

test("robots permits public pages and keeps the scan API out of the crawl surface", () => {
  assert.match(robots, /allow: "\/"/);
  assert.match(robots, /"\/api\/"/);
  assert.match(robots, /sitemap/);
});

test("core search content preserves the product interpretation boundary", () => {
  assert.match(content, /does not establish authorship/);
  assert.match(content, /security baseline/i);
  assert.match(content, /vibe-coding-security-checklist/);
  assert.doesNotMatch(content, /germanSeoPages|locale: "de"/);
});
