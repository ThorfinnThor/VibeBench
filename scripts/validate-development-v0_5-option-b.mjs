import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { metrics, scoreV03, trainV03 } from "../lib/development-v0_3-candidate.mjs";

const inputPath = path.resolve("outputs/development_v0_5_option_b/option_b_browser_surface_matrix_v1.json");
const outputPath = path.resolve("outputs/development_v0_5_option_b/option_b_development_validation_v1.json");
const inputText = await readFile(inputPath, "utf8");
const input = JSON.parse(inputText);
const rows = input.rows.filter((row) => row.ok);
const featureNames = input.feature_names;
if (rows.length !== 81 || rows.filter((row) => row.target === 1).length !== 28 || rows.filter((row) => row.target === 0).length !== 53) throw new Error("Unexpected frozen Option-B matrix.");
if (featureNames.some((name) => /host|url|provenance|builder/i.test(name))) throw new Error("Prohibited feature in Option-B matrix.");

const l2Values = [1, 3, 10, 30, 100];
const thresholds = Array.from({ length: 51 }, (_, index) => .25 + index * .01);
function random(seed) { let state = seed >>> 0; return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296); }
function shuffle(values, rng) { const result = [...values]; for (let index = result.length - 1; index > 0; index -= 1) { const other = Math.floor(rng() * (index + 1)); [result[index], result[other]] = [result[other], result[index]]; } return result; }
function foldsFor(seed) {
  const rng = random(seed);
  const folds = Array.from({ length: 5 }, () => []);
  for (const target of [0, 1]) shuffle(rows.filter((row) => row.target === target), rng).forEach((row, index) => folds[index % 5].push(row));
  return folds;
}
function balanceTraining(training) {
  const ai = training.filter((row) => row.target === 1);
  const human = training.filter((row) => row.target === 0);
  const count = Math.max(ai.length, human.length);
  return [ai, human].flatMap((group) => Array.from({ length: count }, (_, index) => group[index % group.length]));
}
function distribution(runs, key) {
  const values = runs.map((row) => row[key]).sort((a, b) => a - b);
  const at = (q) => values[Math.floor(q * (values.length - 1))];
  return { minimum: values[0], p10: at(.1), median: at(.5), p90: at(.9), maximum: values.at(-1) };
}

const assignmentsByL2 = new Map();
for (const l2 of l2Values) {
  const assignments = [];
  for (let seed = 1; seed <= 20; seed += 1) {
    const folds = foldsFor(seed);
    const predictions = [];
    for (let fold = 0; fold < folds.length; fold += 1) {
      const training = balanceTraining(folds.flatMap((items, index) => index === fold ? [] : items));
      const model = trainV03(training, featureNames, { l2, learning_rate: .05, iterations: 1200, threshold: .5 });
      predictions.push(...folds[fold].map((row) => ({ sample_id: row.sample_id, target: row.target, probability: scoreV03(model, row.features) })));
    }
    assignments.push({ seed, predictions });
  }
  assignmentsByL2.set(l2, assignments);
  process.stdout.write(`l2=${l2} complete\n`);
}

const candidates = [];
for (const l2 of l2Values) {
  for (const threshold of thresholds) {
    const runs = assignmentsByL2.get(l2).map(({ seed, predictions }) => ({ seed, ...metrics(predictions, threshold) }));
    candidates.push({
      l2,
      threshold,
      assignments: runs.length,
      assignments_meeting_90_90: runs.filter((row) => row.precision >= .9 && row.recall >= .9).length,
      precision: distribution(runs, "precision"),
      recall: distribution(runs, "recall"),
      f1: distribution(runs, "f1"),
      runs
    });
  }
}
candidates.sort((a, b) => b.assignments_meeting_90_90 - a.assignments_meeting_90_90 || Math.min(b.precision.minimum, b.recall.minimum) - Math.min(a.precision.minimum, a.recall.minimum) || Math.min(b.precision.p10, b.recall.p10) - Math.min(a.precision.p10, a.recall.p10));
const best = candidates[0];

function cohortTransfer(trainCohort, testCohort) {
  const training = balanceTraining(rows.filter((row) => row.cohort === trainCohort));
  const testing = rows.filter((row) => row.cohort === testCohort);
  const model = trainV03(training, featureNames, { l2: best.l2, learning_rate: .05, iterations: 1200, threshold: best.threshold });
  const predictions = testing.map((row) => ({ sample_id: row.sample_id, target: row.target, probability: scoreV03(model, row.features) }));
  return { train_cohort: trainCohort, test_cohort: testCohort, training_rows: training.length, testing_rows: testing.length, ...metrics(predictions, best.threshold) };
}
const cohortTransferTests = [cohortTransfer("existing", "expansion"), cohortTransfer("expansion", "existing")];

const noDirectFeatureNames = featureNames.filter((name) => !["lovable", "bolt", "replit", "v0"].includes(name));
const noDirectRuns = [];
for (let seed = 1; seed <= 20; seed += 1) {
  const folds = foldsFor(seed);
  const predictions = [];
  for (let fold = 0; fold < folds.length; fold += 1) {
    const training = balanceTraining(folds.flatMap((items, index) => index === fold ? [] : items));
    const model = trainV03(training, noDirectFeatureNames, { l2: best.l2, learning_rate: .05, iterations: 1200, threshold: .5 });
    predictions.push(...folds[fold].map((row) => ({ target: row.target, probability: scoreV03(model, row.features) })));
  }
  noDirectRuns.push({ seed, ...metrics(predictions, best.threshold) });
}

const candidateSummaries = candidates.map((candidate) => Object.fromEntries(Object.entries(candidate).filter(([key]) => key !== "runs")));
const output = {
  schema_version: "vibebench.option_b.development_validation.v1",
  generated_at: new Date().toISOString(),
  status: best.assignments_meeting_90_90 === 20 ? "DEVELOPMENT_90_90_GATE_PASSED" : "DEVELOPMENT_90_90_GATE_NOT_MET",
  purpose: "Development-only Option-B evaluation; not an independent holdout.",
  input: { path: path.relative(process.cwd(), inputPath), sha256: createHash("sha256").update(inputText).digest("hex") },
  protocol: "20 score-blind class-stratified 5-fold assignments; fold-local standardization and training; deterministic class balancing; threshold and l2 selected on Development.",
  rows: { total: rows.length, strong_ai: rows.filter((row) => row.target === 1).length, stable_human: rows.filter((row) => row.target === 0).length },
  best,
  cohort_transfer_tests: cohortTransferTests,
  no_direct_builder_marker_stress_test: {
    feature_count: noDirectFeatureNames.length,
    precision: distribution(noDirectRuns, "precision"),
    recall: distribution(noDirectRuns, "recall"),
    runs: noDirectRuns
  },
  candidates: candidateSummaries
};
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
const bestSummary = { ...best }; delete bestSummary.runs;
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), status: output.status, rows: output.rows, best: bestSummary, cohort_transfer_tests: cohortTransferTests, no_direct_builder_marker_stress_test: { feature_count: noDirectFeatureNames.length, precision: output.no_direct_builder_marker_stress_test.precision, recall: output.no_direct_builder_marker_stress_test.recall } }, null, 2)}\n`);
