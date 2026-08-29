export const STRIPE_SCAN_PRODUCT = "vibefootprint_launch_scan_v1";
export const STRIPE_SCAN_AMOUNT = 499;
export const STRIPE_SCAN_REFERENCE_AMOUNT = 4999;
export const STRIPE_SCAN_CURRENCY = "eur";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const CHECKOUT_ID = /^cs_(?:test|live)_[A-Za-z0-9]+$/;
const PRICE_ID = /^price_[A-Za-z0-9]+$/;

function stripeSecret(secret) {
  if (typeof secret !== "string" || !/^(?:sk|rk)_(?:test|live)_[A-Za-z0-9_]+$/.test(secret)) {
    throw new Error("Stripe ist noch nicht konfiguriert.");
  }
  return secret;
}

function stripePriceId(priceId) {
  if (typeof priceId !== "string" || !PRICE_ID.test(priceId)) {
    throw new Error("Stripe ist noch nicht konfiguriert.");
  }
  return priceId;
}

export function assertCheckoutSessionId(value) {
  if (typeof value !== "string" || !CHECKOUT_ID.test(value)) throw new Error("Ungültige Stripe-Checkout-Session.");
  return value;
}

export function assertCheckoutTarget(value) {
  if (typeof value !== "string" || value.length < 8 || value.length > 450) throw new Error("Die Scan-URL ist für den Checkout ungültig.");
  return value;
}

export function checkoutOrigin(value) {
  const origin = new URL(value);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
  if (origin.pathname !== "/" || origin.search || origin.hash || (!local && origin.protocol !== "https:") || (local && !["http:", "https:"].includes(origin.protocol))) {
    throw new Error("Ungültige Checkout-Origin.");
  }
  return origin.origin;
}

async function stripeRequest(path, { secret, fetchImpl = fetch, method = "GET", body } = {}) {
  const response = await fetchImpl(`${STRIPE_API_BASE}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${stripeSecret(secret)}`,
      ...(body ? { "content-type": "application/x-www-form-urlencoded" } : {})
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000)
  });
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Stripe hat keine gültige Antwort geliefert.");
  }
  if (!response.ok) {
    const stripeError = payload?.error;
    console.error("Stripe Checkout request failed", {
      status: response.status,
      type: typeof stripeError?.type === "string" ? stripeError.type : "unknown",
      code: typeof stripeError?.code === "string" ? stripeError.code : "unknown",
      message: typeof stripeError?.message === "string" ? stripeError.message : "No Stripe error message"
    });
    throw new Error("Stripe Checkout konnte nicht vorbereitet werden.");
  }
  return payload;
}

export async function createScanCheckout({ targetUrl, origin, secret, priceId, fetchImpl = fetch }) {
  const target = assertCheckoutTarget(targetUrl);
  const siteOrigin = checkoutOrigin(origin);
  const form = new URLSearchParams({
    mode: "payment",
    "line_items[0][price]": stripePriceId(priceId),
    "line_items[0][quantity]": "1",
    "metadata[product]": STRIPE_SCAN_PRODUCT,
    "metadata[scan_target]": target,
    success_url: `${siteOrigin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}#scanner`,
    cancel_url: `${siteOrigin}/?checkout=cancelled#scanner`
  });
  const session = await stripeRequest("/checkout/sessions", { secret, fetchImpl, method: "POST", body: form });
  assertCheckoutSessionId(session.id);
  const checkoutUrl = new URL(session.url);
  if (checkoutUrl.protocol !== "https:" || !(checkoutUrl.hostname === "checkout.stripe.com" || checkoutUrl.hostname.endsWith(".stripe.com"))) {
    throw new Error("Stripe hat keine gültige Checkout-URL geliefert.");
  }
  return { id: session.id, url: checkoutUrl.toString() };
}

export async function retrieveScanCheckout({ sessionId, secret, fetchImpl = fetch }) {
  const id = assertCheckoutSessionId(sessionId);
  return stripeRequest(`/checkout/sessions/${encodeURIComponent(id)}`, { secret, fetchImpl });
}

export function verifiedScanCheckout(session, expectedTarget) {
  const target = assertCheckoutTarget(expectedTarget);
  if (!session || session.mode !== "payment" || session.status !== "complete" || session.payment_status !== "paid") return false;
  if (session.amount_total !== STRIPE_SCAN_AMOUNT || session.currency !== STRIPE_SCAN_CURRENCY) return false;
  return session.metadata?.product === STRIPE_SCAN_PRODUCT && session.metadata?.scan_target === target;
}

export async function verifyScanCheckout({ sessionId, targetUrl, secret, fetchImpl = fetch }) {
  const session = await retrieveScanCheckout({ sessionId, secret, fetchImpl });
  if (!verifiedScanCheckout(session, targetUrl)) throw new Error("Für diese URL wurde keine gültige Zahlung bestätigt.");
  return { sessionId: session.id, targetUrl: session.metadata.scan_target };
}
