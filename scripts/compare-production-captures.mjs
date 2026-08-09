import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const [beforeArg, afterArg, outputArg] = process.argv.slice(2);

if (!beforeArg || !afterArg) {
  throw new Error("Usage: node scripts/compare-production-captures.mjs <before.json> <after.json> [report.md]");
}

const beforePath = path.resolve(beforeArg);
const afterPath = path.resolve(afterArg);
const reportPath = path.resolve(outputArg || "outputs/VIBEBENCH_PRODUCTION_COMPARISON_LATEST.md");

async function loadCapture(filePath) {
  const value = JSON.parse(await readFile(filePath, "utf8"));
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Expected a non-empty capture array in ${filePath}`);
  }
  const seen = new Set();
  for (const [index, row] of value.entries()) {
    for (const key of ["sampleId", "label", "url", "verdict"]) {
      if (!row?.[key]) throw new Error(`Row ${index + 1} in ${filePath} is missing ${key}`);
    }
    if (seen.has(row.sampleId)) throw new Error(`Duplicate sampleId ${row.sampleId} in ${filePath}`);
    seen.add(row.sampleId);
  }
  return value;
}

const before = await loadCapture(beforePath);
const after = await loadCapture(afterPath);
const beforeById = new Map(before.map((row) => [row.sampleId, row]));
const afterById = new Map(after.map((row) => [row.sampleId, row]));
const allIds = [...new Set([...beforeById.keys(), ...afterById.keys()])].sort();

const count = (rows, predicate) => rows.filter(predicate).length;
const labels = [...new Set(after.map((row) => row.label))].sort();
const verdicts = ["direct", "indicative", "indeterminate", "error"];

function summarize(rows) {
  return {
    total: rows.length,
    successful: count(rows, (row) => row.apiOk),
    errors: count(rows, (row) => !row.apiOk),
    byLabel: Object.fromEntries(labels.map((label) => [label, Object.fromEntries(
      verdicts.map((verdict) => [verdict, count(rows, (row) => row.label === label && row.verdict === verdict)])
    )]))
  };
}

const beforeSummary = summarize(before);
const afterSummary = summarize(after);
const changes = allIds.flatMap((sampleId) => {
  const oldRow = beforeById.get(sampleId);
  const newRow = afterById.get(sampleId);
  if (!oldRow || !newRow) {
    return [{ sampleId, label: newRow?.label || oldRow?.label || "—", builder: newRow?.builder || oldRow?.builder || "—", before: oldRow?.verdict || "missing", after: newRow?.verdict || "missing" }];
  }
  if (oldRow.verdict === newRow.verdict && Boolean(oldRow.apiOk) === Boolean(newRow.apiOk)) return [];
  return [{ sampleId, label: newRow.label, builder: newRow.builder || "—", before: oldRow.verdict, after: newRow.verdict }];
});

const aiRows = after.filter((row) => row.label === "AI");
const builders = [...new Set(aiRows.map((row) => row.builder).filter(Boolean))].sort();
const markerRows = after.filter((row) => row.verdict === "direct");

const cell = (value) => String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
const delta = (next, previous) => {
  const value = next - previous;
  return value > 0 ? `+${value}` : String(value);
};

const summaryRows = labels.flatMap((label) => verdicts.map((verdict) => {
  const oldValue = beforeSummary.byLabel[label]?.[verdict] || 0;
  const newValue = afterSummary.byLabel[label]?.[verdict] || 0;
  return `| ${label} | ${verdict} | ${oldValue} | ${newValue} | ${delta(newValue, oldValue)} |`;
})).join("\n");

const changeRows = changes.length
  ? changes.map((row) => `| ${row.sampleId} | ${row.label} | ${cell(row.builder)} | ${row.before} | ${row.after} |`).join("\n")
  : "| — | — | — | keine Änderung | keine Änderung |";

const builderRows = builders.map((builder) => {
  const rows = aiRows.filter((row) => row.builder === builder);
  return `| ${cell(builder)} | ${rows.length} | ${count(rows, (row) => row.verdict === "direct")} | ${count(rows, (row) => row.verdict === "indicative")} | ${count(rows, (row) => row.verdict === "indeterminate")} | ${count(rows, (row) => row.verdict === "error")} |`;
}).join("\n");

const markerTable = markerRows.map((row) => {
  const details = row.directEvidenceDetails?.map((item) => `${item.label}: ${item.detail}`).join(", ")
    || row.directEvidence?.join(", ")
    || "—";
  return `| ${row.sampleId} | ${cell(row.builder || "—")} | ${cell(details)} |`;
}).join("\n");

const report = `# VibeBench production comparison: pre- vs. post-hardening

Stand: 2026-08-09  
Vorher: \`${path.relative(process.cwd(), beforePath)}\`  
Nachher: \`${path.relative(process.cwd(), afterPath)}\`

## Zweck

Dieser Vergleich prüft ausschließlich die gezielte False-Positive-Härtung und
die Transparenz der direkten Marker. Er ist kein Blind-Holdout und keine
allgemeine Accuracy-Aussage.

## Zusammenfassung

| Label | Verdict | Vorher | Nachher | Delta |
|---|---|---:|---:|---:|
${summaryRows}

Technisch erfolgreich: ${beforeSummary.successful}/${beforeSummary.total} vorher,
${afterSummary.successful}/${afterSummary.total} nachher.

## Geänderte Einzelergebnisse

| Sample | Label | Builder | Vorher | Nachher |
|---|---|---|---|---|
${changeRows}

## AI-Abdeckung nach Builder

| Builder | n | Direct | Indicative | Indeterminate | Error |
|---|---:|---:|---:|---:|---:|
${builderRows}

## Transparente Direct-Marker

| Sample | Builder | Marker und Fundort |
|---|---|---|
${markerTable}

## Interpretation

- Die Härtung soll ausschließlich generische Strukturmuster ohne erkannten
  Stack von \`indicative\` auf \`indeterminate\` zurückstufen.
- Direkte und indikative AI-Fälle dürfen dabei nicht verloren gehen.
- Builder-Abdeckung und Accuracy sind getrennte Fragen. Fehlende direkte Marker
  werden nicht durch Hosting oder generische Framework-Kombinationen ersetzt.

## Nächste To-dos

1. Die sichtbare Erklärung der Strukturhinweise deployen.
2. Die niedrige Direct-Abdeckung von Bolt und Replit Agent als bekannte Lücke führen.
3. Neue Builder-Marker nur nach Human-Control- und Blind-Holdout-Prüfung ergänzen.
4. Einen unangetasteten, builderbalancierten Holdout einfrieren.

## Empfohlener nächster Schritt

Die lokale Erklärung der bestehenden \`indicative\`-Fälle deployen, ohne die
Entscheidungsschwelle erneut zu verändern. Danach einen Blind-Holdout festlegen.
`;

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, report, "utf8");
process.stdout.write(`Wrote ${reportPath}\n`);
process.stdout.write(`${JSON.stringify({ before: beforeSummary, after: afterSummary, changes }, null, 2)}\n`);
