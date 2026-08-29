import { assessDevelopmentPageQuality } from "./content-quality.mjs";

export function parseMediaType(value) {
  return String(value || "").split(";", 1)[0].trim().toLowerCase();
}

export function assertSupportedTextEncoding(value) {
  const match = String(value || "").match(/(?:^|;)\s*charset\s*=\s*(?:"([^"]+)"|'([^']+)'|([^;\s]+))/i);
  if (!match) return;
  const charset = (match[1] || match[2] || match[3] || "").trim().toLowerCase();
  if (!["utf-8", "utf8", "us-ascii"].includes(charset)) throw new Error(`Nicht unterstützte Zeichenkodierung: ${charset}.`);
}

export function assertEligibleHtmlDocument({ status, headers, html }) {
  if (status !== 200) throw new Error(`Website antwortet mit nicht unterstütztem Dokumentstatus HTTP ${status}.`);
  const disposition = headers?.get?.("content-disposition") || "";
  if (/\battachment\b/i.test(disposition)) throw new Error("Die URL liefert einen Download statt einer Website.");
  const quality = assessDevelopmentPageQuality({ headers, html });
  if (!quality.eligible) throw new Error(`Die URL liefert kein auswertbares Website-Dokument (${quality.disqualifying_signals.join(", ")}).`);
}

export function assertV04DocumentSemantics(html) {
  if (/<base\b[^>]*\bhref\s*=/i.test(html)) throw new Error("Das Dokument verwendet eine nicht unterstützte HTML-Basis-URL.");
  const resourceAttributes = html.match(/\b(?:src|href)\s*=\s*(?:"[^"]*"|'[^']*')/gi) || [];
  const unsupportedEntity = /&#(?:x[0-9a-f]+|\d+);|&(?:AMP|sol|colon|period);/;
  if (resourceAttributes.some((attribute) => unsupportedEntity.test(attribute))) throw new Error("Das Dokument verwendet mehrdeutige HTML-Zeichenreferenzen in Ressourcen-URLs.");
}

export function assertScanRequestBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !["url", "checkoutSessionId"].includes(key)) || typeof body.url !== "string" || (body.checkoutSessionId !== undefined && typeof body.checkoutSessionId !== "string")) {
    throw new Error("Ungültige JSON-Anfrage.");
  }
  return { url: body.url, checkoutSessionId: body.checkoutSessionId };
}
