import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../components/VibeFootprintHome.tsx", import.meta.url), "utf8");

test("customer-facing UI contains no research-beta or confidential-preview wording", () => {
  assert.doesNotMatch(page, /Research[ -]?Beta|Beta-Modell|beta model|Confidential diagnostic preview|Vertrauliche Diagnosevorschau/i);
});

test("full report design sample is visible on request without exposing protected scan detail", () => {
  assert.match(page, /Preview full report design/);
  assert.match(page, /Illustrative content only/);
  assert.match(page, /not protected findings from this scan/);
  assert.match(page, /sampleReportOpen/);
});
