import assert from "node:assert/strict";
import test from "node:test";
import { collectV05Metrics, V05_METRICS } from "../lib/development-v0_5-page-scan.mjs";
import { V05_FEATURES, buildV05FeatureMap } from "../lib/development-v0_5-candidate.mjs";

test("collects additional public-surface design, content, library, and build metrics", () => {
  const html = `<!doctype html><html><head><title>Example</title><meta name="description" content="Everything you need to move faster"><meta property="og:title" content="Example"><link rel="canonical" href="https://example.com"><link rel="icon" href="/icon.svg"></head><body><main class="md:grid rounded-3xl shadow-xl backdrop-blur"><article><h1>Transform your workflow in minutes</h1><a>Get started</a><ul><li>One</li></ul></article></main></body></html>`;
  const fetchedAssets = [{ kind: "script", text: "webpackChunk; @mui/material; //# sourceMappingURL=app.js.map" }, { kind: "stylesheet", text: "@media(min-width:40rem){.x{font-size:clamp(1rem,2vw,2rem)}}" }];
  const metrics = collectV05Metrics(html, fetchedAssets);
  assert.equal(Object.keys(metrics).length, V05_METRICS.length);
  assert.equal(metrics.title_chars, 7);
  assert.ok(metrics.marketing_cliche_phrases >= 2);
  assert.equal(metrics.cta_phrases, 1);
  assert.equal(metrics.mui_fingerprints, 1);
  assert.equal(metrics.source_map_refs, 1);
  assert.equal(metrics.responsive_class_tokens, 1);
});

test("builds a finite v0.5 feature map without changing the frozen v0.4 feature builder", () => {
  const empty = Object.fromEntries(V05_METRICS.map((name) => [name, 0]));
  const features = buildV05FeatureMap({ sample_id: "synthetic", stack_signals: [], direct_evidence: [], context_evidence: [], header_evidence: [], structural_hints: [], page_metrics: {}, extended_metrics: {}, v0_5_metrics: empty, asset_scan: { requested: 0, fetched: 0 } });
  assert.equal(Object.keys(features).length, V05_FEATURES.length);
  assert.ok(Object.values(features).every(Number.isFinite));
});
