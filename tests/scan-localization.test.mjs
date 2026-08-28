import assert from "node:assert/strict";
import test from "node:test";
import { localizeScanPayload, localizeTechnicalOutcome } from "../lib/scan-localization.mjs";

test("localizes dynamic scan output for the English default", () => {
  const payload = localizeScanPayload({
    vibeScore: { band: { id: "medium", label: "Mittlerer Vibe-Footprint", shortLabel: "Mittel", summary: "Deutsch" }, meaning: "Deutsch", caveat: "Deutsch" },
    evidenceCoverage: { level: "broad", label: "Breit", summary: "Deutsch", scope: { assetsFetched: 3, assetCandidates: 3, assetsDiscovered: 8 } },
    scoreDrivers: { raises: [{ feature: "metric:buttons", featureType: "continuous", state: "measured", direction: "raises", rawValue: 4, trainingBaseline: 2, label: "Strukturwert", description: "Deutsch" }], lowers: [] },
    recommendations: [{ id: "security-1", category: "security", priority: "high", title: "Content Security Policy", why: "Deutsch", action: "Deutsch", basis: "observed" }],
    security: { checks: [{ id: "csp", title: "Content Security Policy", status: "fail", detail: "Deutsch", action: "Deutsch" }] },
    warning: "Deutsch"
  });
  assert.equal(payload.vibeScore.band.label, "Medium Vibe-Footprint");
  assert.equal(payload.evidenceCoverage.label, "Broad");
  assert.match(payload.scoreDrivers.raises[0].description, /above the training average/);
  assert.match(payload.recommendations[0].action, /Report-Only/);
  assert.match(payload.security.checks[0].detail, /Content-Security-Policy/);
  assert.match(payload.warning, /uncalibrated similarity/);
});

test("keeps German output unchanged and translates technical errors", () => {
  const outcome = { code: "invalid_url", title: "URL nicht gültig", summary: "Deutsch", action: "Deutsch", retryable: false };
  assert.equal(localizeTechnicalOutcome(outcome, "de"), outcome);
  assert.equal(localizeTechnicalOutcome(outcome, "en").title, "Invalid URL");
});

test("translates the generic server failure for the English launch surface", () => {
  const translated = localizeTechnicalOutcome({ code: "scan_failed", title: "Technischer Scan fehlgeschlagen", summary: "Deutsch", action: "Deutsch", retryable: true }, "en");
  assert.equal(translated.title, "Technical scan failed");
  assert.match(translated.summary, /No score was created/);
});
