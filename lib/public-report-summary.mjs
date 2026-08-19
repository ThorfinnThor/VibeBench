export const PUBLIC_REPORT_CATEGORY_IDS = ["security", "design", "engineering", "accessibility", "content"];

export function summarizeSecurityChecks(checks = []) {
  return checks.reduce((counts, check) => {
    if (check.status === "pass") counts.pass += 1;
    else if (check.status === "warn") counts.review += 1;
    else if (check.status === "fail") counts.missing += 1;
    return counts;
  }, { pass: 0, review: 0, missing: 0 });
}

export function buildPublicCategoryOverview({ recommendations = [], securityChecks = [] } = {}) {
  const observed = recommendations.filter((item) => item.basis === "observed");
  return PUBLIC_REPORT_CATEGORY_IDS.map((id) => {
    if (id === "security") {
      const issues = securityChecks.filter((check) => check.status !== "pass");
      return {
        id,
        issueCount: issues.length,
        status: issues.some((check) => check.status === "fail") ? "attention" : issues.length ? "review" : "no-observed-issue"
      };
    }
    const issues = observed.filter((item) => item.category === id);
    return {
      id,
      issueCount: issues.length,
      status: issues.some((item) => item.priority === "high") ? "attention" : issues.length ? "review" : "no-observed-issue"
    };
  });
}
