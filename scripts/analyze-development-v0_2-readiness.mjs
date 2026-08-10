import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { developmentSamplesV02 } from "../data/development-samples-v0_2.mjs";

const sourcePath = path.resolve("outputs/vibebench_production_browser_capture_post_hardening_2026-08-09.json");
const outputDir = path.resolve("outputs/development_v0_2");
const jsonPath = path.join(outputDir, "vibebench_development_v0_2_readiness.json");
const reportPath = path.resolve("outputs/VIBEBENCH_DEVELOPMENT_V0_2_READINESS_2026-08-10.md");
const stackNames = new Set(["Next.js", "React", "Vite", "Tailwind CSS", "Framer Motion", "Radix UI", "Lucide", "Supabase", "Firebase"]);

function divide(numerator, denominator) {
  return denominator ? numerator / denominator : null;
}

function percent(value) {
  return value === null ? "n/a" : `${(value * 100).toFixed(1)} %`;
}

function summarize(rows) {
  const successful = rows.filter((row) => row.apiOk);
  const count = (verdict) => rows.filter((row) => row.verdict === verdict).length;
  return {
    total: rows.length,
    successful: successful.length,
    errors: rows.length - successful.length,
    direct: count("direct"),
    indicative: count("indicative"),
    indeterminate: count("indeterminate"),
    positive: count("direct") + count("indicative"),
    primaryPositiveRate: divide(count("direct") + count("indicative"), successful.length),
    directRate: divide(count("direct"), successful.length)
  };
}

function recognizedStacks(row) {
  return (row.contextEvidence || []).filter((label) => stackNames.has(label));
}

function diagnosticConfusion(rows, positiveVerdicts) {
  const successful = rows.filter((row) => row.apiOk);
  const positive = (row) => positiveVerdicts.has(row.verdict);
  const tp = successful.filter((row) => row.label === "AI" && positive(row)).length;
  const fn = successful.filter((row) => row.label === "AI" && !positive(row)).length;
  const fp = successful.filter((row) => row.label === "HUMAN" && positive(row)).length;
  const tn = successful.filter((row) => row.label === "HUMAN" && !positive(row)).length;
  const precision = divide(tp, tp + fp);
  const recall = divide(tp, tp + fn);
  return {
    tp, fp, tn, fn,
    accuracy: divide(tp + tn, tp + fp + tn + fn),
    precision,
    recall,
    specificity: divide(tn, tn + fp),
    f1: precision === null || recall === null || precision + recall === 0 ? null : 2 * precision * recall / (precision + recall)
  };
}

const sourceText = await readFile(sourcePath, "utf8");
const rows = JSON.parse(sourceText);
if (!Array.isArray(rows) || rows.length !== 52) throw new Error(`Expected the fixed 52-row Development capture, found ${rows?.length}.`);
const ai = rows.filter((row) => row.label === "AI");
const human = rows.filter((row) => row.label === "HUMAN");
if (ai.length !== 36 || human.length !== 16) throw new Error(`Expected 36 AI and 16 Human rows, found ${ai.length}/${human.length}.`);

const builders = Object.fromEntries([...new Set(ai.map((row) => row.builder))].map((builder) => [builder, summarize(ai.filter((row) => row.builder === builder))]));
const labels = { AI: summarize(ai), HUMAN: summarize(human) };
const stackRepresentation = Object.fromEntries([ai, human].map((group) => {
  const label = group[0].label;
  const successful = group.filter((row) => row.apiOk);
  return [label, {
    successful: successful.length,
    withAnyRecognizedStack: successful.filter((row) => recognizedStacks(row).length >= 1).length,
    withAtLeastTwoRecognizedStacks: successful.filter((row) => recognizedStacks(row).length >= 2).length,
    withAtLeastFourRecognizedStacks: successful.filter((row) => recognizedStacks(row).length >= 4).length,
    medianRecognizedStackCount: [...successful.map((row) => recognizedStacks(row).length)].sort((a, b) => a - b)[Math.floor(successful.length / 2)]
  }];
}));

const signalPrevalence = Object.fromEntries([...stackNames].map((signal) => [signal, {
  AI: ai.filter((row) => row.apiOk && recognizedStacks(row).includes(signal)).length,
  HUMAN: human.filter((row) => row.apiOk && recognizedStacks(row).includes(signal)).length
}]));
const directMarkers = {};
for (const row of ai.filter((item) => item.verdict === "direct")) {
  for (const evidence of row.directEvidenceDetails || []) {
    const key = `${evidence.label} · ${evidence.detail || "unknown"}`;
    directMarkers[key] = (directMarkers[key] || 0) + 1;
  }
}

const acquisitionProgress = {
  ready: developmentSamplesV02.filter((row) => row.status === "READY").length,
  groups: Object.fromEntries([
    "AI_REPLIT_AGENT_NEW",
    "AI_BOLT_NEW",
    "HUMAN_MODERN_SAAS_NEW",
    "HUMAN_MODERN_APP_NEW"
  ].map((group) => [group, developmentSamplesV02.filter((row) => row.group === group && row.status === "READY").length]))
};
const acquiredHumanControls = developmentSamplesV02.filter((row) => row.group.startsWith("HUMAN_") && row.status === "READY");
const acquiredHumanBaseline = {
  total: acquiredHumanControls.length,
  indicative: acquiredHumanControls.filter((row) => row.baseline_scan.level === "indicative").length,
  indeterminate: acquiredHumanControls.filter((row) => row.baseline_scan.level === "indeterminate").length,
  withAtLeastTwoRecognizedStacks: acquiredHumanControls.filter((row) => row.baseline_scan.stack_signals.length >= 2).length
};
const acquiredBoltControls = developmentSamplesV02.filter((row) => row.group === "AI_BOLT_NEW" && row.status === "READY");
const acquiredBoltBaseline = {
  total: acquiredBoltControls.length,
  direct: acquiredBoltControls.filter((row) => row.baseline_scan.level === "direct").length,
  indicative: acquiredBoltControls.filter((row) => row.baseline_scan.level === "indicative").length,
  indeterminate: acquiredBoltControls.filter((row) => row.baseline_scan.level === "indeterminate").length,
  withAtLeastTwoRecognizedStacks: acquiredBoltControls.filter((row) => row.baseline_scan.stack_signals.length >= 2).length
};

const primaryDiagnostic = diagnosticConfusion(rows, new Set(["direct", "indicative"]));
const strictDiagnostic = diagnosticConfusion(rows, new Set(["direct"]));
const readiness = {
  schemaVersion: "v0.2-readiness",
  generatedAt: "2026-08-10",
  purpose: "Development-only dataset readiness diagnosis; not a validation result and not a v0.2 rule selection.",
  source: path.relative(process.cwd(), sourcePath),
  sourceSha256: createHash("sha256").update(sourceText).digest("hex"),
  rows: rows.length,
  labels,
  builders,
  stackRepresentation,
  signalPrevalence,
  directMarkers,
  acquisitionProgress: { ...acquisitionProgress, humanBaseline: acquiredHumanBaseline, boltBaseline: acquiredBoltBaseline },
  primaryDiagnostic,
  strictDiagnostic,
  blockers: [
    "All 16 successful Human Development controls have fewer than two recognized modern stack signals; broad structural specificity is therefore not tested.",
    "Replit Agent has only two Development samples and neither exposes direct or indicative evidence.",
    "Bolt has thirteen Development samples but only one direct marker hit.",
    "The Development set is label-imbalanced (36 AI / 16 Human) and its negative class is not representative of modern SaaS/application stacks.",
    "The 100-site holdout is open and must not be recycled as Development data or used for v0.2 threshold selection."
  ],
  recommendedExtension: {
    total: 40,
    strata: {
      AI_REPLIT_AGENT_NEW: 10,
      AI_BOLT_NEW: 10,
      HUMAN_MODERN_SAAS_NEW: 10,
      HUMAN_MODERN_APP_NEW: 10
    },
    rule: "All targets and provenance must be new, absent from both the existing 52-row Development capture and the completed 100-site holdout."
  }
};

const builderRows = Object.entries(builders).map(([builder, value]) => `| ${builder} | ${value.total} | ${value.direct} | ${value.indicative} | ${value.indeterminate} | ${value.errors} | ${percent(value.directRate)} |`).join("\n");
const signalRows = Object.entries(signalPrevalence).map(([signal, counts]) => `| ${signal} | ${counts.AI} / ${labels.AI.successful} | ${counts.HUMAN} / ${labels.HUMAN.successful} |`).join("\n");
const markerRows = Object.entries(directMarkers).sort((a, b) => b[1] - a[1]).map(([marker, count]) => `| ${marker} | ${count} |`).join("\n") || "| — | 0 |";

const report = `# VibeBench Development readiness for v0.2

Stand: 2026-08-10

Quelle: \`${readiness.source}\`

Status: Development-only Diagnose; **keine Validierung und keine neue Regel**

## Ergebnis in einem Satz

Der aktuelle 52-Site-Development-Capture reicht nicht aus, um einen breiteren
v0.2-Struktur- oder Stack-Classifier seriös zu entwickeln: 34/35 erfolgreiche
AI-Sites, aber 0/16 Human-Kontrollen haben mindestens zwei erkannte moderne
Stack-Signale. Damit fehlt genau die schwierige negative Vergleichsgruppe.

## Aktueller Development-Datensatz

| Label | Gesamt | Erfolgreich | Direct | Indicative | Indeterminate | Fehler |
|---|---:|---:|---:|---:|---:|---:|
| AI | ${labels.AI.total} | ${labels.AI.successful} | ${labels.AI.direct} | ${labels.AI.indicative} | ${labels.AI.indeterminate} | ${labels.AI.errors} |
| Human | ${labels.HUMAN.total} | ${labels.HUMAN.successful} | ${labels.HUMAN.direct} | ${labels.HUMAN.indicative} | ${labels.HUMAN.indeterminate} | ${labels.HUMAN.errors} |

Die v0.1-Primärregel ergibt auf diesen bereits zur Entwicklung verwendeten
Zeilen diagnostisch Accuracy ${percent(primaryDiagnostic.accuracy)}, Precision
${percent(primaryDiagnostic.precision)}, Recall ${percent(primaryDiagnostic.recall)},
Specificity ${percent(primaryDiagnostic.specificity)} und F1 ${percent(primaryDiagnostic.f1)}.
Diese Zahlen sind optimistisch verzerrte In-sample-Diagnostik und keine
Generalisierungskennzahlen.

## Builder-Abdeckung

| Builder | n | Direct | Indicative | Indeterminate | Fehler | Direct / erfolgreiche Scans |
|---|---:|---:|---:|---:|---:|---:|
${builderRows}

Replit Agent ist mit zwei Fällen zu klein und hat keinen positiven Treffer.
Bolt ist zahlenmäßig besser vertreten, zeigt aber nur einen direkten Marker in
dreizehn Fällen. Neue Markersuche darf deshalb nur auf neuen Development-Sites
erfolgen und muss gegen moderne Human-Kontrollen geprüft werden.

## Repräsentationslücke der Human-Kontrollen

| Label | Erfolgreich | ≥1 Stack | ≥2 Stacks | ≥4 Stacks | Median Stack-Anzahl |
|---|---:|---:|---:|---:|---:|
| AI | ${stackRepresentation.AI.successful} | ${stackRepresentation.AI.withAnyRecognizedStack} | ${stackRepresentation.AI.withAtLeastTwoRecognizedStacks} | ${stackRepresentation.AI.withAtLeastFourRecognizedStacks} | ${stackRepresentation.AI.medianRecognizedStackCount} |
| Human | ${stackRepresentation.HUMAN.successful} | ${stackRepresentation.HUMAN.withAnyRecognizedStack} | ${stackRepresentation.HUMAN.withAtLeastTwoRecognizedStacks} | ${stackRepresentation.HUMAN.withAtLeastFourRecognizedStacks} | ${stackRepresentation.HUMAN.medianRecognizedStackCount} |

| Signal | AI | Human |
|---|---:|---:|
${signalRows}

Die bisherigen Human-Seiten sind für eine Direct-Marker-Prüfung nützlich, aber
nicht für die Kalibrierung allgemeiner moderner Web-Muster. Eine neue Schwelle
auf diesem Datensatz würde denselben Repräsentationsfehler wiederholen.

## Beobachtete direkte Marker im Development-Capture

| Builder / Fundort / Marker | Treffer |
|---|---:|
${markerRows}

## Blocker vor einer v0.2-Regel

1. Keine moderne negative Stack-Abdeckung im Development-Set.
2. Nur zwei Replit-Agent-Fälle.
3. Sehr geringe direkte Bolt-Abdeckung trotz dreizehn Fällen.
4. Ungleiches Labelverhältnis 36 AI / 16 Human.
5. Der geöffnete Holdout ist für jedes weitere Tuning gesperrt.

## Empfohlene Development-Erweiterung

40 **neue** Sites, die weder in den bisherigen 52 Development-Seiten noch im
abgeschlossenen 100er-Holdout vorkommen:

| Neues Stratum | Ziel |
|---|---:|
| Replit Agent, provenance-gelabelt | 10 |
| Bolt, provenance-gelabelt | 10 |
| Human Modern SaaS | 10 |
| Human Modern App | 10 |

Akquisitionsstand: **${acquisitionProgress.ready}/40 READY**. Die beiden
Human-Gruppen sind mit je zehn öffentlich dokumentierten Projekten vollständig;
Replit Agent steht bei ${acquisitionProgress.groups.AI_REPLIT_AGENT_NEW}/10 und
Bolt bei ${acquisitionProgress.groups.AI_BOLT_NEW}/10. \`HUMAN\` ist hier ein operatives
Development-Label für ein vor dem 30. November 2022 begonnenes öffentliches
Source-Projekt und kein Beweis, dass später niemals AI-Unterstützung vorkam.

Die neue negative Vergleichsgruppe trifft die erkannte Lücke: ${acquiredHumanBaseline.withAtLeastTwoRecognizedStacks}/${acquiredHumanBaseline.total}
haben mindestens zwei erkannte moderne Stack-Signale. Unter v0.1 ergeben sich
bereits ${acquiredHumanBaseline.indicative} \`indicative\`- und
${acquiredHumanBaseline.indeterminate} \`indeterminate\`-Ergebnisse. Diese
Baseline dient der Development-Diagnose und ist keine neue Validierung.

Die neue Bolt-Gruppe ist vollständig: ${acquiredBoltBaseline.total}/10 READY,
davon ${acquiredBoltBaseline.direct} \`direct\`, ${acquiredBoltBaseline.indicative}
\`indicative\` und ${acquiredBoltBaseline.indeterminate} \`indeterminate\` unter
v0.1. ${acquiredBoltBaseline.withAtLeastTwoRecognizedStacks}/10 haben mindestens
zwei erkannte moderne Stack-Signale. Damit enthält Development v0.2 gezielt
neue dokumentierte Bolt-False-Negatives und einen Direct-Positivfall.

Die Human-Seiten sollen bewusst Next.js, React, Tailwind, Radix, Lucide,
Supabase und vergleichbare moderne Stacks enthalten. Sie sind keine leichten
Gegenbeispiele, sondern der notwendige Test für generische Signale.

## Sichere v0.2-Forschungsrichtungen

1. **Direct layer:** neue stabile Builder-Artefakte in HTML und begrenzten
   Same-Origin-Assets suchen; jede Regel gegen neue Human-Sites prüfen.
2. **Context layer:** Stack-/DOM-Muster weiterhin ohne Attribution anzeigen.
3. **Technical coverage:** Blockierung, Timeout und Größenlimit getrennt vom
   Klassifikator verbessern.
4. **Evaluation:** v0.2 erst nach Development-Freeze auf einem neuen Holdout
   bestätigen; den aktuellen Holdout nicht wiederverwenden.

## Nächste To-dos

1. Zehn neue Replit-Agent-Sites mit exakter Deployment-Provenienz sammeln.
2. Die 30 READY-Ziele vor dem Development-Freeze erneut auf Erreichbarkeit prüfen.
3. Erst bei vollständiger neuer Development-Erweiterung Marker- oder
   Schwellenkandidaten testen.
4. Vor einer Produktionsänderung eine explizite Precision/Recall-Priorität festlegen.

## Empfohlener nächster Schritt

Als Nächstes die Replit-Agent-Gruppe akquirieren. Sie ist mit nur zwei alten
Development-Fällen und null positiven Treffern die größte Abdeckungslücke; der
abgeschlossene Holdout bleibt vollständig vom Tuning ausgeschlossen.
`;

await mkdir(outputDir, { recursive: true });
await writeFile(jsonPath, `${JSON.stringify(readiness, null, 2)}\n`, "utf8");
await writeFile(reportPath, report, "utf8");
process.stdout.write(`${JSON.stringify({ labels, builders, stackRepresentation, primaryDiagnostic, strictDiagnostic }, null, 2)}\n`);
process.stdout.write(`Wrote ${path.relative(process.cwd(), jsonPath)}\nWrote ${path.relative(process.cwd(), reportPath)}\n`);
