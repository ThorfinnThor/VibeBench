import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

async function loadRegistry() {
  const source = readFileSync(new URL("../lib/guide-pages.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

const registry = await loadRegistry();
const pages = registry.allGuidePages;

test("publishes the full 95-guide English library", () => {
  assert.equal(pages.length, 95);
  assert.deepEqual(Object.fromEntries(Object.keys(registry.guideClusters).map((cluster) => [cluster, registry.guidesForCluster(cluster).length])), { security: 20, design: 20, engineering: 20, content: 15, launch: 10, diagnostics: 10 });
});

test("every guide passes the editorial completeness gate", () => {
  for (const page of pages) {
    assert.equal(page.status, "published", page.slug);
    assert.ok(page.title.length >= 22, page.slug);
    assert.ok(page.description.length >= 150, page.slug);
    assert.ok(page.summary.length >= 90, page.slug);
    assert.ok(page.inspect.length >= 3, page.slug);
    assert.ok(page.improve.length >= 3, page.slug);
    assert.ok(page.verify.length >= 3, page.slug);
    assert.ok(page.pitfall.length >= 80, page.slug);
    assert.ok(page.boundary.length >= 100, page.slug);
    assert.ok(page.sources.length >= 3, page.slug);
    assert.ok(page.author && page.reviewer && page.updatedAt, page.slug);
  }
});

test("slugs, titles and metadata descriptions are unique", () => {
  const unique = (values) => new Set(values).size === values.length;
  assert.equal(unique(pages.map((page) => `${page.cluster}/${page.slug}`)), true);
  assert.equal(unique(pages.map((page) => page.title)), true);
  assert.equal(unique(pages.map((page) => page.description)), true);
});

test("guide routes statically enumerate clusters and detail pages", () => {
  const detailRoute = readFileSync(new URL("../app/guides/[cluster]/[slug]/page.tsx", import.meta.url), "utf8");
  const clusterRoute = readFileSync(new URL("../app/guides/[cluster]/page.tsx", import.meta.url), "utf8");
  assert.match(detailRoute, /generateStaticParams/);
  assert.match(detailRoute, /allGuidePages/);
  assert.match(detailRoute, /canonical/);
  assert.match(clusterRoute, /generateStaticParams/);
});
