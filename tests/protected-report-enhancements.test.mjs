import assert from "node:assert/strict";
import test from "node:test";
import { buildCodingAgentPrompt, buildDistinctivenessReviewPrompt, buildTopFixPack, classifyProtectedFinding } from "../lib/protected-report-enhancements.mjs";

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
  for (const heading of ["Finding ID", "Observed public finding", "Investigation before editing", "Implementation requirements", "Constraints", "Acceptance criteria", "Validation", "Required handoff", "Rescan note"]) assert.match(prompt, new RegExp(heading));
  assert.match(prompt, /Do not optimize for the VibeFootprint score/);
  assert.match(prompt, /not as proof of causality or authorship/);
  assert.match(prompt, /shared tokens and reusable components/);
  assert.ok(prompt.length > 2_000, `expected a professional prompt, received ${prompt.length} characters`);
});

test("top fix pack contains at most three actionable priority findings", () => {
  const pack = buildTopFixPack({ findings, target: "https://example.com", analyzedAt: "2026-08-19T10:00:00Z", evidenceBreadth: "standard" });
  assert.deepEqual(pack.map((item) => item.id), ["VF-ENG-ASSET-PAYLOAD", "VF-SEC-CSP", "VF-DES-GENERIC-UI"]);
  assert.equal(pack.some((item) => item.id === "VF-CTX-BUILDER-PROVENANCE"), false);
  assert.equal(pack.every((item) => typeof item.prompt === "string"), true);
});

test("high similarity can produce an optional anti-gaming distinctiveness review without inventing a defect", () => {
  const prompt = buildDistinctivenessReviewPrompt({
    score: 91,
    scoreBand: "Very high Vibe-Footprint",
    scoreDrivers: { raises: [{ label: "Component repetition", description: "Above the reference baseline." }] },
    target: "https://example.com/",
    analyzedAt: "2026-08-20T10:00:00Z",
    locale: "en"
  });
  assert.match(prompt, /public-pattern similarity index, not a defect count/);
  assert.match(prompt, /Component repetition/);
  assert.match(prompt, /When this review is useful/);
  assert.match(prompt, /investigation clues/);
  assert.match(prompt, /Required deliverables/);
  assert.match(prompt, /Verification matrix/);
  assert.match(prompt, /Do not hide public evidence/);
  assert.equal(buildDistinctivenessReviewPrompt({ score: 42, scoreBand: "Light", scoreDrivers: { raises: [] }, target: "https://example.com/", analyzedAt: "2026-08-20T10:00:00Z" }), null);
});
