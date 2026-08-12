import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { readLimitedText } from "../lib/bounded-response.mjs";
import { isNonPublicIp, normalizePublicUrl } from "../lib/public-url-policy.mjs";
import { parseScanPayload, SCAN_API_VERSION } from "../lib/scan-contract.mjs";

test("normalizes only credential-free HTTP(S) URLs on standard ports", () => {
  assert.equal(normalizePublicUrl("example.com/path#fragment").toString(), "https://example.com/path");
  assert.throws(() => normalizePublicUrl("ftp://example.com/file"), /Nur öffentliche HTTP/);
  assert.throws(() => normalizePublicUrl("https://example.com:8443"), /Standardports/);
  assert.throws(() => normalizePublicUrl("https://user:pass@example.com"), /Zugangsdaten/);
});

test("blocks mapped, private and special IP ranges while allowing public examples", () => {
  for (const address of ["10.0.0.1", "100.100.100.200", "127.0.0.1", "169.254.169.254", "172.16.0.1", "192.168.1.1", "198.18.0.1", "203.0.113.1", "::1", "::ffff:172.16.0.1", "::ffff:169.254.169.254", "2001::1", "2001:db8::1", "2002:0a00:1::", "fec0::1", "ff02::1"]) {
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

test("runtime scan contract rejects partial success and incompatible versions", () => {
  assert.equal(parseScanPayload({ apiVersion: SCAN_API_VERSION, ok: true }), null);
  assert.equal(parseScanPayload({ apiVersion: "future", ok: false, technicalOutcome: { code: "x", title: "x", retryable: true } }), null);
  assert.ok(parseScanPayload({ apiVersion: SCAN_API_VERSION, ok: false, technicalOutcome: { code: "timeout", title: "Timeout", retryable: true } }));
  assert.ok(parseScanPayload({ apiVersion: SCAN_API_VERSION, ok: true, vibeScore: { score: 55, band: { label: "Mittel", summary: "Gemischte Signatur" } }, security: { score: 50, checks: [] }, scoreDrivers: { raises: [], lowers: [] }, recommendations: [] }));
});

test("production release manifest binds the frozen model hash and confirmation coverage", async () => {
  const release = JSON.parse(await readFile(new URL("../release/v0.4.json", import.meta.url), "utf8"));
  const model = await readFile(new URL(`../${release.model.artifact}`, import.meta.url));
  assert.equal(createHash("sha256").update(model).digest("hex"), release.model.sha256);
  assert.equal(release.model.threshold, .44);
  assert.deepEqual([release.confirmation.total, release.confirmation.successful, release.confirmation.coverage], [100, 99, .99]);
  assert.equal(release.status, "RESEARCH_BETA");
});
