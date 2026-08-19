import assert from "node:assert/strict";
import test from "node:test";
import { PREMIUM_REPORT_SECTION_IDS, premiumReportSections } from "../lib/premium-report-structure.mjs";

test("premium preview and future paid report share one fixed six-section structure", () => {
  assert.deepEqual(PREMIUM_REPORT_SECTION_IDS, [
    "executive-summary",
    "score-drivers",
    "priority-findings",
    "security-review",
    "improvement-plan",
    "technical-appendix"
  ]);
  assert.deepEqual(premiumReportSections("en").map((section) => section.number), ["01", "02", "03", "04", "05", "06"]);
  assert.equal(premiumReportSections("de")[0].label, "Management Summary");
  assert.equal(premiumReportSections("de")[5].label, "Technischer Anhang");
});
