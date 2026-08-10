import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ALL_FEATURES, metrics, scoreV03, trainV03 } from "../lib/development-v0_3-candidate.mjs";

const matrixPath = path.resolve("outputs/development_v0_3/vibebench_development_v0_3_feature_matrix.json");
const outputPath = path.resolve("outputs/development_v0_3/vibebench_development_v0_3_candidate_validation.json");
const matrixText = await readFile(matrixPath, "utf8");
const matrix = JSON.parse(matrixText);
if (matrix.failed_confirmation_used !== false || matrix.rows?.length !== 188) throw new Error("Focused validation requires the 188-row Development matrix.");
const rows = matrix.rows;
const thresholds = Array.from({ length: 17 }, (_, index) => 0.42 + index * 0.005);
const options = { l2: 10, learning_rate: 0.05, iterations: 800, threshold: 0.5 };

function rng(seed) {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296);
}
function shuffle(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
function foldsFor(seed) {
  const random = rng(seed);
  const folds = Array.from({ length: 5 }, () => []);
  for (const group of [...new Set(rows.map((row) => row.target_group))]) {
    shuffle(rows.filter((row) => row.target_group === group), random).forEach((row, index) => folds[index % 5].push(row));
  }
  return folds;
}

const predictionsBySeed = [];
for (let seed = 1; seed <= 50; seed += 1) {
  const folds = foldsFor(seed);
  const predictions = [];
  for (let fold = 0; fold < 5; fold += 1) {
    const training = folds.flatMap((items, index) => index === fold ? [] : items);
    const model = trainV03(training, ALL_FEATURES, options);
    predictions.push(...folds[fold].map((row) => ({ sample_id: row.sample_id, target_group: row.target_group, target: row.target, probability: scoreV03(model, row.features) })));
  }
  predictionsBySeed.push({ seed, predictions });
  if (seed % 10 === 0) process.stdout.write(`${seed}/50 assignments\n`);
}

const candidates = thresholds.map((threshold) => {
  const runs = predictionsBySeed.map(({ seed, predictions }) => ({ seed, ...metrics(predictions, threshold) }));
  const distribution = (key) => {
    const values = runs.map((row) => row[key]).sort((a, b) => a - b);
    const at = (q) => values[Math.floor(q * (values.length - 1))];
    return { minimum: values[0], p10: at(0.1), median: at(0.5), p90: at(0.9), maximum: values.at(-1) };
  };
  return {
    threshold,
    assignments: runs.length,
    assignments_meeting_80_80: runs.filter((row) => row.precision >= 0.8 && row.recall >= 0.8).length,
    precision: distribution("precision"),
    recall: distribution("recall"),
    accuracy: distribution("accuracy"),
    runs
  };
});
candidates.sort((a, b) =>
  b.assignments_meeting_80_80 - a.assignments_meeting_80_80 ||
  Math.min(b.precision.p10, b.recall.p10) - Math.min(a.precision.p10, a.recall.p10) ||
  Math.min(b.precision.minimum, b.recall.minimum) - Math.min(a.precision.minimum, a.recall.minimum)
);
const output = {
  schema_version: "v0.3-development-candidate-validation",
  generated_at: new Date().toISOString(),
  status: candidates[0].precision.p10 >= 0.8 && candidates[0].recall.p10 >= 0.8 ? "DEVELOPMENT_STABILITY_GATE_PASSED" : "DEVELOPMENT_STABILITY_GATE_FAILED",
  purpose: "Development-only repeated cross-validation and threshold selection; not independent validation.",
  failed_confirmation_used: false,
  protocol: "50 deterministic, target-group-stratified 5-fold assignments; expanded features and fixed L2=10; threshold grid 0.420..0.500.",
  matrix_sha256: createHash("sha256").update(matrixText).digest("hex"),
  model_options: options,
  features: ALL_FEATURES,
  best: candidates[0],
  candidates
};
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
const bestSummary = { ...output.best };
delete bestSummary.runs;
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), status: output.status, best: bestSummary }, null, 2)}\n`);
