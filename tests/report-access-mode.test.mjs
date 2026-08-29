import assert from "node:assert/strict";
import test from "node:test";
import {
  paidReportAccess,
  promoReportAccess,
  publicReportAccess,
  REPORT_ACCESS_MODE,
  resolveReportAccessMode
} from "../lib/report-access-mode.mjs";

test("commercial access is the safe default while internal test access stays explicit", () => {
  assert.equal(resolveReportAccessMode(undefined), REPORT_ACCESS_MODE.COMMERCIAL);
  assert.equal(resolveReportAccessMode("free-test"), REPORT_ACCESS_MODE.FREE_TEST);
  assert.equal(resolveReportAccessMode("commercial"), REPORT_ACCESS_MODE.COMMERCIAL);
  assert.deepEqual(publicReportAccess(REPORT_ACCESS_MODE.FREE_TEST), {
    status: "testing",
    previewOnly: false,
    entitlementRequired: false
  });
  assert.deepEqual(publicReportAccess(REPORT_ACCESS_MODE.COMMERCIAL), {
    status: "locked",
    previewOnly: true,
    entitlementRequired: true
  });
  assert.deepEqual(paidReportAccess(), {
    status: "paid",
    previewOnly: false,
    entitlementRequired: false
  });
  assert.deepEqual(promoReportAccess(), {
    status: "promo",
    previewOnly: false,
    entitlementRequired: false
  });
});
