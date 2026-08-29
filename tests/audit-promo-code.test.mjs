import assert from "node:assert/strict";
import test from "node:test";
import { auditPromoConfigured, normalizeAuditPromoCode, verifyAuditPromoCode } from "../lib/audit-promo-code.mjs";

test("promo codes are normalized without exposing or weakening the configured value", () => {
  assert.equal(normalizeAuditPromoCode("  launch-2026  "), "LAUNCH-2026");
  assert.equal(auditPromoConfigured("launch-2026"), true);
  assert.equal(verifyAuditPromoCode({ providedCode: " Launch-2026 ", configuredCode: "LAUNCH-2026" }), true);
});

test("invalid, short and mismatched promo codes fail closed", () => {
  assert.equal(normalizeAuditPromoCode("short"), null);
  assert.equal(normalizeAuditPromoCode("invalid code"), null);
  assert.equal(auditPromoConfigured(undefined), false);
  assert.equal(verifyAuditPromoCode({ providedCode: "LAUNCH-2025", configuredCode: "LAUNCH-2026" }), false);
  assert.equal(verifyAuditPromoCode({ providedCode: "WRONG", configuredCode: "LAUNCH-2026" }), false);
});
