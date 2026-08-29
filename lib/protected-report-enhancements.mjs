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
    investigation: "Investigation before editing", implementation: "Implementation requirements", handoff: "Required handoff",
    taskText: "Act as the responsible senior engineer for this finding. Trace the observed public symptom to the repository implementation, explain the likely root cause, and implement the smallest production-quality change that resolves it without broad unrelated refactoring.",
    constraintsText: "Do not optimize for the VibeFootprint score, conceal evidence, weaken security, invent inaccessible context, or replace working behavior with a visual-only workaround.",
    acceptanceText: "The observed finding is addressed at its source; the change is reviewable and localized; normal, loading, empty and error states remain functional; responsive and accessibility behavior is preserved; and focused regression coverage demonstrates the intended outcome.",
    validationText: "Discover and run the repository's relevant test, lint, typecheck and production-build commands. Add a focused automated test where practical. Verify the affected flow in a browser at desktop and narrow widths, inspect console errors, and record before/after evidence plus any unverified limitation.",
    rescanText: "After deployment, run a new public-surface scan and describe the result as changed from the previous scan, not as proof of causality or authorship."
  },
  de: {
    title: "Coding-Agent-Aufgabe zur Behebung", target: "Ziel", analyzed: "Scan-Zeitpunkt", finding: "Finding-ID", category: "Kategorie", priority: "Priorität", breadth: "Auswertungsbreite", observed: "Beobachtetes öffentliches Finding", why: "Warum es relevant ist", direction: "Empfohlene Richtung", context: "Öffentlicher technischer Kontext", task: "Aufgabe", constraints: "Leitplanken", acceptance: "Akzeptanzkriterien", validation: "Validierung", rescan: "Hinweis zum erneuten Scan",
    investigation: "Untersuchung vor der Änderung", implementation: "Umsetzungsanforderungen", handoff: "Erforderliche Übergabe",
    taskText: "Handle als verantwortlicher Senior Engineer für dieses Finding. Verfolge das öffentlich beobachtete Symptom bis zur Implementierung im Repository, erkläre die wahrscheinliche Ursache und setze die kleinste produktionsreife Behebung ohne breite sachfremde Refactorings um.",
    constraintsText: "Nicht auf den VibeFootprint-Score optimieren, keine Evidenz verbergen, Security nicht schwächen, keinen unzugänglichen Kontext erfinden und funktionierendes Verhalten nicht durch einen rein visuellen Workaround ersetzen.",
    acceptanceText: "Das beobachtete Finding ist an seiner Ursache behoben; die Änderung ist prüfbar und begrenzt; Normal-, Lade-, Leer- und Fehlerzustände funktionieren weiter; Responsive- und Accessibility-Verhalten bleiben erhalten; und fokussierte Regressionstests belegen das Ergebnis.",
    validationText: "Relevante Test-, Lint-, Typcheck- und Produktions-Build-Befehle des Repositorys ermitteln und ausführen. Wenn sinnvoll einen fokussierten automatisierten Test ergänzen. Den betroffenen Flow im Browser auf Desktop und schmalen Viewports prüfen, Konsolenfehler kontrollieren und Vorher-/Nachher-Evidenz sowie verbleibende Grenzen dokumentieren.",
    rescanText: "Nach dem Deployment einen neuen Public-Surface-Scan ausführen und das Ergebnis als Veränderung zum vorherigen Scan beschreiben, nicht als Beweis für Kausalität oder Autorenschaft."
  }
};

const categoryRequirements = {
  en: {
    security: "Map the affected trust boundary and deployment layer, introduce the protection in the correct server or platform configuration, use a report-only or staged rollout when enforcement could block legitimate traffic, and document rollback conditions.",
    design: "Locate the shared tokens and reusable components behind the affected screen, preserve interaction conventions, define the visual decision as a reusable rule rather than a one-off override, and verify hierarchy, contrast, focus and responsive behavior.",
    engineering: "Measure the relevant baseline before editing, address the source rather than masking the symptom, preserve caching and error behavior, and report a comparable after-measurement with any trade-off.",
    accessibility: "Verify semantic structure, accessible names, keyboard order, visible focus, contrast and screen-reader output for the affected flow; do not infer success from ARIA attributes alone.",
    content: "Preserve factual accuracy and product terminology, align headings and metadata with the visible page purpose, avoid duplicate or placeholder copy, and verify truncation and hierarchy across breakpoints."
  },
  de: {
    security: "Betroffene Vertrauensgrenze und Deployment-Schicht bestimmen, den Schutz in der richtigen Server- oder Plattformkonfiguration umsetzen, bei potenziell blockierender Durchsetzung stufenweise beziehungsweise im Report-Only-Modus ausrollen und Rollback-Bedingungen dokumentieren.",
    design: "Gemeinsame Tokens und wiederverwendbare Komponenten des betroffenen Screens finden, Interaktionskonventionen erhalten, die visuelle Entscheidung als wiederverwendbare Regel statt als Einmal-Override definieren und Hierarchie, Kontrast, Fokus sowie Responsive-Verhalten prüfen.",
    engineering: "Vor der Änderung eine relevante Baseline messen, die Ursache statt nur das Symptom beheben, Caching- und Fehlerverhalten erhalten und eine vergleichbare Nachmessung mit Trade-offs dokumentieren.",
    accessibility: "Semantik, zugängliche Namen, Tastaturreihenfolge, sichtbaren Fokus, Kontrast und Screenreader-Ausgabe des betroffenen Flows prüfen; Erfolg nicht allein aus ARIA-Attributen ableiten.",
    content: "Faktische Richtigkeit und Produktbegriffe erhalten, Überschriften und Metadaten am sichtbaren Seitenzweck ausrichten, doppelte oder Platzhalter-Texte vermeiden und Abschneiden sowie Hierarchie über Breakpoints prüfen."
  }
};

export function buildCodingAgentPrompt({ finding, target, analyzedAt, evidenceBreadth = "standard", publicContext = "Public HTML, response headers and bounded same-origin assets", locale = "en" }) {
  const language = locale === "de" ? "de" : "en";
  const labels = promptLabels[language];
  const classification = classifyProtectedFinding(finding);
  if (!classification.actionable) return null;
  const categoryRequirement = categoryRequirements[language][finding.category] || categoryRequirements[language].engineering;
  const investigationSteps = language === "de"
    ? [
      "Relevante Route, Komponente, Konfiguration und Tests für das Finding lokalisieren.",
      "Das öffentlich beobachtete Verhalten in der lokalen oder Preview-Umgebung reproduzieren und Baseline-Evidenz festhalten.",
      "Ursache und betroffene Vertrauens-, Daten- oder UI-Grenze benennen; Annahmen ausdrücklich markieren.",
      "Vor dem Editieren einen kleinen Änderungs- und Validierungsplan formulieren."
    ]
    : [
      "Locate the route, component, configuration and tests that own this finding.",
      "Reproduce the observed public behavior locally or in preview and capture baseline evidence.",
      "Name the root cause and affected trust, data or UI boundary; mark assumptions explicitly.",
      "State a small implementation and validation plan before editing."
    ];
  const handoffItems = language === "de"
    ? ["Ursache und geänderte Dateien", "Umgesetzte Lösung und bewusste Nicht-Ziele", "Ausgeführte Prüfungen mit Ergebnissen", "Risiken, Rollback und verbleibende manuelle Checks"]
    : ["Root cause and changed files", "Implemented solution and explicit non-goals", "Checks run with their results", "Risks, rollback and remaining manual checks"];
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
    `## ${labels.investigation}`,
    ...investigationSteps.map((step, index) => `${index + 1}. ${step}`),
    "",
    `## ${labels.implementation}`,
    `- ${categoryRequirement}`,
    `- ${language === "de" ? "Finding-spezifisches Ziel" : "Finding-specific outcome"}: ${safe(finding.action)}`,
    `- ${language === "de" ? "Bestehende öffentliche URLs, Kernflows und Datenverträge außerhalb des Findings unverändert lassen." : "Keep existing public URLs, core flows and data contracts outside the finding unchanged."}`,
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
    `## ${labels.handoff}`,
    ...handoffItems.map((item) => `- ${item}`),
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

const reviewLabels = {
  en: {
    title: "Optional distinctiveness review",
    target: "Target",
    analyzed: "Scan timestamp",
    score: "Vibe-Footprint",
    context: "What the score means",
    contextText: "This is a public-pattern similarity index, not a defect count, generated-code percentage or authorship verdict.",
    purpose: "When this review is useful",
    purposeText: "Use this brief when the product team wants to know whether important screens express a recognizable brand and clear user priorities beyond common starter conventions. It produces a review plan and evidence-backed proposals; it is not an automatic defect fix.",
    influences: "Strongest observed upward model influences",
    influenceNote: "Treat these model influences as investigation clues, not as instructions to remove a technology or manipulate the score.",
    task: "Review method",
    taskText: "Review three representative screens and the reusable components and design tokens behind them. Compare each screen's typography, spacing, component anatomy, information hierarchy, content voice and visual direction with the product's actual brand promise and primary user task.",
    deliverables: "Required deliverables",
    constraints: "Constraints",
    constraintsText: "Do not hide public evidence, weaken security, make arbitrary cosmetic changes, or optimize solely for the VibeFootprint score. Keep a change only when it has a clear brand, usability, accessibility or maintainability benefit.",
    acceptance: "Acceptance criteria",
    acceptanceText: "Each proposal names the affected screen and owning component or token, cites a visible observation, explains the user and brand benefit, states effort and risk, preserves working behavior, and includes focused responsive, accessibility and regression checks.",
    validation: "Validation plan",
    validationText: "Validate approved changes on the same three screens at desktop and narrow widths. Compare before/after screenshots, keyboard and focus behavior, contrast, content hierarchy and key conversion flows. Keep only changes with an observable product benefit."
  },
  de: {
    title: "Optionale Prüfung der visuellen Eigenständigkeit",
    target: "Ziel",
    analyzed: "Scan-Zeitpunkt",
    score: "Vibe-Footprint",
    context: "Was der Score bedeutet",
    contextText: "Dies ist ein Ähnlichkeitsindex für öffentliche Website-Muster, keine Fehleranzahl, kein Anteil generierten Codes und kein Urteil über Autorenschaft.",
    purpose: "Wann diese Prüfung nützlich ist",
    purposeText: "Nutze diesen Auftrag, wenn das Produktteam prüfen möchte, ob wichtige Screens über verbreitete Starter-Konventionen hinaus eine erkennbare Marke und klare Nutzerprioritäten ausdrücken. Das Ergebnis sind ein Prüfplan und evidenzbasierte Vorschläge, kein automatischer Fehler-Fix.",
    influences: "Stärkste beobachtete Modelltreiber nach oben",
    influenceNote: "Behandle diese Modelltreiber als Hinweise für die Untersuchung, nicht als Aufforderung, eine Technologie zu entfernen oder den Score zu manipulieren.",
    task: "Prüfmethode",
    taskText: "Prüfe drei repräsentative Screens sowie die dahinterliegenden wiederverwendbaren Komponenten und Design-Tokens. Vergleiche Typografie, Spacing, Komponenten-Anatomie, Informationshierarchie, Textstimme und visuelle Leitidee jedes Screens mit dem tatsächlichen Markenversprechen und der wichtigsten Nutzeraufgabe.",
    deliverables: "Erforderliche Ergebnisse",
    constraints: "Leitplanken",
    constraintsText: "Keine öffentliche Evidenz verbergen, Security nicht schwächen, keine willkürlichen kosmetischen Änderungen vornehmen und nicht ausschließlich auf den VibeFootprint-Score optimieren. Eine Änderung nur übernehmen, wenn sie einen klaren Brand-, Usability-, Accessibility- oder Wartbarkeitsnutzen hat.",
    acceptance: "Akzeptanzkriterien",
    acceptanceText: "Jeder Vorschlag nennt den betroffenen Screen und die zuständige Komponente oder das Token, zitiert eine sichtbare Beobachtung, erklärt Nutzer- und Markennutzen, nennt Aufwand und Risiko, erhält funktionierendes Verhalten und enthält fokussierte Responsive-, Accessibility- und Regressionstests.",
    validation: "Validierungsplan",
    validationText: "Freigegebene Änderungen auf denselben drei Screens bei Desktop- und schmaler Breite prüfen. Vorher-/Nachher-Screenshots, Tastatur- und Fokusverhalten, Kontrast, Inhaltshierarchie und wichtige Conversion-Flows vergleichen. Nur Änderungen mit beobachtbarem Produktnutzen behalten."
  }
};

/**
 * @param {{ score: number, scoreBand: string, scoreDrivers?: { raises?: Array<{ label?: unknown, description?: unknown }> }, target: string, analyzedAt: string, locale?: string }} input
 */
export function buildDistinctivenessReviewPrompt({ score, scoreBand, scoreDrivers = {}, target, analyzedAt, locale = "en" }) {
  if (!Number.isFinite(score) || score < 70) return null;
  const labels = reviewLabels[locale === "de" ? "de" : "en"];
  const influences = (scoreDrivers.raises || []).slice(0, 5).map((driver) => `- ${safe(driver.label)} — ${safe(driver.description)}`);
  return [
    `# ${labels.title}`,
    "",
    `- **${labels.target}:** ${safe(target)}`,
    `- **${labels.analyzed}:** ${safe(analyzedAt)}`,
    `- **${labels.score}:** ${score}/100 — ${safe(scoreBand)}`,
    "",
    `## ${labels.context}`,
    labels.contextText,
    "",
    `## ${labels.purpose}`,
    labels.purposeText,
    "",
    `## ${labels.influences}`,
    ...(influences.length ? influences : [locale === "de" ? "- Im Report wurde kein einzelner Treiber oberhalb der Anzeigeschwelle ausgewiesen." : "- No individual driver met the report display threshold."]),
    "",
    labels.influenceNote,
    "",
    `## ${labels.task}`,
    labels.taskText,
    "",
    `## ${labels.deliverables}`,
    ...(locale === "de" ? [
      "1. **Screen-Inventar:** Drei ausgewählte Screens, ihre primäre Nutzeraufgabe und die verantwortlichen Komponenten oder Tokens.",
      "2. **Beobachtungstabelle:** Sichtbare Evidenz, Auswirkung auf Hierarchie oder Marke und Konfidenz pro Beobachtung.",
      "3. **Priorisierte Vorschläge:** Höchstens fünf zusammenhängende Änderungen mit Nutzen, Aufwand, Risiko und bewusstem Nicht-Ziel.",
      "4. **Umsetzungs-Slices:** Kleine, reviewbare Änderungen in sinnvoller Reihenfolge statt eines pauschalen Redesigns.",
      "5. **Prüfmatrix:** Responsive-, Accessibility-, visuelle und funktionale Checks für jeden angenommenen Vorschlag."
    ] : [
      "1. **Screen inventory:** Three selected screens, their primary user task, and the owning components or tokens.",
      "2. **Observation table:** Visible evidence, hierarchy or brand impact, and confidence for each observation.",
      "3. **Prioritized proposals:** No more than five coherent changes with benefit, effort, risk and an explicit non-goal.",
      "4. **Implementation slices:** Small reviewable changes in a sensible order rather than a broad redesign.",
      "5. **Verification matrix:** Responsive, accessibility, visual and functional checks for every accepted proposal."
    ]),
    "",
    `## ${labels.constraints}`,
    labels.constraintsText,
    "",
    `## ${labels.acceptance}`,
    labels.acceptanceText,
    "",
    `## ${labels.validation}`,
    labels.validationText
  ].join("\n");
}
