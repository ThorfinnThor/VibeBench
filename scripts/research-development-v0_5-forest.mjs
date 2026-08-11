import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ALL_FEATURES, STRUCTURE_FEATURES, metrics } from "../lib/development-v0_3-candidate.mjs";
import { scoreForest, trainForest } from "../lib/development-v0_3-forest.mjs";

const matrixPath = path.resolve("outputs/development_v0_5/vibebench_development_v0_5_feature_matrix.json");
const outputPath = path.resolve("outputs/development_v0_5/vibebench_development_v0_5_forest_experiments.json");
const matrix = JSON.parse(await readFile(matrixPath, "utf8"));
if (matrix.failed_confirmations_used !== false || matrix.rows?.length !== 366) throw new Error("Forest research requires the 366-row v0.5 Development matrix.");
const rows = matrix.rows;
const configs = [
  { id: "structure-d4", features: STRUCTURE_FEATURES, trees: 100, max_depth: 4, min_leaf: 5, features_per_split: 14, thresholds_per_feature: 7 },
  { id: "all-d4", features: ALL_FEATURES, trees: 100, max_depth: 4, min_leaf: 5, features_per_split: 14, thresholds_per_feature: 7 },
  { id: "all-d5", features: ALL_FEATURES, trees: 120, max_depth: 5, min_leaf: 4, features_per_split: 18, thresholds_per_feature: 7 },
  { id: "all-conservative", features: ALL_FEATURES, trees: 120, max_depth: 6, min_leaf: 7, features_per_split: 20, thresholds_per_feature: 7 }
];
const thresholds = Array.from({ length: 21 }, (_, index) => .3 + index * .02);
function random(seed) { let state = seed >>> 0; return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296); }
function shuffle(values, rng) { const result = [...values]; for (let index = result.length - 1; index > 0; index -= 1) { const other = Math.floor(rng() * (index + 1)); [result[index], result[other]] = [result[other], result[index]]; } return result; }
function foldsFor(seed) { const rng = random(seed); const folds = Array.from({ length: 5 }, () => []); for (const group of [...new Set(rows.map((row) => row.target_group))]) shuffle(rows.filter((row) => row.target_group === group), rng).forEach((row, index) => folds[index % 5].push(row)); return folds; }
function distribution(runs, key) { const values = runs.map((row) => row[key]).sort((a, b) => a - b); const at = (q) => values[Math.floor(q * (values.length - 1))]; return { minimum: values[0], p10: at(.1), median: at(.5), p90: at(.9), maximum: values.at(-1) }; }

const results = [];
for (const config of configs) {
  const assignments = [];
  for (let seed = 1; seed <= 8; seed += 1) {
    const folds = foldsFor(seed);
    const predictions = [];
    for (let fold = 0; fold < 5; fold += 1) {
      const training = folds.flatMap((items, index) => index === fold ? [] : items);
      const model = trainForest(training, config.features, { ...config, seed: seed * 1009 + fold * 9176 });
      predictions.push(...folds[fold].map((row) => ({ target: row.target, probability: scoreForest(model, row.features) })));
    }
    assignments.push({ seed, predictions });
    process.stdout.write(`${config.id} ${seed}/8\n`);
  }
  for (const threshold of thresholds) {
    const runs = assignments.map(({ seed, predictions }) => ({ seed, ...metrics(predictions, threshold) }));
    results.push({ config: config.id, feature_count: config.features.length, model: Object.fromEntries(Object.entries(config).filter(([key]) => !["id", "features"].includes(key))), threshold, assignments: runs.length, assignments_meeting_90_90: runs.filter((row) => row.precision >= .9 && row.recall >= .9).length, precision: distribution(runs, "precision"), recall: distribution(runs, "recall"), accuracy: distribution(runs, "accuracy"), runs });
  }
}
results.sort((a, b) => b.assignments_meeting_90_90 - a.assignments_meeting_90_90 || Math.min(b.precision.p10, b.recall.p10) - Math.min(a.precision.p10, a.recall.p10) || Math.min(b.precision.minimum, b.recall.minimum) - Math.min(a.precision.minimum, a.recall.minimum));
const output = { schema_version: "v0.5-development-forest-experiments", generated_at: new Date().toISOString(), purpose: "Development-only nonlinear model research; not independent validation.", failed_confirmation_used: false, best: results[0], results };
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
const best = { ...output.best }; delete best.runs;
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), best }, null, 2)}\n`);
