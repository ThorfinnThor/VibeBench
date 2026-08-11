import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { metrics, scoreV03, trainV03 } from "../lib/development-v0_3-candidate.mjs";
import { scoreForest, trainForest } from "../lib/development-v0_3-forest.mjs";

const inputPath = path.resolve("outputs/development_v0_5_option_b/option_b_browser_surface_matrix_v1.json");
const outputPath = path.resolve("outputs/development_v0_5_option_b/option_b_model_research_v1.json");
const input = JSON.parse(await readFile(inputPath, "utf8"));
const rows = input.rows.filter((row) => row.ok);
const allFeatures = input.feature_names;
const subsets = {
  vibe_ui_core: ["animation_classes", "arbitrary_classes", "blur_classes", "class_tokens", "gradient_classes", "hover_classes", "lucide", "responsive_classes", "rounded_classes", "shadow_classes", "tailwind_tokens", "vite", "bolt", "replit"],
  surface_balanced: ["animation_classes", "arbitrary_classes", "aria", "blur_classes", "buttons", "class_tokens", "data_attrs", "gradient_classes", "hover_classes", "links", "lucide", "responsive_classes", "rounded_classes", "scripts", "sections", "shadow_classes", "svgs", "tailwind_tokens", "vite", "bolt", "replit"],
  public_surface_no_badges: ["animation_classes", "arbitrary_classes", "aria", "blur_classes", "buttons", "class_tokens", "data_attrs", "gradient_classes", "hover_classes", "links", "lucide", "responsive_classes", "rounded_classes", "scripts", "sections", "shadow_classes", "svgs", "tailwind_tokens", "vite"]
};
for (const [id, names] of Object.entries(subsets)) for (const name of names) if (!allFeatures.includes(name)) throw new Error(`${id} missing ${name}`);

const thresholds = Array.from({ length: 51 }, (_, index) => .25 + index * .01);
function random(seed) { let state = seed >>> 0; return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296); }
function shuffle(values, rng) { const result = [...values]; for (let index = result.length - 1; index > 0; index -= 1) { const other = Math.floor(rng() * (index + 1)); [result[index], result[other]] = [result[other], result[index]]; } return result; }
function foldsFor(seed) { const rng = random(seed); const folds = Array.from({ length: 5 }, () => []); for (const target of [0, 1]) shuffle(rows.filter((row) => row.target === target), rng).forEach((row, index) => folds[index % 5].push(row)); return folds; }
function balance(training) { const groups = [training.filter((row) => row.target === 1), training.filter((row) => row.target === 0)]; const count = Math.max(...groups.map((group) => group.length)); return groups.flatMap((group) => Array.from({ length: count }, (_, index) => group[index % group.length])); }
function distribution(runs, key) { const values = runs.map((row) => row[key]).sort((a, b) => a - b); const at = (q) => values[Math.floor(q * (values.length - 1))]; return { minimum: values[0], p10: at(.1), median: at(.5), p90: at(.9), maximum: values.at(-1) }; }
function summarize(id, family, featureNames, configuration, assignments) {
  return thresholds.map((threshold) => {
    const runs = assignments.map(({ seed, predictions }) => ({ seed, ...metrics(predictions, threshold) }));
    return { id, family, feature_count: featureNames.length, configuration, threshold, assignments: runs.length, assignments_meeting_90_90: runs.filter((row) => row.precision >= .9 && row.recall >= .9).length, precision: distribution(runs, "precision"), recall: distribution(runs, "recall"), f1: distribution(runs, "f1"), runs };
  });
}

const results = [];
for (const [id, featureNames] of Object.entries(subsets)) {
  for (const l2 of [3, 10, 30, 100]) {
    const assignments = [];
    for (let seed = 1; seed <= 20; seed += 1) {
      const folds = foldsFor(seed);
      const predictions = [];
      for (let fold = 0; fold < folds.length; fold += 1) {
        const training = balance(folds.flatMap((items, index) => index === fold ? [] : items));
        const model = trainV03(training, featureNames, { l2, learning_rate: .05, iterations: 1200, threshold: .5 });
        predictions.push(...folds[fold].map((row) => ({ target: row.target, probability: scoreV03(model, row.features) })));
      }
      assignments.push({ seed, predictions });
    }
    results.push(...summarize(`${id}-l2-${l2}`, "logistic", featureNames, { l2 }, assignments));
  }
  process.stdout.write(`${id} logistic complete\n`);
}

const forestConfigs = [
  { id: "forest-core-d3", features: subsets.vibe_ui_core, trees: 180, max_depth: 3, min_leaf: 4, features_per_split: 8, thresholds_per_feature: 7 },
  { id: "forest-balanced-d4", features: subsets.surface_balanced, trees: 200, max_depth: 4, min_leaf: 4, features_per_split: 10, thresholds_per_feature: 8 },
  { id: "forest-all-d4", features: allFeatures, trees: 220, max_depth: 4, min_leaf: 5, features_per_split: 14, thresholds_per_feature: 8 }
];
for (const config of forestConfigs) {
  const assignments = [];
  for (let seed = 1; seed <= 20; seed += 1) {
    const folds = foldsFor(seed);
    const predictions = [];
    for (let fold = 0; fold < folds.length; fold += 1) {
      const training = balance(folds.flatMap((items, index) => index === fold ? [] : items));
      const model = trainForest(training, config.features, { ...config, seed: seed * 1009 + fold * 9176 });
      predictions.push(...folds[fold].map((row) => ({ target: row.target, probability: scoreForest(model, row.features) })));
    }
    assignments.push({ seed, predictions });
  }
  results.push(...summarize(config.id, "forest", config.features, Object.fromEntries(Object.entries(config).filter(([key]) => !["id", "features"].includes(key))), assignments));
  process.stdout.write(`${config.id} complete\n`);
}

results.sort((a, b) => b.assignments_meeting_90_90 - a.assignments_meeting_90_90 || Math.min(b.precision.minimum, b.recall.minimum) - Math.min(a.precision.minimum, a.recall.minimum) || Math.min(b.precision.p10, b.recall.p10) - Math.min(a.precision.p10, a.recall.p10));
const resultSummaries = results.map((result) => Object.fromEntries(Object.entries(result).filter(([key]) => key !== "runs")));
const output = { schema_version: "vibebench.option_b.model_research.v1", generated_at: new Date().toISOString(), purpose: "Development-only fixed semantic subsets and nonlinear research; no independent holdout.", rows: { total: rows.length, strong_ai: rows.filter((row) => row.target === 1).length, stable_human: rows.filter((row) => row.target === 0).length }, subsets, best: results[0], results: resultSummaries };
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
const best = { ...output.best }; delete best.runs;
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), rows: output.rows, best }, null, 2)}\n`);
