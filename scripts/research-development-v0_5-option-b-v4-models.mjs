import { readFile, writeFile } from "node:fs/promises";
import { metrics, scoreV03, trainV03 } from "../lib/development-v0_3-candidate.mjs";
import { OPTION_B_V4_DERIVED_FEATURES } from "../lib/option-b-v4-derived-feature-contract.mjs";

const inputPath = "outputs/development_v0_5_option_b_v4/option_b_v4_derived_feature_matrix_v1.json";
const outputPath = "outputs/development_v0_5_option_b_v4/option_b_v4_model_research_v1.json";
const input = JSON.parse(await readFile(inputPath, "utf8"));
const rows = input.rows;
if (rows.length < 40 || rows.some((row) => !row.features || row.target_group === undefined)) throw new Error("v4 model research requires the frozen labeled derived matrix.");

function random(seed) { let state = seed >>> 0; return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296); }
function shuffle(values, rng) { const result = [...values]; for (let index = result.length - 1; index > 0; index -= 1) { const other = Math.floor(rng() * (index + 1)); [result[index], result[other]] = [result[other], result[index]]; } return result; }
function foldsFor(seed) {
  const rng = random(seed); const folds = Array.from({ length: 5 }, () => []);
  for (const group of [...new Set(rows.map((row) => row.target_group))]) shuffle(rows.filter((row) => row.target_group === group), rng).forEach((row, index) => folds[index % folds.length].push(row));
  return folds;
}
function classBalanced(training) {
  const groups = [training.filter((row) => row.target === 0), training.filter((row) => row.target === 1)];
  const count = Math.max(...groups.map((group) => group.length));
  return groups.flatMap((group) => Array.from({ length: count }, (_, index) => group[index % group.length]));
}
function distribution(runs, key) {
  const values = runs.map((row) => row[key]).sort((a, b) => a - b); const quantile = (q) => values[Math.floor(q * (values.length - 1))];
  return { minimum: values[0], p10: quantile(.1), median: quantile(.5), p90: quantile(.9), maximum: values.at(-1) };
}
function runConfiguration(configuration) {
  const assignments = [];
  for (let seed = 1; seed <= 20; seed += 1) {
    const folds = foldsFor(seed); const predictions = [];
    for (let fold = 0; fold < folds.length; fold += 1) {
      const rawTraining = folds.flatMap((items, index) => index === fold ? [] : items);
      const training = configuration.balanced ? classBalanced(rawTraining) : rawTraining;
      const model = trainV03(training, OPTION_B_V4_DERIVED_FEATURES, { l2: configuration.l2, learning_rate: configuration.learning_rate, iterations: configuration.iterations, threshold: .5 });
      predictions.push(...folds[fold].map((row) => ({ sample_id: row.sample_id, target: row.target, probability: scoreV03(model, row.features) })));
    }
    assignments.push({ seed, predictions });
  }
  return assignments;
}
const thresholds = Array.from({ length: 41 }, (_, index) => .30 + index * .01);
const configurations = [
  { id: "logistic-unbalanced-l2-3", family: "logistic", balanced: false, l2: 3, learning_rate: .05, iterations: 1800 },
  { id: "logistic-unbalanced-l2-10", family: "logistic", balanced: false, l2: 10, learning_rate: .05, iterations: 1800 },
  { id: "logistic-balanced-l2-3", family: "logistic", balanced: true, l2: 3, learning_rate: .05, iterations: 1800 },
  { id: "logistic-balanced-l2-10", family: "logistic", balanced: true, l2: 10, learning_rate: .05, iterations: 1800 },
  { id: "logistic-balanced-l2-30", family: "logistic", balanced: true, l2: 30, learning_rate: .05, iterations: 1800 }
];
const results = [];
for (const configuration of configurations) {
  const assignments = runConfiguration(configuration);
  for (const threshold of thresholds) {
    const runs = assignments.map(({ seed, predictions }) => ({ seed, ...metrics(predictions, threshold) }));
    results.push({ id: configuration.id, family: configuration.family, feature_count: OPTION_B_V4_DERIVED_FEATURES.length, configuration, threshold, assignments: runs.length, assignments_meeting_80_80: runs.filter((row) => row.precision >= .8 && row.recall >= .8).length, assignments_meeting_90_90: runs.filter((row) => row.precision >= .9 && row.recall >= .9).length, precision: distribution(runs, "precision"), recall: distribution(runs, "recall"), f1: distribution(runs, "f1"), runs });
  }
  process.stdout.write(`${configuration.id} complete\n`);
}
results.sort((a, b) => b.assignments_meeting_80_80 - a.assignments_meeting_80_80 || Math.min(b.precision.p10, b.recall.p10) - Math.min(a.precision.p10, a.recall.p10) || b.f1.median - a.f1.median);
const best = results[0];
const output = {
  schema_version: "vibebench.option_b.v4_model_research.v1",
  generated_at: new Date().toISOString(),
  purpose: "Development-only cross-validation on the 61 successful 81-site technical captures. This does not independently confirm production performance and does not authorize a production model change.",
  input: { path: inputPath, schema_version: input.schema_version, rows: rows.length, strong_ai: rows.filter((row) => row.target === 1).length, stable_human: rows.filter((row) => row.target === 0).length, group_stratified_folds: 5, assignments_per_configuration: 20 },
  selection_rule: "Development selection only: maximize assignments meeting 80/80, then p10 minimum of precision/recall, then median F1. Threshold is not transferred to an untouched confirmation set.",
  best: { ...best, runs: undefined },
  results: results.map((result) => ({ ...result, runs: undefined })),
  // Keep the complete fold predictions only for the selected Development
  // configuration. Aggregate rows above preserve the comparison without
  // committing hundreds of redundant prediction vectors.
  assignments: { best: best.runs }
};
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
const summary = { output: outputPath, best: { id: best.id, threshold: best.threshold, assignments_meeting_80_80: best.assignments_meeting_80_80, precision: best.precision, recall: best.recall, f1: best.f1 } };
console.log(JSON.stringify(summary, null, 2));
