import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ALL_FEATURES, metrics, scoreV03, trainV03 } from "../lib/development-v0_3-candidate.mjs";

const matrixPath = path.resolve("outputs/development_v0_3/vibebench_development_v0_3_feature_matrix.json");
const outputPath = path.resolve("outputs/development_v0_3/vibebench_development_v0_3_feature_selection_experiments.json");
const matrix = JSON.parse(await readFile(matrixPath, "utf8"));
if (matrix.failed_confirmation_used !== false || matrix.rows?.length !== 188) throw new Error("Feature selection research requires Development only.");
const rows = matrix.rows;
const featureCounts = [8, 12, 16, 24, 32, 48];
const l2Values = [3, 10, 30];
const thresholds = [0.46, 0.48, 0.5, 0.52, 0.54];
function random(seed) { let state = seed >>> 0; return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296); }
function shuffle(values, rng) { const result = [...values]; for (let index = result.length - 1; index > 0; index -= 1) { const other = Math.floor(rng() * (index + 1)); [result[index], result[other]] = [result[other], result[index]]; } return result; }
function foldsFor(seed) { const rng = random(seed); const folds = Array.from({ length: 5 }, () => []); for (const group of [...new Set(rows.map((row) => row.target_group))]) shuffle(rows.filter((row) => row.target_group === group), rng).forEach((row, index) => folds[index % 5].push(row)); return folds; }
function selectFeatures(training, count) {
  const ai = training.filter((row) => row.target === 1);
  const human = training.filter((row) => row.target === 0);
  return ALL_FEATURES.map((name) => {
    const aiMean = ai.reduce((sum, row) => sum + row.features[name], 0) / ai.length;
    const humanMean = human.reduce((sum, row) => sum + row.features[name], 0) / human.length;
    const mean = training.reduce((sum, row) => sum + row.features[name], 0) / training.length;
    const variance = training.reduce((sum, row) => sum + (row.features[name] - mean) ** 2, 0) / training.length;
    return { name, effect: Math.abs(aiMean - humanMean) / Math.sqrt(variance || 1) };
  }).sort((a, b) => b.effect - a.effect || a.name.localeCompare(b.name)).slice(0, count).map((row) => row.name);
}

const results = [];
for (const featureCount of featureCounts) {
  for (const l2 of l2Values) {
    const assignments = [];
    for (let seed = 1; seed <= 12; seed += 1) {
      const folds = foldsFor(seed);
      const predictions = [];
      for (let fold = 0; fold < 5; fold += 1) {
        const training = folds.flatMap((items, index) => index === fold ? [] : items);
        const selected = selectFeatures(training, featureCount);
        const model = trainV03(training, selected, { l2, learning_rate: 0.05, iterations: 700, threshold: 0.5 });
        predictions.push(...folds[fold].map((row) => ({ target: row.target, probability: scoreV03(model, row.features) })));
      }
      assignments.push({ seed, predictions });
    }
    for (const threshold of thresholds) {
      const runs = assignments.map(({ seed, predictions }) => ({ seed, ...metrics(predictions, threshold) }));
      const dist = (key) => { const values = runs.map((row) => row[key]).sort((a, b) => a - b); return { minimum: values[0], p10: values[Math.floor(0.1 * (values.length - 1))], median: values[Math.floor(0.5 * (values.length - 1))], maximum: values.at(-1) }; };
      results.push({ feature_count: featureCount, l2, threshold, assignments: runs.length, assignments_meeting_80_80: runs.filter((row) => row.precision >= 0.8 && row.recall >= 0.8).length, precision: dist("precision"), recall: dist("recall"), accuracy: dist("accuracy"), runs });
    }
    process.stdout.write(`features=${featureCount} l2=${l2}\n`);
  }
}
results.sort((a, b) => b.assignments_meeting_80_80 - a.assignments_meeting_80_80 || Math.min(b.precision.p10, b.recall.p10) - Math.min(a.precision.p10, a.recall.p10) || Math.min(b.precision.minimum, b.recall.minimum) - Math.min(a.precision.minimum, a.recall.minimum));
const output = { schema_version: "v0.3-development-feature-selection-experiments", generated_at: new Date().toISOString(), purpose: "Development-only fold-local feature-selection research; not independent validation.", failed_confirmation_used: false, best: results[0], results };
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
const best = { ...output.best };
delete best.runs;
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), best }, null, 2)}\n`);
