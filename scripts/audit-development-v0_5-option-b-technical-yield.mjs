import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { classifyTechnicalScanOutcome } from "../lib/technical-scan-outcome.mjs";

const inputPath = path.resolve("outputs/development_v0_5_option_b/option_b_browser_surface_matrix_v1.json");
const outputPath = path.resolve("outputs/development_v0_5_option_b/option_b_technical_yield_audit_v1.json");
const inputText = await readFile(inputPath, "utf8");
const input = JSON.parse(inputText);

if (input.rows.length !== 169 || input.rows.filter((row) => row.ok).length !== 81 || input.rows.filter((row) => !row.ok).length !== 88) {
  throw new Error("Unexpected frozen Option-B browser matrix.");
}

function wilson(successes, total, z = 1.959963984540054) {
  if (!total) return { lower: 0, upper: 0 };
  const p = successes / total;
  const denominator = 1 + z ** 2 / total;
  const center = (p + z ** 2 / (2 * total)) / denominator;
  const margin = z * Math.sqrt((p * (1 - p) + z ** 2 / (4 * total)) / total) / denominator;
  return { lower: center - margin, upper: center + margin };
}

function summarize(rows) {
  const successful = rows.filter((row) => row.ok).length;
  const outcomes = Object.entries(rows.reduce((counts, row) => {
    const code = row.outcome?.code || classifyTechnicalScanOutcome(row).code;
    counts[code] = (counts[code] || 0) + 1;
    return counts;
  }, {})).sort((a, b) => b[1] - a[1]).map(([code, count]) => ({ code, count, share: count / rows.length }));
  return { attempted: rows.length, successful, failed: rows.length - successful, technical_yield: successful / rows.length, technical_yield_wilson_95: wilson(successful, rows.length), outcomes };
}

const auditedRows = input.rows.map((row) => {
  const outcome = classifyTechnicalScanOutcome(row);
  const host = new URL(row.target_url).hostname.toLowerCase().replace(/^www\./, "");
  return {
    sample_id: row.sample_id,
    label: row.label,
    cohort: row.cohort,
    target_group: row.target_group,
    hosting_suffix: host.split(".").slice(-2).join("."),
    ok: row.ok,
    outcome,
    original_error: row.error || null
  };
});

const byLabel = Object.fromEntries([...new Set(auditedRows.map((row) => row.label))].sort().map((label) => [label, summarize(auditedRows.filter((row) => row.label === label))]));
const byCohort = Object.fromEntries([...new Set(auditedRows.map((row) => row.cohort))].sort().map((cohort) => [cohort, summarize(auditedRows.filter((row) => row.cohort === cohort))]));
const byLabelAndCohort = Object.fromEntries([...new Set(auditedRows.map((row) => `${row.label}__${row.cohort}`))].sort().map((key) => {
  const [label, cohort] = key.split("__");
  return [key, summarize(auditedRows.filter((row) => row.label === label && row.cohort === cohort))];
}));
const strongAiYield = byLabel.STRONG_AI.technical_yield;
const stableHumanYield = byLabel.STABLE_HUMAN.technical_yield;

const failedHostingSuffixes = Object.entries(auditedRows.filter((row) => !row.ok).reduce((counts, row) => {
  counts[row.hosting_suffix] = (counts[row.hosting_suffix] || 0) + 1;
  return counts;
}, {})).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([hosting_suffix, failures]) => ({ hosting_suffix, failures }));

const output = {
  schema_version: "vibebench.option_b.technical_yield_audit.v1",
  generated_at: new Date().toISOString(),
  status: "FROZEN_HISTORICAL_AUDIT_NO_RESCAN",
  input: { path: path.relative(process.cwd(), inputPath), sha256: createHash("sha256").update(inputText).digest("hex") },
  interpretation: {
    navigation_timeout: "Historical collection retained no lower-level reason for these failures. They must remain unresolved timeouts and must not be called unreachable, offline or blocked.",
    label_warning: "Technical yield differs by benchmark label, so complete-case model metrics are exposed to label-dependent selection bias.",
    hosting_warning: "Hosting suffix is audit metadata only and must never become a model feature."
  },
  overall: summarize(auditedRows),
  by_label: byLabel,
  by_cohort: byCohort,
  by_label_and_cohort: byLabelAndCohort,
  label_yield_gap: {
    strong_ai: strongAiYield,
    stable_human: stableHumanYield,
    absolute_percentage_point_gap: (stableHumanYield - strongAiYield) * 100,
    strong_ai_to_stable_human_yield_ratio: strongAiYield / stableHumanYield
  },
  failed_hosting_suffixes: failedHostingSuffixes,
  rows: auditedRows
};

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), overall: output.overall, by_label: output.by_label, by_cohort: output.by_cohort, label_yield_gap: output.label_yield_gap, failed_hosting_suffixes: failedHostingSuffixes.slice(0, 10) }, null, 2)}\n`);
