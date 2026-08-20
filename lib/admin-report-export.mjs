import { premiumReportSections } from "./premium-report-structure.mjs";
import { buildDistinctivenessReviewPrompt } from "./protected-report-enhancements.mjs";

function section(number, title) {
  return `## ${number} · ${title}`;
}

function statusLabel(status, locale) {
  const labels = locale === "de"
    ? { pass: "Wirksam", warn: "Prüfen", fail: "Fehlt oder unwirksam", review: "Prüfen", attention: "Handlungsbedarf" }
    : { pass: "Effective", warn: "Review", fail: "Missing or ineffective", review: "Review", attention: "Needs attention" };
  return labels[status] || status;
}

export function buildAdminReportMarkdown({ report, footprintScore, footprintBand, evidenceLabel, locale = "en" }) {
  const de = locale === "de";
  const sections = premiumReportSections(locale);
  const lines = [
    "# VibeFootprint — Full diagnostic report",
    "",
    `- **${de ? "Ziel" : "Target"}: ${report.target}`,
    `- **${de ? "Erstellt" : "Generated"}: ${report.generatedAt}`,
    `- **Vibe-Footprint**: ${footprintScore}/100 — ${footprintBand}`,
    `- **Security baseline**: ${report.security.score}/100`,
    `- **${de ? "Auswertungsbreite" : "Evidence breadth"}**: ${evidenceLabel}`,
    "",
    section(sections[0].number, sections[0].label),
    "",
    de
      ? "Der Vibe-Footprint und die Security-Baseline sind unabhängige Bewertungen. Der Report belegt weder Codeherkunft, Anteil generierten Codes, Autorenschaft noch Kausalität."
      : "The Vibe-Footprint and security baseline are independent assessments. This report does not establish code origin, generated-code share, authorship or causality.",
    "",
    section(sections[1].number, sections[1].label),
    ""
  ];

  for (const finding of report.recommendations) {
    lines.push(`### ${finding.id} — ${finding.title}`, "", `- **${de ? "Priorität" : "Priority"}**: ${finding.priority}`, `- **${de ? "Kategorie" : "Category"}**: ${finding.category}`, `- **${de ? "Warum es relevant ist" : "Why it matters"}**: ${finding.why}`, `- **${de ? "Empfohlene Maßnahme" : "Recommended action"}**: ${finding.action}`, "");
  }

  lines.push(section(sections[2].number, sections[2].label), "");
  for (const check of report.security.checks) {
    lines.push(`### ${check.title} — ${statusLabel(check.status, locale)}`, "", check.detail, "", `**${de ? "Maßnahme" : "Action"}:** ${check.action}`, "");
  }

  lines.push(section(sections[3].number, sections[3].label), "");
  for (const item of report.fixPacks[locale === "de" ? "de" : "en"]) {
    lines.push(`### ${item.id}`, "", "```text", item.prompt, "```", "");
  }
  const reviewPrompt = buildDistinctivenessReviewPrompt({ score: footprintScore, scoreBand: footprintBand, scoreDrivers: report.scoreDrivers, target: report.target, analyzedAt: report.generatedAt, locale });
  if (reviewPrompt) {
    lines.push(`### ${de ? "Optionale Eigenständigkeitsprüfung (kein Fehler-Fix)" : "Optional distinctiveness review (not a defect fix)"}`, "", de ? "Dieser zusätzliche Prompt wird wegen der hohen Musterähnlichkeit angeboten. Er ersetzt kein beobachtetes Finding und soll nicht zum Verbergen von Evidenz verwendet werden." : "This additional prompt is offered because pattern similarity is high. It is not an observed defect and must not be used to conceal evidence.", "", "```text", reviewPrompt, "```", "");
  }

  lines.push(section(sections[4].number, sections[4].label), "", `### ↑ ${de ? "Erhöht den Score" : "Raises the score"}`, "");
  for (const driver of report.scoreDrivers.raises) lines.push(`- **${driver.label}** — ${driver.description} (${Math.abs(driver.contribution).toFixed(2)})`);
  lines.push("", `### ↓ ${de ? "Senkt den Score" : "Lowers the score"}`, "");
  for (const driver of report.scoreDrivers.lowers) lines.push(`- **${driver.label}** — ${driver.description} (${Math.abs(driver.contribution).toFixed(2)})`);

  lines.push("", section(sections[5].number, sections[5].label), "");
  for (const check of report.launchCheck.checks) lines.push(`- **${check.label}** — ${statusLabel(check.status, locale)}: ${check.detail}`);

  lines.push("", section(sections[6].number, sections[6].label), "", `- **${de ? "Direkte Marker" : "Direct markers"}**: ${report.evidence.directEvidence.length}`, `- **${de ? "Stack- und Kontextsignale" : "Stack and context signals"}**: ${report.evidence.stackSignals.length + report.evidence.contextEvidence.length}`, `- **${de ? "Assets geladen" : "Assets loaded"}**: ${report.evidence.assetScan.fetched}/${report.evidence.assetScan.selected}`, `- **${de ? "Launch-Prüfungen bestanden" : "Launch checks passed"}**: ${report.launchCheck.counts.pass}/${report.launchCheck.checks.length}`, "", "```json", JSON.stringify({ pageMetrics: report.evidence.pageMetrics, extendedMetrics: report.evidence.extendedMetrics, scanMetrics: report.evidence.scanMetrics }, null, 2), "```", "");
  return lines.join("\n");
}

export function adminReportFilename(target, locale = "en") {
  let host = "website";
  try { host = new URL(target).hostname; } catch { /* Keep the safe fallback filename. */ }
  return `vibefootprint-full-report-${host}-${locale}.md`;
}
