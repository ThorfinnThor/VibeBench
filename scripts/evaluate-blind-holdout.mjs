import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("outputs/holdout_v0_1/blind_run_v0_1_2026-08-10");
const rawPath = path.join(outputDir, "vibebench_blind_holdout_raw_results_v0_1.json");
const metricsPath = path.join(outputDir, "vibebench_blind_holdout_metrics_v0_1.json");
const reportPath = path.join(outputDir, "VIBEBENCH_BLIND_HOLDOUT_EVALUATION_V0_1.md");
const bootstrapReplicates = 10_000;
const bootstrapSeed = 20260810;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function divide(numerator, denominator) {
  return denominator ? numerator / denominator : null;
}

function confusion(rows, positiveVerdicts) {
  const successful = rows.filter((row) => row.technical_success);
  const isPositive = (row) => positiveVerdicts.has(row.verdict);
  const tp = successful.filter((row) => row.label === "AI" && isPositive(row)).length;
  const fn = successful.filter((row) => row.label === "AI" && !isPositive(row)).length;
  const fp = successful.filter((row) => row.label === "HUMAN" && isPositive(row)).length;
  const tn = successful.filter((row) => row.label === "HUMAN" && !isPositive(row)).length;
  const precision = divide(tp, tp + fp);
  const recall = divide(tp, tp + fn);
  return {
    tp, fp, tn, fn,
    accuracy: divide(tp + tn, tp + fp + tn + fn),
    precision,
    recall,
    specificity: divide(tn, tn + fp),
    falsePositiveRate: divide(fp, fp + tn),
    f1: precision === null || recall === null || precision + recall === 0 ? null : 2 * precision * recall / (precision + recall)
  };
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function sampleWithReplacement(rows, random) {
  return Array.from({ length: rows.length }, () => rows[Math.floor(random() * rows.length)]);
}

function percentile(sorted, probability) {
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function interval(values) {
  const valid = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  return { lower: percentile(valid, 0.025), upper: percentile(valid, 0.975) };
}

function stratifiedBootstrap(rows, positiveVerdicts) {
  const random = mulberry32(bootstrapSeed);
  const aiSuccessful = rows.filter((row) => row.label === "AI" && row.technical_success);
  const humanSuccessful = rows.filter((row) => row.label === "HUMAN" && row.technical_success);
  const samples = { accuracy: [], precision: [], recall: [], specificity: [], falsePositiveRate: [], f1: [], aiDirectRate: [] };
  for (let index = 0; index < bootstrapReplicates; index += 1) {
    const replicate = [...sampleWithReplacement(aiSuccessful, random), ...sampleWithReplacement(humanSuccessful, random)];
    const value = confusion(replicate, positiveVerdicts);
    for (const metric of ["accuracy", "precision", "recall", "specificity", "falsePositiveRate", "f1"]) {
      if (value[metric] !== null) samples[metric].push(value[metric]);
    }
    samples.aiDirectRate.push(divide(replicate.filter((row) => row.label === "AI" && row.verdict === "direct").length, aiSuccessful.length));
  }
  return Object.fromEntries(Object.entries(samples).map(([metric, values]) => [metric, interval(values)]));
}

function technicalBootstrap(rows) {
  const random = mulberry32(bootstrapSeed ^ 0x5f3759df);
  const ai = rows.filter((row) => row.label === "AI");
  const human = rows.filter((row) => row.label === "HUMAN");
  const values = { overall: [], ai: [], human: [] };
  for (let index = 0; index < bootstrapReplicates; index += 1) {
    const aiSample = sampleWithReplacement(ai, random);
    const humanSample = sampleWithReplacement(human, random);
    const combined = [...aiSample, ...humanSample];
    values.overall.push(divide(combined.filter((row) => row.technical_success).length, combined.length));
    values.ai.push(divide(aiSample.filter((row) => row.technical_success).length, aiSample.length));
    values.human.push(divide(humanSample.filter((row) => row.technical_success).length, humanSample.length));
  }
  return Object.fromEntries(Object.entries(values).map(([metric, samples]) => [metric, interval(samples)]));
}

function summarizeGroup(rows) {
  const successful = rows.filter((row) => row.technical_success);
  const countVerdict = (verdict) => rows.filter((row) => row.verdict === verdict).length;
  return {
    total: rows.length,
    technicalSuccess: successful.length,
    technicalErrors: rows.length - successful.length,
    direct: countVerdict("direct"),
    indicative: countVerdict("indicative"),
    indeterminate: countVerdict("indeterminate"),
    positive: successful.filter((row) => row.verdict === "direct" || row.verdict === "indicative").length,
    positiveRate: divide(successful.filter((row) => row.verdict === "direct" || row.verdict === "indicative").length, successful.length)
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return percentile(sorted, 0.5);
}

function formatPercent(value, digits = 1) {
  return value === null ? "n/a" : `${(value * 100).toFixed(digits)} %`;
}

function formatInterval(point, bounds) {
  return `${formatPercent(point)} (${formatPercent(bounds.lower)}–${formatPercent(bounds.upper)})`;
}

function markdownCell(value) {
  return String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");
}

const rawText = await readFile(rawPath, "utf8");
const raw = JSON.parse(rawText);
if (raw.status !== "completed" || raw.flattenedResults?.length !== 100) throw new Error("Expected a completed 100-row blind run.");
const rows = raw.flattenedResults;
const successful = rows.filter((row) => row.technical_success);
const aiSuccessful = successful.filter((row) => row.label === "AI");
const humanSuccessful = successful.filter((row) => row.label === "HUMAN");
const primaryVerdicts = new Set(["direct", "indicative"]);
const strictVerdicts = new Set(["direct"]);
const primary = confusion(rows, primaryVerdicts);
const strictDirectOnly = confusion(rows, strictVerdicts);
const primaryIntervals = stratifiedBootstrap(rows, primaryVerdicts);
const strictIntervals = stratifiedBootstrap(rows, strictVerdicts);
const technicalIntervals = technicalBootstrap(rows);
const groups = Object.fromEntries([...new Set(rows.map((row) => row.target_group))].map((group) => [group, summarizeGroup(rows.filter((row) => row.target_group === group))]));
const technical = {
  total: rows.length,
  success: successful.length,
  errors: rows.length - successful.length,
  retries: rows.filter((row) => row.attempts === 2).length,
  successRate: divide(successful.length, rows.length),
  aiSuccess: aiSuccessful.length,
  aiErrors: 50 - aiSuccessful.length,
  aiSuccessRate: divide(aiSuccessful.length, 50),
  humanSuccess: humanSuccessful.length,
  humanErrors: 50 - humanSuccessful.length,
  humanSuccessRate: divide(humanSuccessful.length, 50),
  medianTotalDurationMs: median(rows.map((row) => row.total_duration_ms)),
  p95TotalDurationMs: percentile(rows.map((row) => row.total_duration_ms).sort((a, b) => a - b), 0.95)
};
const verdicts = {
  ai: summarizeGroup(rows.filter((row) => row.label === "AI")),
  human: summarizeGroup(rows.filter((row) => row.label === "HUMAN"))
};
const falsePositives = rows.filter((row) => row.label === "HUMAN" && row.technical_success && primaryVerdicts.has(row.verdict));
const falseNegatives = rows.filter((row) => row.label === "AI" && row.technical_success && !primaryVerdicts.has(row.verdict));
const errors = rows.filter((row) => !row.technical_success);
const evaluation = {
  schemaVersion: "v0.1",
  generatedAt: raw.completedAt,
  runId: raw.runId,
  rawResults: path.relative(process.cwd(), rawPath),
  rawResultsSha256: sha256(rawText),
  endpoint: raw.endpoint,
  manifestSha256: raw.manifestSha256,
  scannerCommit: raw.scannerCommit,
  runnerCommit: raw.runnerCommit,
  runStartedAt: raw.startedAt,
  runCompletedAt: raw.completedAt,
  bootstrap: { method: "stratified percentile", replicates: bootstrapReplicates, seed: bootstrapSeed, confidenceLevel: 0.95 },
  technical,
  technicalIntervals,
  verdicts,
  primaryDefinition: "direct or indicative = positive; indeterminate = negative; technical errors excluded",
  primary,
  primaryIntervals,
  exploratoryDefinition: "direct only = positive; indicative or indeterminate = negative; post-hoc diagnostic",
  strictDirectOnly,
  strictIntervals,
  groups,
  falsePositiveSampleIds: falsePositives.map((row) => row.sample_id),
  falseNegativeSampleIds: falseNegatives.map((row) => row.sample_id),
  technicalErrorSampleIds: errors.map((row) => row.sample_id)
};

const metricRows = [
  ["Accuracy", primary.accuracy, primaryIntervals.accuracy],
  ["Precision", primary.precision, primaryIntervals.precision],
  ["Recall / sensitivity", primary.recall, primaryIntervals.recall],
  ["Specificity", primary.specificity, primaryIntervals.specificity],
  ["False-positive rate", primary.falsePositiveRate, primaryIntervals.falsePositiveRate],
  ["F1", primary.f1, primaryIntervals.f1]
].map(([name, point, bounds]) => `| ${name} | ${formatInterval(point, bounds)} |`).join("\n");
const groupRows = Object.entries(groups).map(([group, value]) => `| ${group} | ${value.technicalSuccess}/${value.total} | ${value.direct} | ${value.indicative} | ${value.indeterminate} | ${value.technicalErrors} | ${formatPercent(value.positiveRate)} |`).join("\n");
const falsePositiveRows = falsePositives.map((row) => `| ${row.sample_id} | ${markdownCell(row.target_url)} | ${markdownCell(row.stack_signals)} | ${markdownCell(row.structural_hints)} |`).join("\n");
const errorRows = errors.map((row) => `| ${row.sample_id} | ${row.label} | ${markdownCell(row.target_url)} | ${markdownCell(row.error)} | ${row.attempts} |`).join("\n");

const report = `# VibeBench blind holdout evaluation v0.1

Stand: 2026-08-10  
Run: \`${raw.runId}\`  
Scanner: \`${raw.scannerCommit}\`  
Endpoint: ${raw.endpoint}

## Executive result

The preregistered rule (**direct or indicative = positive**) produced ${primary.tp} true positives, ${primary.fp} false positives, ${primary.tn} true negatives, and ${primary.fn} false negatives on ${successful.length} technically successful scans. Accuracy was ${formatPercent(primary.accuracy)}, precision ${formatPercent(primary.precision)}, recall ${formatPercent(primary.recall)}, specificity ${formatPercent(primary.specificity)}, and F1 ${formatPercent(primary.f1)}.

Technical completion was ${technical.success}/${technical.total} (${formatInterval(technical.successRate, technicalIntervals.overall)}). The two final failures are reported separately and are not converted into classification errors.

The strongest product finding is the separation between evidence levels: no Human control had a direct verdict, while ${verdicts.human.indicative} Human controls were called indicative. Direct evidence alone therefore had ${formatPercent(strictDirectOnly.precision)} precision and ${formatPercent(strictDirectOnly.specificity)} specificity on this holdout, but this is a **post-hoc diagnostic**, not the preregistered primary result and not an independently validated replacement threshold.

## Technical execution

| Measure | Result |
|---|---:|
| Successful scans | ${technical.success} / ${technical.total} |
| Final technical errors | ${technical.errors} |
| Retried exactly once | ${technical.retries} |
| AI technical success | ${technical.aiSuccess} / 50 (${formatPercent(technical.aiSuccessRate)}) |
| Human technical success | ${technical.humanSuccess} / 50 (${formatPercent(technical.humanSuccessRate)}) |
| Median total request time | ${Math.round(technical.medianTotalDurationMs)} ms |
| P95 total request time | ${Math.round(technical.p95TotalDurationMs)} ms |

| Failed sample | Label | URL | Final error | Attempts |
|---|---|---|---|---:|
${errorRows}

## Primary classification result

Positive means \`direct\` or \`indicative\`; negative means \`indeterminate\`. Technical errors are excluded.

| Ground truth / prediction | Positive | Negative |
|---|---:|---:|
| AI | TP ${primary.tp} | FN ${primary.fn} |
| Human | FP ${primary.fp} | TN ${primary.tn} |

| Metric | Point estimate (95% stratified-bootstrap interval) |
|---|---:|
${metricRows}

Bootstrap: ${bootstrapReplicates.toLocaleString("en-US")} deterministic stratified replicates, seed ${bootstrapSeed}. AI and Human successful rows were sampled separately with replacement.

## Verdict distribution by stratum

| Stratum | Technical | Direct | Indicative | Indeterminate | Error | Primary positive rate |
|---|---:|---:|---:|---:|---:|---:|
${groupRows}

## Human indicative false positives

No Human control received direct builder evidence. All ${falsePositives.length} primary false positives came from the general multi-signal \`indicative\` route.

| Sample | URL | Stack signals | Structural hints |
|---|---|---|---|
${falsePositiveRows}

## Exploratory strict operating point

If only \`direct\` is considered positive, the same opened holdout gives TP ${strictDirectOnly.tp}, FP ${strictDirectOnly.fp}, TN ${strictDirectOnly.tn}, FN ${strictDirectOnly.fn}; accuracy ${formatPercent(strictDirectOnly.accuracy)}, precision ${formatPercent(strictDirectOnly.precision)}, recall ${formatPercent(strictDirectOnly.recall)}, specificity ${formatPercent(strictDirectOnly.specificity)}, and F1 ${formatPercent(strictDirectOnly.f1)}. Because this comparison was selected after seeing the results, it is evidence for designing v0.2, not a new validated claim.

## Interpretation

- Direct deployment artifacts behave as high-precision evidence on this set.
- The generic indicative route is not sufficiently specific to be presented as equivalent to direct builder evidence: ${falsePositives.length}/${humanSuccessful.length} technically successful Human controls were indicative.
- Here, blind means that the scanner source, thresholds, manifest and retry policy were frozen before holdout requests. Labels remained in the audit manifest, but the endpoint received only each target URL.
- AI coverage remains builder-dependent. Replit Agent had no positive result among its nine technically successful sites; Lovable, v0, and Base44-derived sites were much more visible.
- An \`indeterminate\` result does not mean a page was Human-made. It means the frozen public-page scanner did not see enough evidence.
- Group sizes are ten sites and provide directional diagnostics, not precise builder-wide estimates.
- These results apply to the frozen curated holdout and are not a calibrated AI-authorship probability.

## Next actions

1. Keep direct evidence as the only high-confidence user-facing attribution in the current product language.
2. Rename or demote indicative output to an explicitly non-attributive structural signal before changing any classifier rule.
3. Develop a v0.2 rule on Development data only; do not tune against these 100 labels.
4. Create a fresh second holdout before validating a v0.2 threshold or probability score.
5. Add a distinct technical outcome for blocked pages and size-limit failures so they cannot be confused with indeterminate classifications.
`;

await writeFile(metricsPath, `${JSON.stringify(evaluation, null, 2)}\n`, "utf8");
await writeFile(reportPath, report, "utf8");
process.stdout.write(`${JSON.stringify({ technical, primary, strictDirectOnly, groups }, null, 2)}\n`);
process.stdout.write(`Wrote ${path.relative(process.cwd(), metricsPath)}\nWrote ${path.relative(process.cwd(), reportPath)}\n`);
