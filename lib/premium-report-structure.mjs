export const PREMIUM_REPORT_SECTION_IDS = [
  "executive-summary",
  "score-drivers",
  "priority-findings",
  "security-review",
  "improvement-plan",
  "technical-appendix"
];

const labels = {
  en: ["Executive summary", "Score drivers", "Priority findings", "Security review", "Improvement plan", "Technical appendix"],
  de: ["Management Summary", "Score-Treiber", "Priorisierte Findings", "Sicherheitsprüfung", "Verbesserungsplan", "Technischer Anhang"]
};

export function premiumReportSections(locale = "en") {
  const selected = labels[locale === "de" ? "de" : "en"];
  return PREMIUM_REPORT_SECTION_IDS.map((id, index) => ({
    id,
    number: String(index + 1).padStart(2, "0"),
    label: selected[index]
  }));
}
