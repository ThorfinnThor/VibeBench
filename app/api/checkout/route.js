import { readLimitedText } from "../../../lib/bounded-response.mjs";
import { normalizePublicUrl } from "../../../lib/public-url-policy.mjs";
import { createScanCheckout } from "../../../lib/stripe-scan-payment.mjs";

export const runtime = "nodejs";

const headers = { "cache-control": "private, no-store, max-age=0" };

export async function POST(request) {
  try {
    const input = await readLimitedText(request, 2_048);
    if (input.truncated) throw new Error("Die Checkout-Anfrage ist zu groß.");
    const body = JSON.parse(input.text);
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 1 || typeof body.url !== "string") {
      throw new Error("Ungültige Checkout-Anfrage.");
    }
    const targetUrl = normalizePublicUrl(body.url).toString();
    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const checkout = await createScanCheckout({ targetUrl, origin: configuredOrigin, secret: process.env.STRIPE_SECRET_KEY });
    return Response.json({ ok: true, url: checkout.url }, { headers });
  } catch (error) {
    const configurationError = String(error?.message || "").includes("noch nicht konfiguriert");
    return Response.json({ ok: false, error: configurationError ? "Die Zahlung ist noch nicht freigeschaltet." : "Der sichere Checkout konnte nicht geöffnet werden. Bitte versuche es erneut." }, { status: configurationError ? 503 : 400, headers });
  }
}
