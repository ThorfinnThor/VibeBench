import assert from "node:assert/strict";
import test from "node:test";
import { adminReportFilename, buildAdminReportMarkdown } from "../lib/admin-report-export.mjs";

const report = {
  target: "https://example.com/",
  generatedAt: "2026-08-20T08:00:00Z",
  security: { score: 50, checks: [{ id: "csp", title: "Content Security Policy", status: "fail", detail: "Missing.", action: "Add it." }] },
  recommendations: [{ id: "VF-SEC-CSP", title: "CSP", category: "security", priority: "high", why: "Missing.", action: "Add it." }],
  fixPacks: { en: [{ id: "VF-SEC-CSP", taxonomy: "quality-finding", title: "Content Security Policy", category: "security", priority: "high", prompt: "Fix CSP safely." }], de: [{ id: "VF-SEC-CSP", taxonomy: "quality-finding", title: "Content Security Policy", category: "security", priority: "high", prompt: "CSP sicher ergänzen." }] },
  scoreDrivers: { raises: [{ label: "Buttons", description: "Above baseline.", contribution: 0.4 }], lowers: [] },
  launchCheck: { counts: { pass: 1 }, checks: [{ label: "Title", status: "pass", detail: "Present." }] },
  evidence: { directEvidence: [], stackSignals: [], contextEvidence: [], assetScan: { fetched: 1, selected: 1 }, pageMetrics: {}, extendedMetrics: {}, scanMetrics: {} }
};

test("full admin report export follows the seven-section customer order", () => {
  const markdown = buildAdminReportMarkdown({ report, footprintScore: 42, footprintBand: "Light", evidenceLabel: "Standard", locale: "en" });
  const headings = [...markdown.matchAll(/^## (\d{2}) · (.+)$/gm)].map((match) => match[1]);
  assert.deepEqual(headings, ["01", "02", "03", "04", "05", "06", "07"]);
  assert.ok(markdown.indexOf("05 · Score drivers") > markdown.indexOf("04 · Improvement plan"));
  assert.ok(markdown.indexOf("06 · Public launch check") > markdown.indexOf("05 · Score drivers"));
  assert.match(markdown, /### Security — Content Security Policy/);
  assert.match(markdown, /Technical reference\*\*: VF-SEC-CSP/);
  assert.match(markdown, /Fix CSP safely/);
  assert.equal(adminReportFilename(report.target, "en"), "vibefootprint-full-report-example.com-en.md");
});

test("high-footprint export includes a separate optional distinctiveness review", () => {
  const markdown = buildAdminReportMarkdown({ report, footprintScore: 91, footprintBand: "Very high Vibe-Footprint", evidenceLabel: "Standard", locale: "en" });
  assert.match(markdown, /Optional distinctiveness review \(not a defect fix\)/);
  assert.match(markdown, /must not be used to conceal evidence/);
  assert.deepEqual([...markdown.matchAll(/^## (\d{2}) · (.+)$/gm)].map((match) => match[1]), ["01", "02", "03", "04", "05", "06", "07"]);
});
