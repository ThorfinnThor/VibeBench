import assert from "node:assert/strict";
import test from "node:test";
import { extractSameOriginAssets } from "../lib/extract-assets.mjs";

test("extracts capped same-origin scripts and stylesheets", () => {
  const html = `
    <script src="/assets/a.js"></script>
    <script src="https://example.com/assets/b.js#hash"></script>
    <script src="https://third-party.example/tracker.js"></script>
    <script src="/assets/c.js"></script>
    <link rel="preload stylesheet" href="/assets/app.css?x=1&amp;y=2">
    <link rel="stylesheet" href="https://cdn.example/app.css">
  `;
  const assets = extractSameOriginAssets({ html, baseUrl: "https://example.com/path", maxScripts: 2, maxStylesheets: 1 });
  assert.deepEqual(assets, [
    { kind: "script", url: "https://example.com/assets/a.js" },
    { kind: "script", url: "https://example.com/assets/b.js" },
    { kind: "stylesheet", url: "https://example.com/assets/app.css?x=1&y=2" }
  ]);
});

test("rejects credentials, non-http URLs, and duplicate assets", () => {
  const html = `
    <script src="/app.js"></script>
    <script src="/app.js#again"></script>
    <script src="data:text/javascript,alert(1)"></script>
    <script src="https://user:pass@example.com/secret.js"></script>
  `;
  assert.deepEqual(extractSameOriginAssets({ html, baseUrl: "https://example.com/" }), [
    { kind: "script", url: "https://example.com/app.js" }
  ]);
});
