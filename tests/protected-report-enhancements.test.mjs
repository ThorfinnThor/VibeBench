import assert from "node:assert/strict";
import test from "node:test";
import { buildCodingAgentPrompt, buildTopFixPack, classifyProtectedFinding } from "../lib/protected-report-enhancements.mjs";

const findings = [
  { id: "VF-CTX-BUILDER-PROVENANCE", category: "design", priority: "low", title: "Builder context", why: "A public marker was observed.", action: "Review it.", basis: "context" },
  { id: "VF-DES-GENERIC-UI", category: "design", priority: "medium", title: "Generic patterns", why: "Repeated patterns reduce distinctiveness.", action: "Create one clear visual idea.", basis: "observed" },
  { id: "VF-SEC-CSP", category: "security", priority: "high", title: "Content Security Policy", why: "No enforced policy was observed.", action: "Develop in Report-Only mode first.", basis: "observed" },
  { id: "VF-ENG-ASSET-PAYLOAD", category: "engineering", priority: "high", title: "Large payload", why: "Bounded public assets were large.", action: "Run a bundle analysis.", basis: "observed" },
  { id: "VF-GUIDE-A11Y", category: "accessibility", priority: "low", title: "Manual check", why: "Cannot be inferred.", action: "Test manually.", basis: "guidance" }
];

test("technology context stays non-actionable", () => {
  assert.deepEqual(classifyProtectedFinding(findings[0]), { taxonomy: "technology-context", actionable: false });
  assert.equal(buildCodingAgentPrompt({ finding: findings[0], target: "https://example.com", analyzedAt: "2026-08-19T10:00:00Z" }), null);
});

test("coding-agent prompts are deterministic, bounded and anti-gaming", () => {
  const input = { finding: findings[1], target: "https://example.com", analyzedAt: "2026-08-19T10:00:00Z", evidenceBreadth: "broad", locale: "en" };
  const prompt = buildCodingAgentPrompt(input);
  assert.equal(prompt, buildCodingAgentPrompt(input));
  for (const heading of ["Finding ID", "Observed public finding", "Constraints", "Acceptance criteria", "Validation", "Rescan note"]) assert.match(prompt, new RegExp(heading));
  assert.match(prompt, /Do not optimize for the VibeFootprint score/);
  assert.match(prompt, /not as proof of causality or authorship/);
});

test("top fix pack contains at most three actionable priority findings", () => {
  const pack = buildTopFixPack({ findings, target: "https://example.com", analyzedAt: "2026-08-19T10:00:00Z", evidenceBreadth: "standard" });
  assert.deepEqual(pack.map((item) => item.id), ["VF-ENG-ASSET-PAYLOAD", "VF-SEC-CSP", "VF-DES-GENERIC-UI"]);
  assert.equal(pack.some((item) => item.id === "VF-CTX-BUILDER-PROVENANCE"), false);
  assert.equal(pack.every((item) => typeof item.prompt === "string"), true);
});
