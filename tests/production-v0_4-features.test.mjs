import assert from "node:assert/strict";
import test from "node:test";
import {
  auditSecurity,
  buildRecommendations,
  collectProductionExtendedMetrics,
  explainScore,
  getScoreBand
} from "../lib/production-v0_4-features.mjs";

test("maps every score to an understandable, continuous band", () => {
  assert.equal(getScoreBand(0).id, "low");
  assert.equal(getScoreBand(24).id, "low");
  assert.equal(getScoreBand(25).id, "light");
  assert.equal(getScoreBand(50).id, "medium");
  assert.equal(getScoreBand(70).id, "high");
  assert.equal(getScoreBand(85).id, "very-high");
  assert.equal(getScoreBand(100).id, "very-high");
});

test("gives a complete secure header baseline full credit", () => {
  const result = auditSecurity("https://example.com", {
    "content-security-policy": "default-src 'self'; frame-ancestors 'none'",
    "strict-transport-security": "max-age=31536000",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=()"
  });
  assert.equal(result.score, 100);
  assert.equal(result.checks.length, 7);
  assert.ok(result.checks.every((check) => check.status === "pass"));
});

test("does not reward disabling or permissive security header values", () => {
  const result = auditSecurity("https://example.com", {
    "content-security-policy": "default-src * 'unsafe-inline' 'unsafe-eval'; frame-ancestors *",
    "strict-transport-security": "max-age=0",
    "x-frame-options": "ALLOWALL",
    "x-content-type-options": "anything-nosniff-ish",
    "referrer-policy": "unsafe-url",
    "permissions-policy": "geolocation=*, camera=*, microphone=*"
  });
  assert.ok(result.score < 30);
  assert.equal(result.checks.find((item) => item.id === "csp").status, "fail");
  assert.equal(result.checks.find((item) => item.id === "hsts").status, "fail");
  assert.equal(result.checks.find((item) => item.id === "frame").status, "fail");
  assert.equal(result.checks.find((item) => item.id === "nosniff").status, "warn");
  assert.equal(result.checks.find((item) => item.id === "referrer").status, "fail");
  assert.equal(result.checks.find((item) => item.id === "permissions").status, "fail");
});

test("evaluates effective CSP element directives and parenthesized Permissions-Policy wildcards", () => {
  const result = auditSecurity("https://example.com", {
    "content-security-policy": "default-src 'self'; script-src 'self'; script-src-elem *; frame-ancestors 'none'",
    "strict-transport-security": "max-age=31536000",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(*), microphone=()"
  });
  assert.equal(result.checks.find(({ id }) => id === "csp").status, "fail");
  assert.equal(result.checks.find(({ id }) => id === "permissions").status, "fail");
});

test("rejects broad CSP script schemes and wildcard hosts", () => {
  for (const policy of ["default-src 'self'; script-src-elem https:", "default-src 'self'; script-src https://*.example.com", "default-src 'self'; script-src data:"]) {
    const result = auditSecurity("https://example.com", { "content-security-policy": policy });
    assert.equal(result.checks.find(({ id }) => id === "csp").status, "fail", policy);
  }
});

test("recommendations preserve all findings and do not advise score gaming", () => {
  const recommendations = buildRecommendations({
    analysis: { directEvidence: [{ label: "Bolt" }] },
    pageMetrics: { asset_bytes_fetched: 1_000_000, inline_script_bytes: 100_000, headings: 0 },
    extendedMetrics: { shadcn_variable_coverage: 10, data_slot_attributes: 5, ui_cliche_tokens: 10, sections: 0, external_host_count: 100 },
    security: auditSecurity("http://example.com", {})
  });
  assert.ok(recommendations.length > 10);
  assert.equal(recommendations.some(({ why, action }) => /score|external host|third.party/i.test(`${why} ${action}`)), false);
  const marker = recommendations.find(({ title }) => title === "Builder-Provenienz bewusst entscheiden");
  assert.equal(marker.id, "VF-CTX-BUILDER-PROVENANCE");
  assert.equal(marker.basis, "context");
  assert.equal(marker.priority, "low");
  assert.match(marker.action, /Brand-, Privacy- oder Release-Grund/);
});

test("recommendation IDs are stable and independent from list position", () => {
  const recommendations = buildRecommendations({
    analysis: { directEvidence: [] },
    pageMetrics: { asset_bytes_fetched: 1_000_000, inline_script_bytes: 100_000, headings: 0 },
    extendedMetrics: { shadcn_variable_coverage: 10, data_slot_attributes: 0, ui_cliche_tokens: 10, sections: 0 },
    security: auditSecurity("https://example.com", {})
  });
  const ids = recommendations.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ["VF-SEC-CSP", "VF-DES-COMPONENT-SYSTEM", "VF-DES-GENERIC-UI", "VF-ENG-ASSET-PAYLOAD", "VF-ENG-INLINE-JS", "VF-CONTENT-HIERARCHY"]) assert.ok(ids.includes(id));
});

test("score explanations distinguish detected and absent binary features", () => {
  const model = {
    feature_names: ["stack:React", "stack:Next.js", "stack:Vite", "stack:Radix UI"],
    coefficients: { "stack:React": 1, "stack:Next.js": 1, "stack:Vite": -1, "stack:Radix UI": -1 },
    standardization: Object.fromEntries(["stack:React", "stack:Next.js", "stack:Vite", "stack:Radix UI"].map((name) => [name, { mean: .5, standard_deviation: .5 }]))
  };
  const explanations = explainScore(model, { "stack:React": 1, "stack:Next.js": 0, "stack:Vite": 1, "stack:Radix UI": 0 });
  assert.deepEqual(explanations.map((item) => [item.feature, item.state, item.direction, item.summaryVisible]), [
    ["stack:React", "detected", "raises", true],
    ["stack:Next.js", "not-detected", "lowers", false],
    ["stack:Vite", "detected", "lowers", true],
    ["stack:Radix UI", "not-detected", "raises", false]
  ]);
  assert.match(explanations[3].description, /nicht erkannt/);
  assert.ok(explanations.every((item) => item.unit === "relative-logit-contribution"));
});

test("turns missing public security headers into prioritized actions", () => {
  const security = auditSecurity("https://example.com", {});
  const recommendations = buildRecommendations({
    analysis: { directEvidence: [] },
    pageMetrics: { asset_bytes_fetched: 0, inline_script_bytes: 0, buttons: 0, inputs: 0, aria_attributes: 0, headings: 3 },
    extendedMetrics: { shadcn_variable_coverage: 0, data_slot_attributes: 0, ui_cliche_tokens: 0, sections: 2, external_host_count: 0 },
    security
  });
  assert.ok(security.score < 50);
  assert.equal(recommendations[0].category, "security");
  assert.equal(recommendations[0].priority, "high");
  assert.ok(recommendations.some((item) => item.title === "Content Security Policy"));
  assert.ok(recommendations.some((item) => item.category === "design"));
  assert.ok(recommendations.some((item) => item.category === "engineering"));
  assert.ok(recommendations.some((item) => item.category === "accessibility"));
  assert.ok(recommendations.filter((item) => item.basis === "observed").every((item) => item.category === "security"));
  assert.ok(recommendations.some((item) => item.basis === "guidance"));
});

test("does not infer inaccessible controls from a low ARIA attribute count", () => {
  const recommendations = buildRecommendations({
    analysis: { directEvidence: [] },
    pageMetrics: { asset_bytes_fetched: 0, inline_script_bytes: 0, buttons: 8, inputs: 4, aria_attributes: 0, headings: 3 },
    extendedMetrics: { shadcn_variable_coverage: 0, data_slot_attributes: 0, ui_cliche_tokens: 0, sections: 2, external_host_count: 0 },
    security: auditSecurity("https://example.com", {
      "content-security-policy": "default-src 'self'; frame-ancestors 'none'",
      "strict-transport-security": "max-age=31536000",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=(), microphone=()"
    })
  });
  assert.equal(recommendations.some((item) => item.basis === "observed" && item.category === "accessibility"), false);
});

test("extracts production metrics used by the frozen candidate feature map", () => {
  const metrics = collectProductionExtendedMetrics(
    '<main class="min-h-screen rounded-3xl"><section data-slot="card"><h1>Ein eigener Inhalt</h1></section></main>',
    ":root{--background:white;--foreground:black;--primary:blue}"
  );
  assert.equal(metrics.sections, 1);
  assert.equal(metrics.data_slot_attributes, 1);
  assert.ok(metrics.ui_cliche_tokens >= 2);
  assert.equal(metrics.shadcn_variable_coverage, 3);
});
