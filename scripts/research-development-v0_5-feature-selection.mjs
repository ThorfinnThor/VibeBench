import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { metrics, scoreV03, trainV03 } from "../lib/development-v0_3-candidate.mjs";
import { V05_FEATURES } from "../lib/development-v0_5-candidate.mjs";

const matrixPath = path.resolve("outputs/development_v0_5/vibebench_development_v0_5_expanded_feature_matrix.json");
const outputPath = path.resolve("outputs/development_v0_5/vibebench_development_v0_5_feature_selection_experiments.json");
const matrix = JSON.parse(await readFile(matrixPath, "utf8"));
if (matrix.failed_confirmations_used !== false || matrix.rows?.length !== 364) throw new Error("Feature selection requires v0.5 Development only.");
const rows = matrix.rows;
const featureCounts = [24, 36, 48, 64, 96, 128];
const l2Values = [3, 10, 30];
const thresholds = Array.from({ length: 31 }, (_, index) => .35 + index * .01);
function random(seed) { let state = seed >>> 0; return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296); }
function shuffle(values, rng) { const result = [...values]; for (let index = result.length - 1; index > 0; index -= 1) { const other = Math.floor(rng() * (index + 1)); [result[index], result[other]] = [result[other], result[index]]; } return result; }
function foldsFor(seed) { const rng = random(seed); const folds = Array.from({ length: 5 }, () => []); for (const group of [...new Set(rows.map((row) => row.target_group))]) shuffle(rows.filter((row) => row.target_group === group), rng).forEach((row, index) => folds[index % 5].push(row)); return folds; }
function selectFeatures(training, featureCount) {
  const ai = training.filter((row) => row.target === 1);
  const human = training.filter((row) => row.target === 0);
  return V05_FEATURES.map((name) => {
    const aiMean = ai.reduce((sum, row) => sum + row.features[name], 0) / ai.length;
    const humanMean = human.reduce((sum, row) => sum + row.features[name], 0) / human.length;
    const mean = training.reduce((sum, row) => sum + row.features[name], 0) / training.length;
    const variance = training.reduce((sum, row) => sum + (row.features[name] - mean) ** 2, 0) / training.length;
    return { name, effect: Math.abs(aiMean - humanMean) / Math.sqrt(variance || 1) };
  }).sort((a, b) => b.effect - a.effect || a.name.localeCompare(b.name)).slice(0, featureCount).map((row) => row.name);
}
function distribution(runs, key) { const values = runs.map((row) => row[key]).sort((a, b) => a - b); const at = (q) => values[Math.floor(q * (values.length - 1))]; return { minimum: values[0], p10: at(.1), median: at(.5), p90: at(.9), maximum: values.at(-1) }; }

const results = [];
for (const featureCount of featureCounts) {
  for (const l2 of l2Values) {
    const assignments = [];
    for (let seed = 1; seed <= 8; seed += 1) {
      const folds = foldsFor(seed);
      const predictions = [];
      for (let fold = 0; fold < 5; fold += 1) {
        const training = folds.flatMap((items, index) => index === fold ? [] : items);
        const selected = selectFeatures(training, featureCount);
        const model = trainV03(training, selected, { l2, learning_rate: .05, iterations: 800, threshold: .5 });
        predictions.push(...folds[fold].map((row) => ({ target: row.target, probability: scoreV03(model, row.features) })));
      }
      assignments.push({ seed, predictions });
    }
    for (const threshold of thresholds) {
      const runs = assignments.map(({ seed, predictions }) => ({ seed, ...metrics(predictions, threshold) }));
      results.push({ feature_count: featureCount, l2, threshold, assignments: runs.length, assignments_meeting_90_90: runs.filter((row) => row.precision >= .9 && row.recall >= .9).length, precision: distribution(runs, "precision"), recall: distribution(runs, "recall"), accuracy: distribution(runs, "accuracy"), runs });
    }
    process.stdout.write(`features=${featureCount} l2=${l2}\n`);
  }
}
results.sort((a, b) => b.assignments_meeting_90_90 - a.assignments_meeting_90_90 || Math.min(b.precision.p10, b.recall.p10) - Math.min(a.precision.p10, a.recall.p10) || Math.min(b.precision.minimum, b.recall.minimum) - Math.min(a.precision.minimum, a.recall.minimum));
const output = { schema_version: "v0.5-development-feature-selection-experiments", generated_at: new Date().toISOString(), purpose: "Development-only fold-local feature selection; not independent validation.", failed_confirmation_used: false, best: results[0], results };
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
const best = { ...output.best }; delete best.runs;
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), best }, null, 2)}\n`);
