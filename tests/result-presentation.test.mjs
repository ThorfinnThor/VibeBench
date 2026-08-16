import assert from "node:assert/strict";
import test from "node:test";
import { classifyScanError, getVerdictPresentation } from "../lib/result-presentation.mjs";

test("presents indicative output as non-attributive context", () => {
  const presentation = getVerdictPresentation("indicative");
  assert.equal(presentation.title, "Allgemeine Strukturmuster");
  assert.match(presentation.summary, /menschlich entwickelten Websites/);
  assert.match(presentation.boundary, /nicht als AI- oder Vibe-Coding-Zuordnung/);
});

test("keeps indeterminate distinct from a Human classification", () => {
  const presentation = getVerdictPresentation("indeterminate");
  assert.match(presentation.boundary, /nicht.*menschlich erstellt/);
});

test("maps blocked targets to a technical non-result", () => {
  const outcome = classifyScanError(new Error("Website antwortet mit HTTP 403."));
  assert.equal(outcome.code, "access_blocked");
  assert.equal(outcome.retryable, false);
  assert.match(outcome.summary, /kein Klassifikationsergebnis/);
});

test("maps size limits and timeouts separately", () => {
  const tooLarge = classifyScanError("Die HTML-Antwort ist für den sicheren Schnellscan zu groß.");
  const timeout = classifyScanError("The operation was aborted due to timeout");
  assert.equal(tooLarge.code, "html_too_large");
  assert.equal(tooLarge.retryable, false);
  assert.equal(timeout.code, "target_timeout");
  assert.equal(timeout.retryable, true);
});

test("maps invalid and private URLs to actionable input outcomes", () => {
  assert.equal(classifyScanError("Bitte eine gültige öffentliche URL eingeben.").code, "invalid_url");
  assert.equal(classifyScanError("Lokale und private Adressen werden nicht gescannt.").code, "private_address");
  assert.equal(classifyScanError("Die URL verweist auf eine lokale, reservierte oder nicht öffentliche Adresse.").code, "private_address");
  assert.equal(classifyScanError("Nur die öffentlichen Standardports 80 und 443 werden unterstützt.").code, "unsupported_protocol");
  assert.equal(classifyScanError("Ungültige JSON-Anfrage.").code, "invalid_request");
  assert.equal(classifyScanError("URLs mit Zugangsdaten werden nicht unterstützt.").code, "credentials_not_supported");
});

test("maps launch admission limits separately from target failures", () => {
  assert.deepEqual(
    classifyScanError(new Error("VibeBench Beta-Limit erreicht.")),
    { code: "client_rate_limited", title: "Beta-Limit erreicht", summary: "Für diesen Zugang wurden in kurzer Zeit zu viele Scans gestartet.", action: "Nach zehn Minuten erneut versuchen.", retryable: true, responseStatus: 429 }
  );
  assert.equal(classifyScanError(new Error("VibeBench Scan-Kapazität vorübergehend erreicht.")).code, "service_busy");
  assert.equal(classifyScanError(new Error("Für diese Website läuft bereits ein Scan.")).code, "target_scan_in_progress");
});

test("separates temporary HTTP states, unsupported documents and limited evidence", () => {
  for (const status of [408, 425]) {
    const outcome = classifyScanError(`Website antwortet mit HTTP ${status}.`);
    assert.equal(outcome.code, "target_temporarily_unavailable");
    assert.equal(outcome.retryable, true);
  }
  assert.equal(classifyScanError("Nicht unterstützte Zeichenkodierung: utf-16.").code, "unsupported_encoding");
  assert.equal(classifyScanError("Auswertungsbreite unzureichend für einen belastbaren Score.").code, "insufficient_evidence");
  assert.equal(classifyScanError("Die URL liefert einen Download statt einer Website.").code, "ineligible_document");
});
