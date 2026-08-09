import assert from "node:assert/strict";
import test from "node:test";
import { analyzeHeaders, analyzeHtml, analyzeManifest } from "../lib/analyze-html.mjs";

test("separates direct builder evidence from hosting context", () => {
  const result = analyzeHtml({ html: '<html><body data-lov-id="hero"></body></html>', url: "https://demo.lovable.app/", headers: {} });
  assert.equal(result.verdict.level, "direct");
  assert.deepEqual(result.directEvidence.map((item) => item.label), ["Lovable"]);
  assert.deepEqual(result.contextEvidence.map((item) => item.label), ["Lovable hosting"]);
});

test("does not treat generic Vercel hosting as direct v0 evidence", () => {
  const result = analyzeHtml({ html: "<html><h1>Human site</h1></html>", url: "https://example.vercel.app/", headers: {} });
  assert.equal(result.verdict.level, "indeterminate");
  assert.equal(result.directEvidence.length, 0);
  assert.deepEqual(result.contextEvidence.map((item) => item.label), ["Vercel"]);
});

test("reports multi-signal structural hints without claiming direct attribution", () => {
  const html = `<html><script src="/_next/static/app.js"></script><script src="/assets/index-a1.js"></script><div data-reactroot data-radix-menu style="--tw-x:0">${'<i data-test="x"></i>'.repeat(30)}</div><svg class="lucide-menu"></svg></html>`;
  const result = analyzeHtml({ html, url: "https://example.com/", headers: {} });
  assert.equal(result.directEvidence.length, 0);
  assert.ok(result.stackSignals.length >= 4);
  assert.ok(result.metrics.dataAttributes >= 24);
  assert.equal(result.verdict.level, "indicative");
});

test("finds a direct Bolt marker in a same-origin asset", () => {
  const result = analyzeHtml({
    html: '<html><script src="/assets/index.js"></script></html>',
    assetText: 'const builder = "made with Bolt";',
    url: "https://example.com/",
    headers: {}
  });
  assert.equal(result.verdict.level, "direct");
  assert.deepEqual(result.directEvidence.map((item) => [item.label, item.source]), [["Bolt", "same-origin-asset"]]);
});

test("keeps Replit and StackBlitz runtime traces as context", () => {
  const result = analyzeHtml({
    html: '<html><script src="https://replit-cdn.com/widget.js"></script></html>',
    assetText: "webcontainer runtime",
    url: "https://demo.replit.app/",
    headers: {}
  });
  assert.equal(result.verdict.level, "indeterminate");
  assert.equal(result.directEvidence.length, 0);
  assert.deepEqual(result.contextEvidence.map((item) => item.label), [
    "Replit hosting",
    "Replit runtime",
    "StackBlitz/WebContainer"
  ]);
});

test("reports known response headers as context without changing the verdict", () => {
  const headers = {
    server: "cloudflare",
    "x-vercel-id": "fra1::example",
    "x-powered-by": "Next.js"
  };
  assert.deepEqual(analyzeHeaders(headers).map((item) => item.label), [
    "Vercel response",
    "Cloudflare edge",
    "Next.js response"
  ]);
  const result = analyzeHtml({ html: "<html></html>", url: "https://example.com/", headers });
  assert.equal(result.verdict.level, "indeterminate");
  assert.ok(result.stackSignals.includes("Next.js"));
});

test("treats a valid manifest as context only", () => {
  const analysis = analyzeManifest(JSON.stringify({
    name: "Example",
    display: "standalone",
    icons: [{ src: "/icon.png", sizes: "192x192" }]
  }));
  assert.equal(analysis.validJson, true);
  assert.deepEqual(analysis.evidence.map((item) => item.label), [
    "Web app manifest",
    "Installable display mode",
    "Manifest icons"
  ]);
  assert.deepEqual(analyzeManifest("<html>not json</html>"), { evidence: [], validJson: false });
  assert.deepEqual(analyzeManifest("null"), { evidence: [], validJson: false });
});
