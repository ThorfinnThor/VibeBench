const copyByLocale = {
  en: {
    title: "VibeFootprint — Combined implementation prompt",
    target: "Target",
    generatedAt: "Scan timestamp",
    objective: "Objective",
    objectiveText: "Implement every evidence-backed fix below as one coherent remediation pass. Address shared root causes before making duplicate edits, preserve working behavior, and do not weaken security or accessibility to satisfy an individual check.",
    priority: "Priority",
    technicalReference: "Technical reference",
    execution: "Execution and handoff",
    executionItems: [
      "Inspect the relevant repository files and existing conventions before editing.",
      "Plan shared changes once, then implement the fixes in the order shown below.",
      "Keep each change focused on the stated evidence, requirements and acceptance criteria.",
      "Run the relevant tests, lint, type checks, production build and browser checks after each coherent batch.",
      "Report which findings were resolved, the files changed, validation performed, remaining risks and any manual checks still required."
    ],
    categories: { security: "Security", design: "Design", engineering: "Engineering", accessibility: "Accessibility", content: "Content" }
  },
  de: {
    title: "VibeFootprint — Gemeinsamer Umsetzungs-Prompt",
    target: "Ziel",
    generatedAt: "Scan-Zeitpunkt",
    objective: "Aufgabe",
    objectiveText: "Setze alle unten aufgeführten evidenzbasierten Fixes als einen zusammenhängenden Behebungsdurchlauf um. Löse gemeinsame Ursachen vor doppelten Änderungen, erhalte funktionierendes Verhalten und schwäche weder Sicherheit noch Barrierefreiheit, um eine einzelne Prüfung zu erfüllen.",
    priority: "Priorität",
    technicalReference: "Technische Referenz",
    execution: "Umsetzung und Übergabe",
    executionItems: [
      "Prüfe vor Änderungen die relevanten Repository-Dateien und bestehenden Konventionen.",
      "Plane gemeinsame Änderungen einmal und setze die Fixes anschließend in der unten gezeigten Reihenfolge um.",
      "Richte jede Änderung gezielt an Evidenz, Anforderungen und Akzeptanzkriterien aus.",
      "Führe nach jedem zusammenhängenden Paket die relevanten Tests, Lint-, Typ-, Produktions-Build- und Browser-Prüfungen aus.",
      "Dokumentiere behobene Findings, geänderte Dateien, Validierung, verbleibende Risiken und weiterhin nötige manuelle Prüfungen."
    ],
    categories: { security: "Sicherheit", design: "Design", engineering: "Engineering", accessibility: "Barrierefreiheit", content: "Inhalt" }
  }
};

export function buildCombinedFixPrompt({ items, target, generatedAt, locale = "en" }) {
  if (!Array.isArray(items) || items.length === 0) return "";

  const copy = copyByLocale[locale] || copyByLocale.en;
  const sections = items.map((item, index) => {
    const category = copy.categories[item.category] || item.category;
    return [
      `## ${index + 1}. ${category} · ${item.title}`,
      `- ${copy.technicalReference}: ${item.id}`,
      `- ${copy.priority}: ${item.priority}`,
      "",
      item.prompt.trim()
    ].join("\n");
  });

  return [
    `# ${copy.title}`,
    "",
    `- ${copy.target}: ${target}`,
    `- ${copy.generatedAt}: ${generatedAt}`,
    "",
    `## ${copy.objective}`,
    copy.objectiveText,
    "",
    ...sections.flatMap((section) => [section, ""]),
    `## ${copy.execution}`,
    ...copy.executionItems.map((item) => `- ${item}`)
  ].join("\n").trim();
}
