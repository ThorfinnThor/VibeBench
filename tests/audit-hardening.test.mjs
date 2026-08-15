import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { readLimitedText } from "../lib/bounded-response.mjs";
import { isNonPublicIp, normalizePublicUrl } from "../lib/public-url-policy.mjs";
import { parseScanPayload, SCAN_API_VERSION } from "../lib/scan-contract.mjs";
import {
  assertEligibleHtmlDocument,
  assertScanRequestBody,
  assertSupportedTextEncoding,
  assertV04DocumentSemantics,
  parseMediaType
} from "../lib/scan-response-policy.mjs";

const validFailure = () => ({
  apiVersion: SCAN_API_VERSION,
  ok: false,
  requestId: "request-1",
  technicalOutcome: { code: "timeout", title: "Timeout", summary: "No result was produced.", action: "Try again later.", retryable: true }
});

const validSuccess = () => ({
  apiVersion: SCAN_API_VERSION,
  ok: true,
  requestId: "request-1",
  requestedUrl: "https://example.com/",
  resolvedUrl: "https://example.com/",
  httpStatus: 200,
  analyzedAt: "2026-08-15T10:00:00.000Z",
  vibeScore: {
    score: 55,
    probability: .55,
    threshold: 44,
    aboveValidatedThreshold: true,
    meaning: "Corpus similarity.",
    caveat: "Not proof of authorship.",
    band: { id: "medium", label: "Mittel", shortLabel: "Mittel", summary: "Gemischte Signatur" }
  },
  evidenceCoverage: {
    level: "standard",
    label: "Standard",
    summary: "Öffentliches HTML wurde ausgewertet.",
    affectsScore: false,
    scope: { html: "fetched", assetsDiscovered: 0, assetsSelected: 0, assetCandidates: 0, assetsFetched: 0, assetErrors: 0, truncatedAssets: 0, manifestLinked: false, manifestFetched: false }
  },
  security: { score: 50, checks: [] },
  scoreDrivers: { raises: [], lowers: [], unit: "relative-logit-contribution", baseLogit: 0 },
  recommendations: [],
  assetScan: { discovered: 0, selected: 0, ignoredByCap: 0, candidates: 0, fetched: 0, errors: 0, bytes: 0, truncated: 0 },
  manifestScan: { linked: false, fetched: false, validJson: false, bytes: 0, truncated: false },
  model: { version: "v0.4", releaseStatus: "RESEARCH_BETA", independentHoldout: 100, successfulHoldoutScans: 99, technicalCoverage: .99, precision: .85, recall: .85, f1: .85 },
  directEvidence: [],
  contextEvidence: [],
  headerEvidence: [],
  manifestEvidence: [],
  stackSignals: [],
  structuralHints: [],
  metrics: { htmlBytes: 100 },
  warning: "A bounded research estimate."
});

test("normalizes only credential-free HTTP(S) URLs on standard ports", () => {
  assert.equal(normalizePublicUrl("example.com/path#fragment").toString(), "https://example.com/path");
  assert.equal(normalizePublicUrl("example.com:443/path").toString(), "https://example.com/path");
  assert.equal(normalizePublicUrl("example.com:80/path").toString(), "http://example.com/path");
  assert.throws(() => normalizePublicUrl("ftp://example.com/file"), /Nur öffentliche HTTP/);
  assert.throws(() => normalizePublicUrl("https://example.com:8443"), /Standardports/);
  assert.throws(() => normalizePublicUrl("https://user:pass@example.com"), /Zugangsdaten/);
});

test("blocks mapped, private and special IP ranges while allowing public examples", () => {
  for (const address of ["10.0.0.1", "100.100.100.200", "127.0.0.1", "169.254.169.254", "172.16.0.1", "192.168.1.1", "198.18.0.1", "203.0.113.1", "::1", "::ffff:172.16.0.1", "::ffff:169.254.169.254", "2001::1", "2001:db8::1", "2002:0a00:1::", "3fff::1", "4000::1", "fec0::1", "ff02::1"]) {
    assert.equal(isNonPublicIp(address), true, address);
  }
  assert.equal(isNonPublicIp("1.1.1.1"), false);
  assert.equal(isNonPublicIp("2606:4700:4700::1111"), false);
});

test("bounded reader cancels a chunked body at the configured byte limit", async () => {
  let cancelled = false;
  const body = new ReadableStream({
    pull(controller) {
      controller.enqueue(new Uint8Array(700));
    },
    cancel() {
      cancelled = true;
    }
  });
  const result = await readLimitedText(new Response(body), 1_500);
  assert.deepEqual({ bytes: result.bytes, truncated: result.truncated, cancelled }, { bytes: 1_500, truncated: true, cancelled: true });
});

test("scan response policy fails closed on ambiguous or ineligible documents", () => {
  assert.equal(parseMediaType("text/html; charset=UTF-8"), "text/html");
  assert.doesNotThrow(() => assertSupportedTextEncoding("text/html; charset=us-ascii"));
  assert.throws(() => assertSupportedTextEncoding("text/html; charset=utf-16"), /Zeichenkodierung/);
  assert.throws(() => assertEligibleHtmlDocument({ status: 200, headers: new Headers({ "content-disposition": "attachment" }), html: "<main>Download content</main>" }), /Download/);
  assert.throws(() => assertEligibleHtmlDocument({ status: 204, headers: new Headers(), html: "<main>Empty</main>" }), /Dokumentstatus HTTP 204/);
  assert.throws(() => assertV04DocumentSemantics('<base href="https://cdn.example/"><main>Page</main>'), /Basis-URL/);
  assert.throws(() => assertV04DocumentSemantics('<script src="/app.js?x=1&#38;y=2"></script>'), /Zeichenreferenzen/);
  assert.doesNotThrow(() => assertV04DocumentSemantics('<script src="/app.js?x=1&amp;y=2"></script>'));
});

test("scan requests accept exactly one string URL field", () => {
  assert.equal(assertScanRequestBody({ url: "https://example.com" }), "https://example.com");
  for (const value of [null, [], {}, { url: 1 }, { url: "https://example.com", debug: true }]) {
    assert.throws(() => assertScanRequestBody(value), /JSON-Anfrage/);
  }
});

test("runtime scan contract rejects partial success and incompatible versions", () => {
  assert.equal(parseScanPayload({ apiVersion: SCAN_API_VERSION, ok: true }), null);
  assert.equal(parseScanPayload({ ...validFailure(), apiVersion: "future" }), null);
  assert.ok(parseScanPayload(validFailure()));
  assert.ok(parseScanPayload(validSuccess()));
  const incomplete = validSuccess();
  delete incomplete.assetScan.discovered;
  assert.equal(parseScanPayload(incomplete), null);
  const misleading = validSuccess();
  misleading.evidenceCoverage = { ...misleading.evidenceCoverage, level: "high-confidence", affectsScore: true };
  assert.equal(parseScanPayload(misleading), null);
});

test("production release manifest binds the frozen model hash and confirmation coverage", async () => {
  const release = JSON.parse(await readFile(new URL("../release/v0.4.json", import.meta.url), "utf8"));
  const model = await readFile(new URL(`../${release.model.artifact}`, import.meta.url));
  assert.equal(createHash("sha256").update(model).digest("hex"), release.model.sha256);
  assert.equal(release.model.threshold, .44);
  assert.deepEqual([release.confirmation.total, release.confirmation.successful, release.confirmation.coverage], [100, 99, .99]);
  assert.equal(release.status, "RESEARCH_BETA");
});
