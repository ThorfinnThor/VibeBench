import assert from "node:assert/strict";
import test from "node:test";
import { inspectPublicLaunchSurface } from "../lib/public-launch-check.mjs";

test("public launch check reports presence only and never affects either score", () => {
  const result = inspectPublicLaunchSurface({
    html: `<!doctype html><html lang="en"><head><title>Example</title><meta name="description" content="A page"><meta name="viewport" content="width=device-width"><meta property="og:title" content="Example"><meta property="og:description" content="A page"><link rel="canonical" href="https://example.com"></head><body><h1>Example</h1></body></html>`,
    headers: {}
  });
  assert.equal(result.status, "pass");
  assert.deepEqual(result.counts, { pass: 8, review: 0, attention: 0 });
  assert.equal(result.affectsScores, false);
  assert.match(result.boundary, /not a functional/);
});

test("noindex and missing basics are observations, not a fabricated readiness score", () => {
  const result = inspectPublicLaunchSurface({ html: "<html><head><meta name='robots' content='noindex'></head><body></body></html>" });
  assert.equal(result.status, "attention");
  assert.equal(result.checks.find((item) => item.id === "VF-LAUNCH-INDEXING").status, "attention");
  assert.equal("score" in result, false);
  assert.equal(result.checks.every((item) => item.id.startsWith("VF-LAUNCH-")), true);
});

test("launch checks handle unquoted attributes, robots none, empty headings and invalid canonicals", () => {
  const result = inspectPublicLaunchSurface({
    target: "https://example.com/page",
    html: "<html lang=en><head><title>Example</title><meta name=robots content=none><meta name=description content=Example><meta name=viewport content=width=device-width><link rel=canonical href=javascript:alert(1)><meta property=og:title content=Example><meta property=og:description content=Example></head><body><h1> &nbsp; </h1></body></html>"
  });
  assert.equal(result.checks.find(({ id }) => id === "VF-LAUNCH-INDEXING").status, "attention");
  assert.equal(result.checks.find(({ id }) => id === "VF-LAUNCH-LANGUAGE").status, "pass");
  assert.equal(result.checks.find(({ id }) => id === "VF-LAUNCH-CANONICAL").status, "review");
  assert.equal(result.checks.find(({ id }) => id === "VF-LAUNCH-H1").status, "review");
});
