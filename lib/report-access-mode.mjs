export const REPORT_ACCESS_MODE = Object.freeze({
  FREE_TEST: "free-test",
  COMMERCIAL: "commercial"
});

export function resolveReportAccessMode(value) {
  return value === REPORT_ACCESS_MODE.FREE_TEST
    ? REPORT_ACCESS_MODE.FREE_TEST
    : REPORT_ACCESS_MODE.COMMERCIAL;
}

export function publicReportAccess(mode) {
  return mode === REPORT_ACCESS_MODE.FREE_TEST
    ? { status: "testing", previewOnly: false, entitlementRequired: false }
    : { status: "locked", previewOnly: true, entitlementRequired: true };
}
