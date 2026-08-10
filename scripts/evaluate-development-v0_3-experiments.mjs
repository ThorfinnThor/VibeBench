import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ALL_FEATURES, ARTIFACT_FEATURES, BASE_FEATURES, STRUCTURE_FEATURES, metrics, scoreV03, trainV03 } from "../lib/development-v0_3-candidate.mjs";

const matrixPath = path.resolve("outputs/development_v0_3/vibebench_development_v0_3_feature_matrix.json");
const outputPath = path.resolve("outputs/development_v0_3/vibebench_development_v0_3_experiments.json");
const matrix = JSON.parse(await readFile(matrixPath, "utf8"));
if (matrix.failed_confirmation_used !== false || matrix.rows?.length !== 188) throw new Error("Experiments require the leakage-safe 188-row Development matrix.");
const rows = matrix.rows;
const variants = {
  portable_v0_2: BASE_FEATURES,
  expanded_structure: STRUCTURE_FEATURES,
  expanded_plus_artifacts: ALL_FEATURES,
  compact_modern_artifacts: [
    ...BASE_FEATURES.filter((name) => name.startsWith("stack:")),
    ...["html_bytes", "visible_words", "sections", "anchors", "tailwind_like_tokens", "css_variables", "gradients", "keyframes", "external_host_count"].map((name) => `extended:${name}`),
    ...ARTIFACT_FEATURES
  ]
};
const l2Values = [3, 10, 30, 100];
const thresholds = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7];

function random(seed) {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296);
}

function shuffled(values, rng) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function foldsFor(seed, count = 5) {
  const rng = random(seed);
  const folds = Array.from({ length: count }, () => []);
  for (const group of [...new Set(rows.map((row) => row.target_group))]) {
    shuffled(rows.filter((row) => row.target_group === group), rng).forEach((row, index) => folds[index % count].push(row));
  }
  return folds;
}

const results = [];
for (const [variant, featureNames] of Object.entries(variants)) {
  for (const l2 of l2Values) {
    const assignments = [];
    for (let seed = 1; seed <= 5; seed += 1) {
      const folds = foldsFor(seed);
      const predictions = [];
      for (let fold = 0; fold < folds.length; fold += 1) {
        const test = folds[fold];
        const training = folds.flatMap((items, index) => index === fold ? [] : items);
        const model = trainV03(training, featureNames, { l2, learning_rate: 0.05, iterations: 500, threshold: 0.5 });
        predictions.push(...test.map((row) => ({ sample_id: row.sample_id, target_group: row.target_group, target: row.target, probability: scoreV03(model, row.features) })));
      }
      assignments.push({ seed, thresholds: Object.fromEntries(thresholds.map((threshold) => [threshold, metrics(predictions, threshold)])) });
    }
    for (const threshold of thresholds) {
      const runs = assignments.map((assignment) => assignment.thresholds[threshold]);
      const sorted = (key) => runs.map((row) => row[key]).sort((a, b) => a - b);
      const precision = sorted("precision");
      const recall = sorted("recall");
      results.push({
        variant,
        features: featureNames.length,
        l2,
        threshold,
        assignments: runs.length,
        assignments_meeting_80_80: runs.filter((row) => row.precision >= 0.8 && row.recall >= 0.8).length,
        minimum_precision: precision[0],
        median_precision: precision[Math.floor(precision.length / 2)],
        minimum_recall: recall[0],
        median_recall: recall[Math.floor(recall.length / 2)],
        mean_accuracy: runs.reduce((sum, row) => sum + row.accuracy, 0) / runs.length,
        runs
      });
    }
    process.stdout.write(`${variant} l2=${l2} complete\n`);
  }
}

results.sort((a, b) =>
  b.assignments_meeting_80_80 - a.assignments_meeting_80_80 ||
  Math.min(b.minimum_precision, b.minimum_recall) - Math.min(a.minimum_precision, a.minimum_recall) ||
  Math.min(b.median_precision, b.median_recall) - Math.min(a.median_precision, a.median_recall) ||
  b.mean_accuracy - a.mean_accuracy
);
const output = {
  schema_version: "v0.3-development-experiments",
  generated_at: new Date().toISOString(),
  purpose: "Development-only fixed-grid research; not independent validation.",
  failed_confirmation_used: false,
  protocol: "Five deterministic target-group-stratified 5-fold assignments. Model scores and thresholds are compared only on Development.",
  best: results[0],
  results
};
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
const topFive = results.slice(0, 5).map((row) => { const summary = { ...row }; delete summary.runs; return summary; });
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), best: output.best, top_five: topFive }, null, 2)}\n`);
