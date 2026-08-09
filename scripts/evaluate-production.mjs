import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const apiUrl = process.env.VIBEBENCH_API_URL || "https://vibe-bench-cyan.vercel.app/api/scan";
const importedResultsPath = process.env.VIBEBENCH_RESULTS_FILE
  ? path.resolve(process.env.VIBEBENCH_RESULTS_FILE)
  : null;
const outputTag = String(process.env.VIBEBENCH_OUTPUT_TAG || "")
  .toLowerCase()
  .replace(/[^a-z0-9_-]+/g, "-")
  .replace(/^-+|-+$/g, "");
const outputSuffix = outputTag ? `_${outputTag}` : "";
const outputDir = path.resolve("outputs");
const jsonPath = path.join(outputDir, `vibebench_production_smoke${outputSuffix}_2026-08-09.json`);
const reportPath = path.join(outputDir, `VIBEBENCH_PRODUCTION_SMOKE${outputSuffix.toUpperCase()}_2026-08-09.md`);

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
      headerEvidence: (payload.headerEvidence || []).map((item) => item.label),
      manifestEvidence: (payload.manifestEvidence || []).map((item) => item.label),
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
      headerEvidence: [],
      manifestEvidence: [],
      stackSignals: [],
      structuralHints: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

let results;
if (importedResultsPath) {
  const imported = JSON.parse(await readFile(importedResultsPath, "utf8"));
  if (!Array.isArray(imported) || imported.length === 0) {
    throw new Error(`Expected a non-empty result array in ${importedResultsPath}`);
  }
  results = imported.map((row, index) => {
    for (const key of ["sampleId", "label", "url", "verdict"]) {
      if (!row?.[key]) throw new Error(`Imported result ${index + 1} is missing ${key}`);
    }
    return {
      builder: "",
      apiOk: row.verdict !== "error",
      durationMs: 0,
      directEvidence: [],
      contextEvidence: [],
      headerEvidence: [],
      manifestEvidence: [],
      stackSignals: [],
      structuralHints: [],
      assetMetrics: {},
      ...row
    };
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
const parseMetric = (value) => Number(String(value ?? "0").replaceAll(".", "").replace(",", ".")) || 0;
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
  },
  assetScan: {
    fetched: results.reduce((total, row) => total + parseMetric(row.assetMetrics?.["Assets scanned"]), 0),
    bytes: results.reduce((total, row) => total + parseMetric(row.assetMetrics?.["Asset bytes"]), 0),
    errors: results.reduce((total, row) => total + parseMetric(row.assetMetrics?.["Asset errors"]), 0),
    truncated: results.reduce((total, row) => total + parseMetric(row.assetMetrics?.["Assets truncated"]), 0)
  },
  contextSignals: {
    withHeaders: count(results, (row) => row.headerEvidence?.length > 0),
    withManifest: count(results, (row) => row.manifestEvidence?.length > 0),
    aiWithHeaders: count(ai, (row) => row.headerEvidence?.length > 0),
    aiWithManifest: count(ai, (row) => row.manifestEvidence?.length > 0),
    humanWithHeaders: count(human, (row) => row.headerEvidence?.length > 0),
    humanWithManifest: count(human, (row) => row.manifestEvidence?.length > 0)
  }
};

const fixedSmokeSelection = results.length === samples.length
  && results.every((row, index) => row.sampleId === samples[index].sampleId);
const selectionDescription = fixedSmokeSelection
  ? "10 previously scanable provenance-labelled AI samples and 10 previously scanable Human controls from v0.9."
  : `${results.length} browser-captured, previously scanable provenance-labelled samples from the v0.9 live dataset.`;

const audit = {
  generatedAt: new Date().toISOString(),
  apiUrl,
  collectionMode: importedResultsPath ? "browser-captured production UI" : "direct API",
  importedResultsPath: importedResultsPath ? path.relative(process.cwd(), importedResultsPath) : null,
  purpose: "Production evidence evaluation; not a model accuracy claim or blind holdout.",
  selection: selectionDescription,
  summary,
  results
};

const cell = (value) => String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
const percentage = (numerator, denominator) => denominator ? `${(100 * numerator / denominator).toFixed(1)} %` : "n/a";
const table = results.map((row) => {
  const technicalContext = [...row.stackSignals, ...row.contextEvidence];
  return `| ${row.sampleId} | ${row.label} | ${cell(row.builder || "—")} | ${row.apiOk ? row.verdict : "error"} | ${cell(row.directEvidence.join(", ") || "—")} | ${cell(technicalContext.join(", ") || "—")} | ${cell(row.headerEvidence.join(", ") || "—")} | ${cell(row.manifestEvidence.join(", ") || "—")} | ${cell(row.assetMetrics?.["Assets scanned"] || "—")} | ${cell(row.assetMetrics?.["Asset bytes"] || "—")} | ${row.durationMs} |`;
}).join("\n");

const report = `# VibeBench production evidence evaluation

Stand: 2026-08-09  
API: ${apiUrl}  
Erfassung: ${importedResultsPath ? "Produktions-UI im Browser; anschließend reproduzierbar importiert" : "direkter API-Runner"}

## Zweck

Dieser Produktionstest prüft, ob der veröffentlichte Evidence Scanner auf
einer festgehaltenen Auswahl aus dem v0.9-Datensatz technisch stabil arbeitet.
Er ist **keine Accuracy- oder Kalibrierungsbehauptung**. Die aktuelle App trennt
direkte Builder-Artefakte, allgemeine Hinweise und unbestimmte Ergebnisse.

## Auswahl

- ${selectionDescription}
- AI: ${summary.ai.total}; Human: ${summary.human.total}.
- Erfasste Builder: ${[...new Set(ai.map((row) => row.builder).filter(Boolean))].join(", ") || "—"}.

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
| Assets geprüft | ${summary.assetScan.fetched} |
| Asset-Bytes geprüft | ${summary.assetScan.bytes.toLocaleString("de-DE")} |
| Asset-Fehler | ${summary.assetScan.errors} |
| Gekürzte Assets | ${summary.assetScan.truncated} |
| Seiten mit Infrastruktur-Headern | ${summary.contextSignals.withHeaders} / ${summary.total} |
| Seiten mit gültigem verlinktem Manifest | ${summary.contextSignals.withManifest} / ${summary.total} |
| AI mit Headern / Manifest | ${summary.contextSignals.aiWithHeaders} / ${summary.contextSignals.aiWithManifest} |
| Human mit Headern / Manifest | ${summary.contextSignals.humanWithHeaders} / ${summary.contextSignals.humanWithManifest} |

## Einzelergebnisse

| Sample | Label | Builder | Verdict | Direkte Evidenz | Technischer Kontext | Header | Manifest | Assets | Asset-Bytes | ms |
|---|---|---|---|---|---|---|---|---:|---:|---:|
${table}

## Interpretation

- \`direct\` bedeutet, dass ein builder-spezifisches Deployment-Artefakt sichtbar war.
- \`indicative\` bündelt mehrere allgemeine Struktur-/Stack-Hinweise und ist keine Builder-Zuordnung.
- \`indeterminate\` ist ein erwartetes, ehrliches Ergebnis, wenn sichtbare Evidenz fehlt.
- Hosting wie Vercel, Netlify oder Replit wird allein nicht als direkte AI-Evidenz gewertet.
- Header und Web-App-Manifeste liefern technischen Kontext, aber keine direkte Builder-Zuordnung.

## Nächste To-dos

1. Strukturhinweise in der Oberfläche explizit und verständlich benennen.
2. Niedrige Direct-Abdeckung bei Bolt und Replit Agent als bekannte Lücke führen.
3. Einen noch nie zur Regelentwicklung verwendeten Blind-Holdout definieren.
4. Scan-Ausfälle getrennt von Klassifikationsfehlern berichten.
5. Erst nach Blind-Holdout und Kalibrierung einen Wahrscheinlichkeitswert ergänzen.
`;

await mkdir(outputDir, { recursive: true });
await writeFile(jsonPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
await writeFile(reportPath, report, "utf8");

process.stdout.write(`\nWrote ${jsonPath}\nWrote ${reportPath}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
