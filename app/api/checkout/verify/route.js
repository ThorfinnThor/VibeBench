import { readLimitedText } from "../../../../lib/bounded-response.mjs";
import { retrieveScanCheckout, verifiedScanCheckout } from "../../../../lib/stripe-scan-payment.mjs";

export const runtime = "nodejs";

const headers = { "cache-control": "private, no-store, max-age=0" };

export async function POST(request) {
  try {
    const input = await readLimitedText(request, 1_024);
    if (input.truncated) throw new Error("Ungültige Checkout-Anfrage.");
    const body = JSON.parse(input.text);
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 1 || typeof body.sessionId !== "string") {
      throw new Error("Ungültige Checkout-Anfrage.");
    }
    const session = await retrieveScanCheckout({ sessionId: body.sessionId, secret: process.env.STRIPE_SECRET_KEY });
    const targetUrl = session?.metadata?.scan_target;
    if (!verifiedScanCheckout(session, targetUrl)) throw new Error("Zahlung nicht bestätigt.");
    return Response.json({ ok: true, sessionId: session.id, url: targetUrl }, { headers });
  } catch (error) {
    const configurationError = String(error?.message || "").includes("noch nicht konfiguriert");
    return Response.json({ ok: false, error: configurationError ? "Die Zahlung ist noch nicht freigeschaltet." : "Die Zahlung konnte nicht bestätigt werden." }, { status: configurationError ? 503 : 402, headers });
  }
}
