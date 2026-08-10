import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ALL_FEATURES, STRUCTURE_FEATURES, metrics } from "../lib/development-v0_3-candidate.mjs";
import { scoreForest, trainForest } from "../lib/development-v0_3-forest.mjs";

const matrixPath = path.resolve("outputs/development_v0_3/vibebench_development_v0_3_feature_matrix.json");
const outputPath = path.resolve("outputs/development_v0_3/vibebench_development_v0_3_forest_experiments.json");
const matrix = JSON.parse(await readFile(matrixPath, "utf8"));
if (matrix.failed_confirmation_used !== false || matrix.rows?.length !== 188) throw new Error("Forest research requires the 188-row Development matrix.");
const rows = matrix.rows;
const configs = [
  { id: "structure-d4", features: STRUCTURE_FEATURES, trees: 80, max_depth: 4, min_leaf: 4, features_per_split: 12, thresholds_per_feature: 5 },
  { id: "all-d4", features: ALL_FEATURES, trees: 80, max_depth: 4, min_leaf: 4, features_per_split: 12, thresholds_per_feature: 5 },
  { id: "all-conservative", features: ALL_FEATURES, trees: 80, max_depth: 5, min_leaf: 6, features_per_split: 16, thresholds_per_feature: 5 }
];
const thresholds = [0.4, 0.425, 0.45, 0.475, 0.5, 0.525, 0.55, 0.575, 0.6];
function random(seed) { let state = seed >>> 0; return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296); }
function shuffle(values, rng) { const result = [...values]; for (let index = result.length - 1; index > 0; index -= 1) { const other = Math.floor(rng() * (index + 1)); [result[index], result[other]] = [result[other], result[index]]; } return result; }
function foldsFor(seed) {
  const rng = random(seed);
  const folds = Array.from({ length: 5 }, () => []);
  for (const group of [...new Set(rows.map((row) => row.target_group))]) shuffle(rows.filter((row) => row.target_group === group), rng).forEach((row, index) => folds[index % 5].push(row));
  return folds;
}

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
    const distribution = (key) => { const values = runs.map((row) => row[key]).sort((a, b) => a - b); return { minimum: values[0], p10: values[Math.floor(0.1 * (values.length - 1))], median: values[Math.floor(0.5 * (values.length - 1))], maximum: values.at(-1) }; };
    results.push({
      config: config.id,
      feature_count: config.features.length,
      model: Object.fromEntries(Object.entries(config).filter(([key]) => !["id", "features"].includes(key))),
      threshold,
      assignments: runs.length,
      assignments_meeting_80_80: runs.filter((row) => row.precision >= 0.8 && row.recall >= 0.8).length,
      precision: distribution("precision"), recall: distribution("recall"), accuracy: distribution("accuracy"), runs
    });
  }
}
results.sort((a, b) => b.assignments_meeting_80_80 - a.assignments_meeting_80_80 || Math.min(b.precision.p10, b.recall.p10) - Math.min(a.precision.p10, a.recall.p10) || Math.min(b.precision.minimum, b.recall.minimum) - Math.min(a.precision.minimum, a.recall.minimum));
const output = { schema_version: "v0.3-development-forest-experiments", generated_at: new Date().toISOString(), purpose: "Development-only nonlinear model research; not independent validation.", failed_confirmation_used: false, best: results[0], results };
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
const best = { ...output.best };
delete best.runs;
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), best }, null, 2)}\n`);
