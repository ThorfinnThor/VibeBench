import assert from "node:assert/strict";
import test from "node:test";
import {
  publicReportAccess,
  REPORT_ACCESS_MODE,
  resolveReportAccessMode
} from "../lib/report-access-mode.mjs";

test("free testing is the explicit default while commercial mode stays opt-in", () => {
  assert.equal(resolveReportAccessMode(undefined), REPORT_ACCESS_MODE.FREE_TEST);
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
});
