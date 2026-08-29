import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../components/VibeFootprintHome.tsx", import.meta.url), "utf8");
const scanRoute = readFileSync(new URL("../app/api/scan/route.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("customer-facing UI contains no research-beta or confidential-preview wording", () => {
  assert.doesNotMatch(page, /Research[ -]?Beta|Beta-Modell|beta model|Confidential diagnostic preview|Vertrauliche Diagnosevorschau/i);
});

test("full report design sample is visible on request without exposing protected scan detail", () => {
  assert.match(page, /Preview full report design/);
  assert.match(page, /Illustrative content only/);
  assert.match(page, /not protected findings from this scan/);
  assert.match(page, /sampleReportOpen/);
});

test("customer conversion starts with a free scan and unlocks the exact audit through Stripe", () => {
  assert.match(page, /Run free website scan/);
  assert.match(page, /Unlock full audit — €4\.99/);
  assert.match(page, /€49\.99/);
  assert.match(page, /securely via Stripe/);
  assert.match(page, /href="\/contact"/);
  assert.match(scanRoute, /!adminAuthorization\.authorized && scanRequest\.checkoutSessionId/);
  assert.match(styles, /\.locked-preview-document[^}]+filter:\s*blur/);
  assert.doesNotMatch(page, /Checkout is not connected yet/);
  assert.doesNotMatch(page, /window\.localStorage/);
});
