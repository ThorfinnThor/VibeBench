import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const apiUrl = process.env.VIBEBENCH_API_URL || "https://vibe-bench-cyan.vercel.app/api/scan";
const importedResultsPath = process.env.VIBEBENCH_RESULTS_FILE
  ? path.resolve(process.env.VIBEBENCH_RESULTS_FILE)
  : null;
const outputDir = path.resolve("outputs");
const jsonPath = path.join(outputDir, "vibebench_production_smoke_2026-08-09.json");
const reportPath = path.join(outputDir, "VIBEBENCH_PRODUCTION_SMOKE_2026-08-09.md");

const samples = [
  { sampleId: "AIN-0001", label: "AI", builder: "Lovable", url: "https://challengebrew.com" },
  { sampleId: "AIN-0005", label: "AI", builder: "Lovable", url: "https://product-vision-log.lovable.app" },
  { sampleId: "AIN-0019", label: "AI", builder: "Lovable", url: "https://healthsync-360.lovable.app/" },
  { sampleId: "AIN-0008", label: "AI", builder: "Bolt", url: "https://prilo.ai" },
  { sampleId: "AIN-0025", label: "AI", builder: "Bolt", url: "https://zingy-cannoli-9cacce.netlify.app/" },
  { sampleId: "AIN-0029", label: "AI", builder: "Bolt", url: "https://promptbuilder.cloud" },
  { sampleId: "AIN-0039", label: "AI", builder: "Replit Agent", url: "https://reaction-master-devthedev01.replit.app/" },
  { sampleId: "AIN-0042", label: "AI", builder: "v0", url: "https://v0-shopify-game-template-4501.vercel.app/" },
  { sampleId: "AIN-0044", label: "AI", builder: "v0", url: "https://v0-compute-11.vercel.app/" },
  { sampleId: "AIA-0023", label: "AI", builder: "Claude Code", url: "https://cardshows.io" },
  { sampleId: "HUM-0001", label: "HUMAN", builder: "", url: "https://blog.markvincze.com/" },
  { sampleId: "HUM-0002", label: "HUMAN", builder: "", url: "https://declare-ai.org/" },
  { sampleId: "HUM-0003", label: "HUMAN", builder: "", url: "https://www.jeremyheminger.com/" },
  { sampleId: "HUM-0004", label: "HUMAN", builder: "", url: "https://alexburton.com/" },
  { sampleId: "HUM-0005", label: "HUMAN", builder: "", url: "https://danabyerly.com/" },
  { sampleId: "HUM-0006", label: "HUMAN", builder: "", url: "https://nathanupchurch.com/" },
  { sampleId: "HUM-0007", label: "HUMAN", builder: "", url: "https://sustainable-rails.com/" },
  { sampleId: "HUM-0008", label: "HUMAN", builder: "", url: "https://baillehachepascal.dev/" },
  { sampleId: "HUM-0009", label: "HUMAN", builder: "", url: "https://liam.nwmr.ch/" },
  { sampleId: "HUM-0010", label: "HUMAN", builder: "", url: "https://ultreia.me/" }
];

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function scan(sample) {
  const startedAt = Date.now();
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: sample.url }),
      signal: AbortSignal.timeout(25_000)
    });
    const payload = await response.json();
    return {
      ...sample,
      apiOk: response.ok && payload.ok === true,
      durationMs: Date.now() - startedAt,
      resolvedUrl: payload.resolvedUrl || null,
      httpStatus: payload.httpStatus || null,
      verdict: payload.verdict?.level || "error",
      verdictTitle: payload.verdict?.title || null,
      directEvidence: (payload.directEvidence || []).map((item) => item.label),
      contextEvidence: (payload.contextEvidence || []).map((item) => item.label),
      stackSignals: payload.stackSignals || [],
      structuralHints: payload.structuralHints || [],
      error: payload.error || null
    };
  } catch (error) {
    return {
      ...sample,
      apiOk: false,
      durationMs: Date.now() - startedAt,
      resolvedUrl: null,
      httpStatus: null,
      verdict: "error",
      verdictTitle: null,
      directEvidence: [],
      contextEvidence: [],
      stackSignals: [],
      structuralHints: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

let results;
if (importedResultsPath) {
  const imported = JSON.parse(await readFile(importedResultsPath, "utf8"));
  if (!Array.isArray(imported) || imported.length !== samples.length) {
    throw new Error(`Expected ${samples.length} imported results in ${importedResultsPath}`);
  }
  const importedById = new Map(imported.map((row) => [row.sampleId, row]));
  results = samples.map((sample) => {
    const importedRow = importedById.get(sample.sampleId);
    if (!importedRow) throw new Error(`Missing imported result for ${sample.sampleId}`);
    return { ...sample, ...importedRow };
  });
  process.stdout.write(`Using captured production results from ${importedResultsPath}\n`);
} else {
  results = [];
  for (const [index, sample] of samples.entries()) {
    process.stdout.write(`[${index + 1}/${samples.length}] ${sample.sampleId} ${sample.url}\n`);
    results.push(await scan(sample));
    if (index < samples.length - 1) await wait(300);
  }
}

const count = (rows, predicate) => rows.filter(predicate).length;
const ai = results.filter((row) => row.label === "AI");
const human = results.filter((row) => row.label === "HUMAN");
const summary = {
  total: results.length,
  apiSuccessful: count(results, (row) => row.apiOk),
  apiErrors: count(results, (row) => !row.apiOk),
  ai: {
    total: ai.length,
    direct: count(ai, (row) => row.verdict === "direct"),
    indicative: count(ai, (row) => row.verdict === "indicative"),
    indeterminate: count(ai, (row) => row.verdict === "indeterminate"),
    errors: count(ai, (row) => row.verdict === "error")
  },
  human: {
    total: human.length,
    direct: count(human, (row) => row.verdict === "direct"),
    indicative: count(human, (row) => row.verdict === "indicative"),
    indeterminate: count(human, (row) => row.verdict === "indeterminate"),
    errors: count(human, (row) => row.verdict === "error")
  }
};

const audit = {
  generatedAt: new Date().toISOString(),
  apiUrl,
  collectionMode: importedResultsPath ? "browser-captured production UI" : "direct API",
  importedResultsPath: importedResultsPath ? path.relative(process.cwd(), importedResultsPath) : null,
  purpose: "Small production smoke evaluation; not a model accuracy claim.",
  selection: "10 previously scanable provenance-labelled AI samples and 10 previously scanable Human controls from v0.9.",
  summary,
  results
};

const cell = (value) => String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
const percentage = (numerator, denominator) => denominator ? `${(100 * numerator / denominator).toFixed(1)} %` : "n/a";
const table = results.map((row) => {
  const technicalContext = [...row.stackSignals, ...row.contextEvidence];
  return `| ${row.sampleId} | ${row.label} | ${cell(row.builder || "—")} | ${row.apiOk ? row.verdict : "error"} | ${cell(row.directEvidence.join(", ") || "—")} | ${cell(technicalContext.join(", ") || "—")} | ${row.durationMs} |`;
}).join("\n");

const report = `# VibeBench production smoke evaluation

Stand: 2026-08-09  
API: ${apiUrl}  
Erfassung: ${importedResultsPath ? "Produktions-UI im Browser; anschließend reproduzierbar importiert" : "direkter API-Runner"}

## Zweck

Dieser kleine Produktionstest prüft, ob der veröffentlichte Evidence Scanner auf
einer festgehaltenen Auswahl aus dem v0.9-Datensatz technisch stabil arbeitet.
Er ist **keine Accuracy- oder Kalibrierungsbehauptung**. Die aktuelle App trennt
direkte Builder-Artefakte, allgemeine Hinweise und unbestimmte Ergebnisse.

## Auswahl

- 10 zuvor erfolgreich scanbare, provenance-gelabelte AI-Seiten.
- 10 zuvor erfolgreich scanbare Human-Kontrollen.
- Die Auswahl deckt Lovable, Bolt, Replit Agent, v0 und Claude Code ab.

## Ergebnis

| Kennzahl | Wert |
|---|---:|
| API erfolgreich | ${summary.apiSuccessful} / ${summary.total} |
| AI: direkte Evidenz | ${summary.ai.direct} / ${summary.ai.total} (${percentage(summary.ai.direct, summary.ai.total)}) |
| AI: direkte oder indikative Evidenz | ${summary.ai.direct + summary.ai.indicative} / ${summary.ai.total} (${percentage(summary.ai.direct + summary.ai.indicative, summary.ai.total)}) |
| AI: unbestimmt | ${summary.ai.indeterminate} / ${summary.ai.total} |
| Human: direkte Evidenz | ${summary.human.direct} / ${summary.human.total} |
| Human: indikative Evidenz | ${summary.human.indicative} / ${summary.human.total} |
| Human: unbestimmt | ${summary.human.indeterminate} / ${summary.human.total} |
| Scanfehler | ${summary.apiErrors} |

## Einzelergebnisse

| Sample | Label | Builder | Verdict | Direkte Evidenz | Technischer Kontext | ms |
|---|---|---|---|---|---|---:|
${table}

## Interpretation

- \`direct\` bedeutet, dass ein builder-spezifisches Deployment-Artefakt sichtbar war.
- \`indicative\` bündelt mehrere allgemeine Struktur-/Stack-Hinweise und ist keine Builder-Zuordnung.
- \`indeterminate\` ist ein erwartetes, ehrliches Ergebnis, wenn sichtbare Evidenz fehlt.
- Hosting wie Vercel, Netlify oder Replit wird allein nicht als direkte AI-Evidenz gewertet.

## Nächste To-dos

1. Fehlende AI-Treffer nach Builder gruppieren und die zugehörigen JS-/CSS-Assets untersuchen.
2. Header-, Manifest- und Source-Map-Signale aus dem Python-Extractor in die Web-API übernehmen.
3. Die Produktionsevaluation auf alle aktuell erreichbaren gelabelten URLs ausweiten.
4. Scan-Ausfälle getrennt von Klassifikationsfehlern berichten.
5. Erst nach einem Blind-Holdout und Kalibrierung einen Wahrscheinlichkeitswert ergänzen.
`;

await mkdir(outputDir, { recursive: true });
await writeFile(jsonPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
await writeFile(reportPath, report, "utf8");

process.stdout.write(`\nWrote ${jsonPath}\nWrote ${reportPath}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
