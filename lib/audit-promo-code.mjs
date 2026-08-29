import { timingSafeEqual } from "node:crypto";

export const AUDIT_PROMO_CODE_ENV = "VIBEFOOTPRINT_PROMO_CODE";

export function normalizeAuditPromoCode(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z0-9][A-Z0-9_-]{5,63}$/.test(normalized) ? normalized : null;
}

export function auditPromoConfigured(value) {
  return normalizeAuditPromoCode(value) !== null;
}

export function verifyAuditPromoCode({ providedCode, configuredCode }) {
  const provided = normalizeAuditPromoCode(providedCode);
  const configured = normalizeAuditPromoCode(configuredCode);
  if (!provided || !configured) return false;
  const providedBytes = Buffer.from(provided, "utf8");
  const configuredBytes = Buffer.from(configured, "utf8");
  return providedBytes.length === configuredBytes.length && timingSafeEqual(providedBytes, configuredBytes);
}
