import assert from "node:assert/strict";
import test from "node:test";
import { classifyOptionBV5Error, OPTION_B_V5_OUTCOMES, OPTION_B_V5_RETRYABLE_OUTCOMES, retryDelayOptionBV5 } from "../lib/option-b-v5-capture.mjs";

test("v5 distinguishes retryable reachability and non-retryable access outcomes", () => {
  assert.equal(classifyOptionBV5Error(new Error("HTTP 429"), "http_navigation", 429), "http_rate_limited");
  assert.equal(classifyOptionBV5Error(new Error("HTTP 404"), "http_navigation", 404), "http_not_found");
  assert.equal(classifyOptionBV5Error(new Error("HTTP 451"), "http_navigation", 451), "http_legal_block");
  assert.equal(classifyOptionBV5Error(new Error("ERR_NAME_NOT_RESOLVED")), "dns_unresolved");
  assert.equal(OPTION_B_V5_RETRYABLE_OUTCOMES.has("http_rate_limited"), true);
  assert.equal(OPTION_B_V5_RETRYABLE_OUTCOMES.has("http_blocked_or_denied"), false);
  assert.equal(OPTION_B_V5_RETRYABLE_OUTCOMES.has("http_legal_block"), false);
  assert.equal(OPTION_B_V5_OUTCOMES.includes("navigation_context_replaced"), true);
});

test("v5 retry backoff is deterministic and capped for rate limits", () => {
  assert.equal(retryDelayOptionBV5("http_rate_limited", 0), 2000);
  assert.equal(retryDelayOptionBV5("http_rate_limited", 3), 8000);
  assert.equal(retryDelayOptionBV5("navigation_timeout", 0), 500);
  assert.equal(retryDelayOptionBV5("navigation_timeout", 1), 1250);
});
