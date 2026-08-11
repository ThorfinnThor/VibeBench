import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ALL_FEATURES, metrics, scoreV03, trainV03 } from "../lib/development-v0_3-candidate.mjs";

const matrixPath = path.resolve("outputs/development_v0_5/vibebench_development_v0_5_feature_matrix.json");
const outputPath = path.resolve("outputs/development_v0_5/vibebench_development_v0_5_baseline_validation.json");
const matrixText = await readFile(matrixPath, "utf8");
const matrix = JSON.parse(matrixText);
if (matrix.failed_confirmations_used !== false || matrix.rows?.length !== 366) throw new Error("Invalid v0.5 Development matrix.");
const rows = matrix.rows;
const l2Values = [1, 3, 10, 30];
const thresholds = Array.from({ length: 41 }, (_, index) => 0.3 + index * 0.01);
function random(seed) { let state = seed >>> 0; return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296); }
function shuffle(values, rng) { const result = [...values]; for (let index = result.length - 1; index > 0; index -= 1) { const other = Math.floor(rng() * (index + 1)); [result[index], result[other]] = [result[other], result[index]]; } return result; }
function foldsFor(seed) { const rng = random(seed); const folds = Array.from({ length: 5 }, () => []); for (const group of [...new Set(rows.map((row) => row.target_group))]) shuffle(rows.filter((row) => row.target_group === group), rng).forEach((row, index) => folds[index % 5].push(row)); return folds; }
function distribution(runs, key) { const values = runs.map((row) => row[key]).sort((a, b) => a - b); const at = (q) => values[Math.floor(q * (values.length - 1))]; return { minimum: values[0], p10: at(.1), median: at(.5), p90: at(.9), maximum: values.at(-1) }; }

const candidates = [];
for (const l2 of l2Values) {
  const assignments = [];
  for (let seed = 1; seed <= 10; seed += 1) {
    const folds = foldsFor(seed);
    const predictions = [];
    for (let fold = 0; fold < 5; fold += 1) {
      const training = folds.flatMap((items, index) => index === fold ? [] : items);
      const model = trainV03(training, ALL_FEATURES, { l2, learning_rate: .05, iterations: 800, threshold: .5 });
      predictions.push(...folds[fold].map((row) => ({ sample_id: row.sample_id, target: row.target, target_group: row.target_group, probability: scoreV03(model, row.features) })));
    }
    assignments.push({ seed, predictions });
  }
  for (const threshold of thresholds) {
    const runs = assignments.map(({ seed, predictions }) => ({ seed, ...metrics(predictions, threshold) }));
    candidates.push({ l2, threshold, assignments: runs.length, assignments_meeting_90_90: runs.filter((row) => row.precision >= .9 && row.recall >= .9).length, precision: distribution(runs, "precision"), recall: distribution(runs, "recall"), accuracy: distribution(runs, "accuracy"), runs });
  }
  process.stdout.write(`l2=${l2} complete\n`);
}
candidates.sort((a, b) => b.assignments_meeting_90_90 - a.assignments_meeting_90_90 || Math.min(b.precision.p10, b.recall.p10) - Math.min(a.precision.p10, a.recall.p10) || Math.min(b.precision.minimum, b.recall.minimum) - Math.min(a.precision.minimum, a.recall.minimum));
const best = candidates[0];
const output = { schema_version: "v0.5-development-baseline-validation", generated_at: new Date().toISOString(), status: best.precision.p10 >= .9 && best.recall.p10 >= .9 ? "DEVELOPMENT_90_90_GATE_PASSED" : "DEVELOPMENT_90_90_GATE_NOT_MET", purpose: "Development-only repeated CV after score-blind 120-site expansion; not independent validation.", failed_confirmations_used: false, protocol: "10 target-group-stratified 5-fold assignments; existing 97 features; l2 and threshold grid selected on Development.", matrix_sha256: createHash("sha256").update(matrixText).digest("hex"), best, candidates };
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
const summary = { ...best }; delete summary.runs;
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), status: output.status, best: summary }, null, 2)}\n`);
