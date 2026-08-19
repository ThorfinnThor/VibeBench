export const SIGNAL_TAXONOMY = Object.freeze({
  genericness: "genericness",
  builderResidue: "builder-residue",
  technologyContext: "technology-context",
  structuralEvidence: "structural-evidence",
  qualityFinding: "quality-finding"
});

const priorityRank = { high: 0, medium: 1, low: 2 };

export function classifyProtectedFinding(finding) {
  if (!finding || typeof finding.id !== "string") throw new Error("A stable finding ID is required.");
  if (finding.id === "VF-CTX-BUILDER-PROVENANCE") return { taxonomy: SIGNAL_TAXONOMY.technologyContext, actionable: false };
  if (finding.id === "VF-DES-COMPONENT-SYSTEM" || finding.id === "VF-DES-GENERIC-UI") return { taxonomy: SIGNAL_TAXONOMY.genericness, actionable: true };
  if (finding.category === "security" || ["engineering", "accessibility", "content"].includes(finding.category)) return { taxonomy: SIGNAL_TAXONOMY.qualityFinding, actionable: finding.basis === "observed" };
  return { taxonomy: SIGNAL_TAXONOMY.structuralEvidence, actionable: finding.basis === "observed" };
}

function safe(value) {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim();
}

const promptLabels = {
  en: {
    title: "Coding-agent remediation task", target: "Target", analyzed: "Scan timestamp", finding: "Finding ID", category: "Category", priority: "Priority", breadth: "Evidence breadth", observed: "Observed public finding", why: "Why it matters", direction: "Recommended direction", context: "Public technical context", task: "Task", constraints: "Constraints", acceptance: "Acceptance criteria", validation: "Validation", rescan: "Rescan note",
    taskText: "Inspect the relevant implementation, make the smallest maintainable change that addresses the finding, and preserve existing behavior outside this scope.",
    constraintsText: "Do not optimize for the VibeFootprint score, conceal evidence, weaken security, invent inaccessible context, or replace working behavior with a visual-only workaround.",
    acceptanceText: "The change is reviewable, localized to the finding, covered by appropriate tests, and introduces no regression in existing user flows.",
    validationText: "Run the repository's test, lint, type/build, and focused browser checks. Record what was verified and any remaining limitation.",
    rescanText: "After deployment, run a new public-surface scan and describe the result as changed from the previous scan, not as proof of causality or authorship."
  },
  de: {
    title: "Coding-Agent-Aufgabe zur Behebung", target: "Ziel", analyzed: "Scan-Zeitpunkt", finding: "Finding-ID", category: "Kategorie", priority: "Priorität", breadth: "Auswertungsbreite", observed: "Beobachtetes öffentliches Finding", why: "Warum es relevant ist", direction: "Empfohlene Richtung", context: "Öffentlicher technischer Kontext", task: "Aufgabe", constraints: "Leitplanken", acceptance: "Akzeptanzkriterien", validation: "Validierung", rescan: "Hinweis zum erneuten Scan",
    taskText: "Prüfe die relevante Implementierung, nimm die kleinste wartbare Änderung zur Behebung des Findings vor und erhalte bestehendes Verhalten außerhalb dieses Umfangs.",
    constraintsText: "Nicht auf den VibeFootprint-Score optimieren, keine Evidenz verbergen, Security nicht schwächen, keinen unzugänglichen Kontext erfinden und funktionierendes Verhalten nicht durch einen rein visuellen Workaround ersetzen.",
    acceptanceText: "Die Änderung ist prüfbar, auf das Finding begrenzt, angemessen getestet und führt zu keiner Regression in bestehenden Nutzerflüssen.",
    validationText: "Tests, Lint, Typ-/Build-Prüfung und fokussierte Browser-Checks des Repositorys ausführen. Verifizierte Punkte und verbleibende Grenzen dokumentieren.",
    rescanText: "Nach dem Deployment einen neuen Public-Surface-Scan ausführen und das Ergebnis als Veränderung zum vorherigen Scan beschreiben, nicht als Beweis für Kausalität oder Autorenschaft."
  }
};

export function buildCodingAgentPrompt({ finding, target, analyzedAt, evidenceBreadth = "standard", publicContext = "Public HTML, response headers and bounded same-origin assets", locale = "en" }) {
  const labels = promptLabels[locale === "de" ? "de" : "en"];
  const classification = classifyProtectedFinding(finding);
  if (!classification.actionable) return null;
  return [
    `# ${labels.title}`,
    "",
    `- **${labels.target}:** ${safe(target)}`,
    `- **${labels.analyzed}:** ${safe(analyzedAt)}`,
    `- **${labels.finding}:** ${safe(finding.id)}`,
    `- **${labels.category}:** ${safe(finding.category)} / ${classification.taxonomy}`,
    `- **${labels.priority}:** ${safe(finding.priority)}`,
    `- **${labels.breadth}:** ${safe(evidenceBreadth)}`,
    "",
    `## ${labels.observed}`,
    safe(finding.title),
    "",
    `## ${labels.why}`,
    safe(finding.why),
    "",
    `## ${labels.direction}`,
    safe(finding.action),
    "",
    `## ${labels.context}`,
    safe(publicContext),
    "",
    `## ${labels.task}`,
    labels.taskText,
    "",
    `## ${labels.constraints}`,
    labels.constraintsText,
    "",
    `## ${labels.acceptance}`,
    labels.acceptanceText,
    "",
    `## ${labels.validation}`,
    labels.validationText,
    "",
    `## ${labels.rescan}`,
    labels.rescanText
  ].join("\n");
}

export function buildTopFixPack({ findings = [], target, analyzedAt, evidenceBreadth, publicContext, locale = "en" }) {
  return findings
    .map((finding) => ({ finding, classification: classifyProtectedFinding(finding) }))
    .filter(({ classification }) => classification.actionable)
    .sort((left, right) => (priorityRank[left.finding.priority] ?? 9) - (priorityRank[right.finding.priority] ?? 9) || left.finding.id.localeCompare(right.finding.id))
    .slice(0, 3)
    .map(({ finding, classification }) => ({
      id: finding.id,
      taxonomy: classification.taxonomy,
      prompt: buildCodingAgentPrompt({ finding, target, analyzedAt, evidenceBreadth, publicContext, locale })
    }));
}
