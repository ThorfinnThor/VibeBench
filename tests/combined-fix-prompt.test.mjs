import assert from "node:assert/strict";
import test from "node:test";
import { buildCombinedFixPrompt } from "../lib/combined-fix-prompt.mjs";

const items = [
  { id: "VF-SEC-CSP", title: "Content Security Policy", category: "security", priority: "high", prompt: "# Fix CSP\n\nAdd and verify the policy." },
  { id: "VF-ENG-SEMANTICS", title: "Document semantics", category: "engineering", priority: "medium", prompt: "# Fix semantics\n\nImprove the document structure." }
];

test("combined fix prompt preserves every finding in report order", () => {
  const prompt = buildCombinedFixPrompt({ items, target: "https://example.com/", generatedAt: "2026-08-30T10:00:00Z", locale: "en" });

  assert.match(prompt, /VibeFootprint — Combined implementation prompt/);
  assert.match(prompt, /Target: https:\/\/example\.com\//);
  assert.ok(prompt.indexOf("Security · Content Security Policy") < prompt.indexOf("Engineering · Document semantics"));
  assert.match(prompt, /Technical reference: VF-SEC-CSP/);
  assert.match(prompt, /Priority: high/);
  assert.match(prompt, /Add and verify the policy\./);
  assert.match(prompt, /Improve the document structure\./);
  assert.doesNotMatch(prompt, /VF-REVIEW-DISTINCTIVENESS/);
  assert.match(prompt, /Execution and handoff/);
});

test("combined fix prompt supports German labels and an empty state", () => {
  const prompt = buildCombinedFixPrompt({ items: items.slice(0, 1), target: "https://example.com/", generatedAt: "2026-08-30T10:00:00Z", locale: "de" });

  assert.match(prompt, /Gemeinsamer Umsetzungs-Prompt/);
  assert.match(prompt, /Sicherheit · Content Security Policy/);
  assert.match(prompt, /Technische Referenz: VF-SEC-CSP/);
  assert.equal(buildCombinedFixPrompt({ items: [], target: "https://example.com/", generatedAt: "now" }), "");
});
