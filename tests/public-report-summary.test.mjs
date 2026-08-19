import assert from "node:assert/strict";
import test from "node:test";
import { buildPublicCategoryOverview, summarizeSecurityChecks } from "../lib/public-report-summary.mjs";

test("public category overview exposes counts and severity without detailed findings", () => {
  const overview = buildPublicCategoryOverview({
    recommendations: [
      { category: "design", priority: "high", basis: "observed", title: "private detail" },
      { category: "content", priority: "low", basis: "context", title: "benign technology context" },
      { category: "engineering", priority: "medium", basis: "guidance", title: "manual guidance" }
    ],
    securityChecks: [{ status: "pass" }, { status: "warn" }, { status: "fail" }]
  });
  assert.deepEqual(overview.find((item) => item.id === "security"), { id: "security", issueCount: 2, status: "attention" });
  assert.deepEqual(overview.find((item) => item.id === "design"), { id: "design", issueCount: 1, status: "attention" });
  assert.deepEqual(overview.find((item) => item.id === "engineering"), { id: "engineering", issueCount: 0, status: "no-observed-issue" });
  assert.deepEqual(overview.find((item) => item.id === "content"), { id: "content", issueCount: 0, status: "no-observed-issue" });
  assert.equal(JSON.stringify(overview).includes("private detail"), false);
});

test("security summary counts only public status totals", () => {
  assert.deepEqual(summarizeSecurityChecks([{ status: "pass" }, { status: "warn" }, { status: "fail" }]), { pass: 1, review: 1, missing: 1 });
});
