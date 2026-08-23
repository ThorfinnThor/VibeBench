import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

async function loadRegistry() {
  const source = readFileSync(new URL("../lib/editorial-pages.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

const registry = await loadRegistry();
const pages = registry.allEditorialPages;

test("publishes eighteen differentiated editorial pages", () => {
  assert.equal(pages.length, 18);
  assert.equal(new Set(pages.map((page) => page.format)).size, 18);
});

test("editorial pages pass substantive content and source gates", () => {
  for (const page of pages) {
    assert.ok(page.title.length >= 35, page.slug);
    assert.ok(page.description.length >= 130, page.slug);
    assert.ok(page.dek.length >= 140, page.slug);
    assert.ok(page.scope.length >= 130, page.slug);
    assert.ok(page.blocks.length >= 4, page.slug);
    assert.ok(page.sources.length >= 3, page.slug);
    assert.ok(page.related.length >= 3, page.slug);
    assert.equal(page.publishedAt, "2026-08-23", page.slug);
  }
});

test("each editorial page contains a format-specific working block", () => {
  const expected = new Map([
    ["field-guide", "ladder"], ["comparison", "matrix"], ["audit", "scorecard"], ["playbook", "phases"],
    ["code-review", "gates"], ["evidence-brief", "claims"], ["threat-model", "risks"],
    ["decision-guide", "decisions"], ["seo-clinic", "seoClinic"], ["debt-ledger", "ledger"],
    ["handoff-kit", "handoff"], ["test-lab", "testLab"], ["founder-brief", "controls"],
    ["cost-model", "costModel"], ["accessibility-lab", "accessJourneys"], ["tool-selection", "toolScore"],
    ["privacy-map", "dataFlow"], ["migration-runbook", "migration"]
  ]);
  for (const page of pages) assert.ok(page.blocks.some((block) => block.type === expected.get(page.format)), page.slug);
});

test("editorial titles, descriptions and slugs are unique", () => {
  const unique = (values) => new Set(values).size === values.length;
  assert.equal(unique(pages.map((page) => page.slug)), true);
  assert.equal(unique(pages.map((page) => page.title)), true);
  assert.equal(unique(pages.map((page) => page.description)), true);
});
