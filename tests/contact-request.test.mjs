import assert from "node:assert/strict";
import test from "node:test";
import { createContactMailto } from "../lib/contact-request.mjs";

test("customer intake prepares a complete encoded B2B email without a server request", () => {
  const mailto = createContactMailto({
    nameCompany: "  Example Person · Example Agency  ",
    websiteUrl: " https://example.com ",
    reviewContext: "Client handoff",
    websiteCount: "2–5",
    targetDate: "Before launch",
    decision: "Confirm whether the public website is ready for handoff."
  });

  const parsed = new URL(mailto);
  const body = parsed.searchParams.get("body") ?? "";

  assert.equal(parsed.protocol, "mailto:");
  assert.equal(parsed.pathname, "info@vibefootprint.com");
  assert.equal(parsed.searchParams.get("subject"), "VibeFootprint customer beta — https://example.com");
  for (const expected of [
    "Example Person · Example Agency",
    "Website URL: https://example.com",
    "Review context: Client handoff",
    "Number of websites: 2–5",
    "Target date: Before launch",
    "Confirm whether the public website is ready for handoff.",
    "business or self-employed capacity",
    "authorized to have the public URL reviewed"
  ]) assert.match(body, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("customer intake clearly marks an omitted target date", () => {
  const mailto = createContactMailto({ nameCompany: "Example", websiteUrl: "https://example.com", reviewContext: "Launch", websiteCount: "1", decision: "Decide." });
  assert.match(new URL(mailto).searchParams.get("body") ?? "", /Target date: Not fixed yet/);
});
