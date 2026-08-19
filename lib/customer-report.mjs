const reportCopy = {
  en: {
    title: "VibeFootprint customer report",
    target: "Website",
    analyzed: "Analyzed",
    footprint: "Vibe-Footprint",
    footprintMeaning: "Public-pattern similarity index (0–100)",
    security: "Public security baseline",
    securityMeaning: "Separate header review (0–100)",
    separate: "These two scores are independent. The security baseline does not raise or lower the Vibe-Footprint.",
    findings: "Priority findings",
    noFindings: "No observed priority finding was returned by the bounded scan.",
    action: "Action",
    coverage: "Evidence breadth",
    boundary: "Interpretation boundary",
    boundaryText: "The Vibe-Footprint is a qualitative similarity index. It does not estimate code origin, generated-code share or authorship. The security baseline reviews selected public response headers and is not a penetration test.",
    request: "Report reference"
  },
  de: {
    title: "VibeFootprint-Kundenreport",
    target: "Website",
    analyzed: "Analysiert",
    footprint: "Vibe-Footprint",
    footprintMeaning: "Ähnlichkeitsindex öffentlicher Muster (0–100)",
    security: "Öffentliche Sicherheits-Baseline",
    securityMeaning: "Separate Header-Prüfung (0–100)",
    separate: "Beide Scores sind unabhängig. Die Sicherheits-Baseline erhöht oder senkt den Vibe-Footprint nicht.",
    findings: "Priorisierte Findings",
    noFindings: "Der begrenzte Scan hat kein beobachtetes priorisiertes Finding ausgegeben.",
    action: "Maßnahme",
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
  return `vibefootprint-${host.replace(/[^a-z0-9.-]+/gi, "-")}-${date}-${locale}.md`;
}

export function buildCustomerReport(result, locale = "en") {
  if (!result?.ok || !result.vibeScore || !result.security) throw new Error("A complete scan result is required.");
  const copy = reportCopy[locale === "de" ? "de" : "en"];
  const observed = (result.recommendations || []).filter((item) => item.basis === "observed").slice(0, 5);
  const lines = [
    `# ${copy.title}`,
    "",
    `- **${copy.target}:** ${clean(result.resolvedUrl)}`,
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
    `## ${copy.findings}`,
    ""
  ];
  if (observed.length) {
    observed.forEach((item, index) => {
      lines.push(`${index + 1}. **${clean(item.title)}** — ${clean(item.why)}`);
      lines.push(`   - **${copy.action}:** ${clean(item.action)}`);
    });
  } else {
    lines.push(copy.noFindings);
  }
  lines.push("", `## ${copy.boundary}`, "", copy.boundaryText);
  if (result.requestId) lines.push("", `_${copy.request}: ${clean(result.requestId)}_`);
  return lines.join("\n");
}
