import assert from "node:assert/strict";
import test from "node:test";
import {
  createScanCheckout,
  STRIPE_SCAN_AMOUNT,
  STRIPE_SCAN_CURRENCY,
  STRIPE_SCAN_PRODUCT,
  verifiedScanCheckout,
  verifyScanCheckout
} from "../lib/stripe-scan-payment.mjs";

const targetUrl = "https://example.com/launch";
const paidSession = (overrides = {}) => ({
  id: "cs_test_abc123",
  mode: "payment",
  status: "complete",
  payment_status: "paid",
  amount_total: STRIPE_SCAN_AMOUNT,
  currency: STRIPE_SCAN_CURRENCY,
  metadata: { product: STRIPE_SCAN_PRODUCT, scan_target: targetUrl },
  ...overrides
});

test("checkout creates exactly one 4.99 EUR website scan on Stripe", async () => {
  let request;
  const checkout = await createScanCheckout({
    targetUrl,
    origin: "https://www.vibefootprint.com",
    secret: "sk_test_example_secret",
    priceId: "price_123launch",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return Response.json({ id: "cs_test_abc123", url: "https://checkout.stripe.com/c/pay/cs_test_abc123" });
    }
  });
  assert.equal(checkout.url, "https://checkout.stripe.com/c/pay/cs_test_abc123");
  assert.equal(request.options.headers.authorization, "Bearer sk_test_example_secret");
  const form = new URLSearchParams(request.options.body);
  assert.equal(form.get("mode"), "payment");
  assert.equal(form.has("payment_method_types[0]"), false);
  assert.equal(form.get("line_items[0][price]"), "price_123launch");
  assert.equal(form.get("line_items[0][quantity]"), "1");
  assert.equal(form.get("metadata[scan_target]"), targetUrl);
  assert.equal(form.get("success_url"), "https://www.vibefootprint.com/?checkout=success&session_id={CHECKOUT_SESSION_ID}#scanner");
});

test("paid checkout is valid only for the exact product, amount and target URL", () => {
  assert.equal(verifiedScanCheckout(paidSession(), targetUrl), true);
  assert.equal(verifiedScanCheckout(paidSession({ payment_status: "unpaid" }), targetUrl), false);
  assert.equal(verifiedScanCheckout(paidSession({ amount_total: 4999 }), targetUrl), false);
  assert.equal(verifiedScanCheckout(paidSession({ metadata: { product: "other", scan_target: targetUrl } }), targetUrl), false);
  assert.equal(verifiedScanCheckout(paidSession(), "https://example.org/"), false);
});

test("server verification retrieves the session and rejects a mismatched scan", async () => {
  const fetchImpl = async () => Response.json(paidSession());
  assert.deepEqual(await verifyScanCheckout({ sessionId: "cs_test_abc123", targetUrl, secret: "sk_test_example_secret", fetchImpl }), {
    sessionId: "cs_test_abc123",
    targetUrl
  });
  await assert.rejects(verifyScanCheckout({ sessionId: "cs_test_abc123", targetUrl: "https://example.org/", secret: "sk_test_example_secret", fetchImpl }), /keine gültige Zahlung/);
});

test("checkout fails closed without a server-only Stripe key", async () => {
  await assert.rejects(createScanCheckout({ targetUrl, origin: "https://www.vibefootprint.com", secret: "", priceId: "price_123launch", fetchImpl: async () => { throw new Error("not reached"); } }), /noch nicht konfiguriert/);
});

test("checkout fails closed without a configured Stripe price", async () => {
  await assert.rejects(createScanCheckout({ targetUrl, origin: "https://www.vibefootprint.com", secret: "sk_test_example_secret", priceId: "", fetchImpl: async () => { throw new Error("not reached"); } }), /noch nicht konfiguriert/);
});

test("checkout accepts a least-privilege restricted Stripe key", async () => {
  const checkout = await createScanCheckout({
    targetUrl,
    origin: "https://www.vibefootprint.com",
    secret: "rk_live_vibefootprint_checkout",
    priceId: "price_123launch",
    fetchImpl: async () => Response.json({ id: "cs_live_abc123", url: "https://checkout.stripe.com/c/pay/cs_live_abc123" })
  });
  assert.equal(checkout.id, "cs_live_abc123");
});
