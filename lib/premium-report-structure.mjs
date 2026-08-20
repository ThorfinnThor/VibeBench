export const PREMIUM_REPORT_SECTION_IDS = [
  "executive-summary",
  "priority-findings",
  "security-review",
  "improvement-plan",
  "score-drivers",
  "public-launch-check",
  "technical-appendix"
];

const labels = {
  en: ["Executive summary", "Priority findings", "Security review", "Improvement plan", "Score drivers", "Public launch check", "Technical appendix"],
  de: ["Management Summary", "Priorisierte Findings", "Sicherheitsprüfung", "Verbesserungsplan", "Score-Treiber", "Öffentlicher Launch-Check", "Technischer Anhang"]
};

export function premiumReportSections(locale = "en") {
  const selected = labels[locale === "de" ? "de" : "en"];
  return PREMIUM_REPORT_SECTION_IDS.map((id, index) => ({
    id,
    number: String(index + 1).padStart(2, "0"),
    label: selected[index]
  }));
}
