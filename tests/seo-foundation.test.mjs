import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
const robots = readFileSync(new URL("../app/robots.ts", import.meta.url), "utf8");
const content = readFileSync(new URL("../lib/seo-pages.ts", import.meta.url), "utf8");

test("SEO foundation exposes canonical metadata and optional Search Console verification", () => {
  assert.match(layout, /metadataBase/);
  assert.match(layout, /GOOGLE_SITE_VERIFICATION/);
  assert.match(layout, /WebApplication/);
  assert.match(layout, /Organization/);
});

test("sitemap binds English and German equivalents", () => {
  assert.match(sitemap, /seoPagePairs/);
  assert.match(sitemap, /x-default/);
  assert.match(sitemap, /absoluteUrl/);
});

test("robots permits public pages and keeps the scan API out of the crawl surface", () => {
  assert.match(robots, /allow: "\/"/);
  assert.match(robots, /"\/api\/"/);
  assert.match(robots, /sitemap/);
});

test("search content preserves the product interpretation boundary", () => {
  assert.match(content, /does not establish authorship/);
  assert.match(content, /Security-Baseline/);
  assert.match(content, /vibe-coding-security-checklist/);
  assert.match(content, /vibe-coding-website-erkennen/);
});

