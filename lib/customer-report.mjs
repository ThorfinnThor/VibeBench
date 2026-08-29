import { redactReportUrl } from "./report-url.mjs";

const reportCopy = {
  en: {
    title: "VibeFootprint scan summary",
    target: "Website",
    analyzed: "Analyzed",
    footprint: "Vibe-Footprint",
    footprintMeaning: "Public-pattern similarity index (0–100)",
    security: "Public security baseline",
    securityMeaning: "Separate header review (0–100)",
    separate: "These two scores are independent. The security baseline does not raise or lower the Vibe-Footprint.",
    categories: "Category overview",
    issues: "observed issues",
    noIssues: "No observed issue",
    fullReport: "The complete detailed report includes score drivers, findings, implementation guidance and technical evidence.",
    fullReportTesting: "The complete detailed report is included with this scan.",
    coverage: "Evidence breadth",
    boundary: "Interpretation boundary",
    boundaryText: "The Vibe-Footprint is a qualitative similarity index. It does not estimate code origin, generated-code share or authorship. The security baseline reviews selected public response headers and is not a penetration test.",
    request: "Report reference"
  },
  de: {
    title: "VibeFootprint Scan-Zusammenfassung",
    target: "Website",
    analyzed: "Analysiert",
    footprint: "Vibe-Footprint",
    footprintMeaning: "Ähnlichkeitsindex öffentlicher Muster (0–100)",
    security: "Öffentliche Sicherheits-Baseline",
    securityMeaning: "Separate Header-Prüfung (0–100)",
    separate: "Beide Scores sind unabhängig. Die Sicherheits-Baseline erhöht oder senkt den Vibe-Footprint nicht.",
    categories: "Kategorieübersicht",
    issues: "beobachtete Hinweise",
    noIssues: "Kein beobachteter Hinweis",
    fullReport: "Der vollständige Detailreport enthält Score-Treiber, Findings, Umsetzungshinweise und technische Evidenz.",
    fullReportTesting: "Der vollständige Detailreport ist in diesem Scan enthalten.",
    coverage: "Auswertungsbreite",
    boundary: "Interpretationsgrenze",
    boundaryText: "Der Vibe-Footprint ist ein qualitativer Ähnlichkeitsindex. Er misst weder Codeherkunft, Anteil generierten Codes noch Autorenschaft. Die Sicherheits-Baseline prüft ausgewählte öffentliche Response-Header und ist kein Penetrationstest.",
    request: "Report-Referenz"
  }
};

function clean(value) {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim();
}

export function customerReportFilename(result, locale = "en") {
  let host = "website";
  try { host = new URL(result.resolvedUrl).hostname; } catch { host = "website"; }
  const date = (result.analyzedAt || new Date().toISOString()).slice(0, 10);
  return `vibefootprint-summary-${host.replace(/[^a-z0-9.-]+/gi, "-")}-${date}-${locale}.md`;
}

export function buildCustomerReport(result, locale = "en") {
  if (!result?.ok || !result.vibeScore || !result.security) throw new Error("A complete scan result is required.");
  const copy = reportCopy[locale === "de" ? "de" : "en"];
  const categories = result.categoryOverview || [];
  const lines = [
    `# ${copy.title}`,
    "",
    `- **${copy.target}:** ${clean(redactReportUrl(result.resolvedUrl))}`,
    `- **${copy.analyzed}:** ${clean(result.analyzedAt)}`,
    `- **${copy.coverage}:** ${clean(result.evidenceCoverage?.label || "Standard")}`,
    "",
    `## ${copy.footprint}: ${result.vibeScore.score}/100 — ${clean(result.vibeScore.band.label)}`,
    "",
    `${copy.footprintMeaning}. ${clean(result.vibeScore.band.summary)}`,
    "",
    `## ${copy.security}: ${result.security.score}/100`,
    "",
    `${copy.securityMeaning}.`,
    "",
    `> ${copy.separate}`,
    "",
    `## ${copy.categories}`,
    ""
  ];
  if (categories.length) {
    categories.forEach((item) => lines.push(`- **${clean(item.id)}:** ${item.issueCount ? `${item.issueCount} ${copy.issues}` : copy.noIssues}`));
  } else {
    lines.push(copy.noIssues);
  }
  lines.push("", `> ${["testing", "paid"].includes(result.reportAccess?.status) ? copy.fullReportTesting : copy.fullReport}`);
  lines.push("", `## ${copy.boundary}`, "", copy.boundaryText);
  if (result.requestId) lines.push("", `_${copy.request}: ${clean(result.requestId)}_`);
  return lines.join("\n");
}
