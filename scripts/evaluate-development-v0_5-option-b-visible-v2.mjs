import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { metrics, scoreV03, trainV03 } from "../lib/development-v0_3-candidate.mjs";
import { buildOptionBVisibleFeatures, OPTION_B_SOURCE_FEATURES } from "../lib/option-b-visible-feature-contract-v2.mjs";

const matrixPath = path.resolve("outputs/development_v0_5_option_b/option_b_visible_feature_matrix_v2.json");
const sourcePath = path.resolve("outputs/development_v0_5_option_b/option_b_browser_surface_matrix_v1.json");
const outputPath = path.resolve("outputs/development_v0_5_option_b/option_b_visible_evaluation_v2.json");
const [matrixText, sourceText] = await Promise.all([readFile(matrixPath, "utf8"), readFile(sourcePath, "utf8")]);
const matrix = JSON.parse(matrixText);
const source = JSON.parse(sourceText);
const rows = matrix.rows;
const sourceById = new Map(source.rows.filter((row) => row.ok).map((row) => [row.sample_id, row]));

if (matrix.research_status !== "FEATURE_CONTRACT_FROZEN_BEFORE_V2_EVALUATION") throw new Error("Option-B v2 feature contract is not frozen.");
if (rows.length !== 81 || rows.filter((row) => row.target === 1).length !== 28 || rows.filter((row) => row.target === 0).length !== 53) throw new Error("Unexpected Option-B v2 matrix.");
if (rows.some((row) => !sourceById.has(row.sample_id))) throw new Error("Option-B source row mismatch.");

const protocol = {
  assignments: 20,
  folds: 5,
  split: "deterministic class-stratified",
  training_balance: "deterministic minority oversampling inside each training fold only",
  model: "logistic",
  l2: 10,
  learning_rate: .05,
  iterations: 1200,
  threshold: .5,
  indeterminate_range_inclusive: [.38, .62],
  reliability_bins: [0, .2, .4, .6, .8, 1],
  qualitative_band_boundaries: [.25, .5, .7, .85],
  count_perturbation: "two deterministic inverse jitters of each non-binary source count, each within ±5%"
};

function random(seed) {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296);
}
function shuffle(values, rng) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
function foldsFor(seed) {
  const rng = random(seed);
  const folds = Array.from({ length: protocol.folds }, () => []);
  for (const target of [0, 1]) shuffle(rows.filter((row) => row.target === target), rng).forEach((row, index) => folds[index % protocol.folds].push(row));
  return folds;
}
function balance(training) {
  const groups = [training.filter((row) => row.target === 1), training.filter((row) => row.target === 0)];
  const count = Math.max(...groups.map((group) => group.length));
  return groups.flatMap((group) => Array.from({ length: count }, (_, index) => group[index % group.length]));
}
function quantile(sorted, q) {
  return sorted[Math.floor(q * (sorted.length - 1))];
}
function distributionValues(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return { minimum: sorted[0], p10: quantile(sorted, .1), median: quantile(sorted, .5), p90: quantile(sorted, .9), maximum: sorted.at(-1), mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length };
}
function distribution(runs, key) {
  return distributionValues(runs.map((row) => row[key]));
}
function probabilisticMetrics(predictions) {
  const clipped = predictions.map((row) => ({ ...row, probability: Math.max(1e-9, Math.min(1 - 1e-9, row.probability)) }));
  const brier = clipped.reduce((sum, row) => sum + (row.probability - row.target) ** 2, 0) / clipped.length;
  const logLoss = -clipped.reduce((sum, row) => sum + row.target * Math.log(row.probability) + (1 - row.target) * Math.log(1 - row.probability), 0) / clipped.length;
  const positives = clipped.filter((row) => row.target === 1);
  const negatives = clipped.filter((row) => row.target === 0);
  let pairScore = 0;
  for (const positive of positives) for (const negative of negatives) pairScore += positive.probability > negative.probability ? 1 : positive.probability === negative.probability ? .5 : 0;
  const rocAuc = pairScore / (positives.length * negatives.length);
  const ranked = [...clipped].sort((a, b) => b.probability - a.probability);
  let seenPositive = 0;
  let precisionSum = 0;
  ranked.forEach((row, index) => {
    if (row.target === 1) {
      seenPositive += 1;
      precisionSum += seenPositive / (index + 1);
    }
  });
  const averagePrecision = precisionSum / positives.length;
  const bins = protocol.reliability_bins.slice(0, -1).map((lower, index) => {
    const upper = protocol.reliability_bins[index + 1];
    const members = clipped.filter((row) => row.probability >= lower && (index === protocol.reliability_bins.length - 2 ? row.probability <= upper : row.probability < upper));
    return {
      lower,
      upper,
      count: members.length,
      mean_score: members.length ? members.reduce((sum, row) => sum + row.probability, 0) / members.length : null,
      observed_positive_rate: members.length ? members.reduce((sum, row) => sum + row.target, 0) / members.length : null
    };
  });
  const expectedCalibrationError = bins.reduce((sum, bin) => sum + (bin.count / clipped.length) * (bin.count ? Math.abs(bin.mean_score - bin.observed_positive_rate) : 0), 0);
  return { brier, log_loss: logLoss, roc_auc: rocAuc, average_precision: averagePrecision, expected_calibration_error: expectedCalibrationError, reliability_bins: bins };
}
function selectiveMetrics(predictions) {
  const [lower, upper] = protocol.indeterminate_range_inclusive;
  const decided = predictions.filter((row) => row.probability < lower || row.probability > upper);
  const abstained = predictions.filter((row) => !decided.includes(row));
  const classified = decided.map((row) => ({ ...row, probability: row.probability > upper ? 1 : 0 }));
  const decidedMetrics = classified.length ? metrics(classified, .5) : { precision: 0, recall: 0, specificity: 0, accuracy: 0, f1: 0 };
  const positiveTotal = predictions.filter((row) => row.target === 1).length;
  const truePositiveDecisions = classified.filter((row) => row.target === 1 && row.probability === 1).length;
  return {
    coverage: decided.length / predictions.length,
    abstention_rate: abstained.length / predictions.length,
    decided_rows: decided.length,
    abstained_rows: abstained.length,
    decided_precision: decidedMetrics.precision,
    decided_recall: decidedMetrics.recall,
    decided_specificity: decidedMetrics.specificity,
    decided_accuracy: decidedMetrics.accuracy,
    decided_f1: decidedMetrics.f1,
    overall_positive_recall_with_abstentions_as_unresolved: truePositiveDecisions / positiveTotal
  };
}
function qualitativeBand(score) {
  return protocol.qualitative_band_boundaries.filter((boundary) => score >= boundary).length;
}

const binarySourceFeatures = new Set(["article", "canonical", "favicon", "main", "og", "twitter"]);
function perturbSourceFeatures(sourceFeatures, sampleId, seed, inverse = false) {
  const output = { ...sourceFeatures };
  for (const name of OPTION_B_SOURCE_FEATURES) {
    if (binarySourceFeatures.has(name)) continue;
    const byte = createHash("sha256").update(`${seed}:${sampleId}:${name}`).digest()[0];
    const signed = ((byte / 255) * .1 - .05) * (inverse ? -1 : 1);
    output[name] = Math.log1p(Math.max(0, Math.expm1(Number(sourceFeatures[name] || 0)) * (1 + signed)));
  }
  return output;
}

const assignmentResults = [];
const websitePredictions = new Map(rows.map((row) => [row.sample_id, []]));
const perturbationPairs = [];
const coefficientValues = new Map(matrix.feature_names.map((name) => [name, []]));
for (let seed = 1; seed <= protocol.assignments; seed += 1) {
  const folds = foldsFor(seed);
  const predictions = [];
  for (let fold = 0; fold < folds.length; fold += 1) {
    const training = balance(folds.flatMap((items, index) => index === fold ? [] : items));
    const model = trainV03(training, matrix.feature_names, protocol);
    for (const name of matrix.feature_names) coefficientValues.get(name).push(model.coefficients[name]);
    for (const row of folds[fold]) {
      const probability = scoreV03(model, row.features);
      const prediction = { sample_id: row.sample_id, target: row.target, cohort: row.cohort, probability };
      predictions.push(prediction);
      websitePredictions.get(row.sample_id).push(probability);
      const sourceRow = sourceById.get(row.sample_id);
      for (const inverse of [false, true]) {
        const perturbedFeatures = buildOptionBVisibleFeatures(perturbSourceFeatures(sourceRow.features, row.sample_id, seed, inverse));
        const perturbedProbability = scoreV03(model, perturbedFeatures);
        perturbationPairs.push({
          original: probability,
          perturbed: perturbedProbability,
          absolute_delta: Math.abs(perturbedProbability - probability),
          threshold_flip: (probability >= protocol.threshold) !== (perturbedProbability >= protocol.threshold),
          band_change: qualitativeBand(probability) !== qualitativeBand(perturbedProbability)
        });
      }
    }
  }
  const binary = metrics(predictions, protocol.threshold);
  const probabilistic = probabilisticMetrics(predictions);
  const selective = selectiveMetrics(predictions);
  const cohorts = Object.fromEntries(["existing", "expansion"].map((cohort) => [cohort, { ...metrics(predictions.filter((row) => row.cohort === cohort), protocol.threshold), rows: predictions.filter((row) => row.cohort === cohort).length }]));
  assignmentResults.push({ seed, ...binary, ...Object.fromEntries(Object.entries(probabilistic).filter(([key]) => key !== "reliability_bins")), selective, cohorts, reliability_bins: probabilistic.reliability_bins });
  process.stdout.write(`assignment ${seed}/${protocol.assignments} complete\n`);
}

const websiteRows = rows.map((row) => {
  const scores = websitePredictions.get(row.sample_id);
  const scoreDistribution = distributionValues(scores);
  return {
    sample_id: row.sample_id,
    target: row.target,
    cohort: row.cohort,
    mean_score: scoreDistribution.mean,
    median_score: scoreDistribution.median,
    score_standard_deviation: Math.sqrt(scores.reduce((sum, value) => sum + (value - scoreDistribution.mean) ** 2, 0) / scores.length),
    score_range: scoreDistribution.maximum - scoreDistribution.minimum,
    indeterminate: scoreDistribution.mean >= protocol.indeterminate_range_inclusive[0] && scoreDistribution.mean <= protocol.indeterminate_range_inclusive[1]
  };
});
const explanationFeatureStability = matrix.feature_names.map((name) => {
  const values = coefficientValues.get(name);
  const coefficient = distributionValues(values);
  const positiveRate = values.filter((value) => value > 0).length / values.length;
  const negativeRate = values.filter((value) => value < 0).length / values.length;
  return {
    feature: name,
    direction: coefficient.median > 0 ? "raises_orientation_score" : "lowers_orientation_score",
    sign_consistency: Math.max(positiveRate, negativeRate),
    stable_direction_across_p10_p90: coefficient.p10 > 0 || coefficient.p90 < 0,
    standardized_coefficient: coefficient
  };
}).sort((a, b) => Number(b.stable_direction_across_p10_p90) - Number(a.stable_direction_across_p10_p90) || b.sign_consistency - a.sign_consistency || Math.abs(b.standardized_coefficient.median) - Math.abs(a.standardized_coefficient.median));
const selectiveRuns = assignmentResults.map((row) => row.selective);
const cohortSummary = Object.fromEntries(["existing", "expansion"].map((cohort) => [cohort, {
  rows: assignmentResults[0].cohorts[cohort].rows,
  precision: distribution(assignmentResults.map((row) => row.cohorts[cohort]), "precision"),
  recall: distribution(assignmentResults.map((row) => row.cohorts[cohort]), "recall"),
  specificity: distribution(assignmentResults.map((row) => row.cohorts[cohort]), "specificity")
}]));

const output = {
  schema_version: "vibebench.option_b.visible_evaluation.v2",
  generated_at: new Date().toISOString(),
  status: "DEVELOPMENT_RESEARCH_ONLY",
  interpretation: "Scores measure similarity to this Development benchmark orientation. They are not calibrated authorship probabilities and are not independent validation.",
  inputs: {
    matrix: { path: path.relative(process.cwd(), matrixPath), sha256: createHash("sha256").update(matrixText).digest("hex") },
    frozen_source: { path: path.relative(process.cwd(), sourcePath), sha256: createHash("sha256").update(sourceText).digest("hex") }
  },
  rows: { technically_usable: 81, originally_attempted: source.summary.total, technical_failures: source.summary.errors, technical_yield: 81 / source.summary.total, strong_ai: 28, stable_human: 53 },
  protocol,
  repeated_development_metrics: {
    precision: distribution(assignmentResults, "precision"),
    recall: distribution(assignmentResults, "recall"),
    specificity: distribution(assignmentResults, "specificity"),
    f1: distribution(assignmentResults, "f1"),
    accuracy: distribution(assignmentResults, "accuracy"),
    roc_auc: distribution(assignmentResults, "roc_auc"),
    average_precision: distribution(assignmentResults, "average_precision"),
    brier: distribution(assignmentResults, "brier"),
    log_loss: distribution(assignmentResults, "log_loss"),
    expected_calibration_error: distribution(assignmentResults, "expected_calibration_error")
  },
  indeterminate_analysis: {
    range_inclusive: protocol.indeterminate_range_inclusive,
    coverage: distribution(selectiveRuns, "coverage"),
    abstention_rate: distribution(selectiveRuns, "abstention_rate"),
    decided_precision: distribution(selectiveRuns, "decided_precision"),
    decided_recall: distribution(selectiveRuns, "decided_recall"),
    decided_specificity: distribution(selectiveRuns, "decided_specificity"),
    overall_positive_recall_with_abstentions_as_unresolved: distribution(selectiveRuns, "overall_positive_recall_with_abstentions_as_unresolved"),
    websites_indeterminate_by_mean_score: websiteRows.filter((row) => row.indeterminate).length
  },
  perturbation_stability: {
    simulation_only: true,
    comparisons: perturbationPairs.length,
    absolute_score_delta: distributionValues(perturbationPairs.map((row) => row.absolute_delta)),
    threshold_flip_rate: perturbationPairs.filter((row) => row.threshold_flip).length / perturbationPairs.length,
    qualitative_band_change_rate: perturbationPairs.filter((row) => row.band_change).length / perturbationPairs.length
  },
  cohort_stability: cohortSummary,
  explanation_feature_stability: {
    models: protocol.assignments * protocol.folds,
    stable_direction_features: explanationFeatureStability.filter((row) => row.stable_direction_across_p10_p90).length,
    warning: "Coefficient direction stability supports benchmark explanations only; it does not establish causation or authorship.",
    features: explanationFeatureStability
  },
  website_score_stability: {
    standard_deviation: distributionValues(websiteRows.map((row) => row.score_standard_deviation)),
    range: distributionValues(websiteRows.map((row) => row.score_range))
  },
  website_rows: websiteRows,
  assignments: assignmentResults
};

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), rows: output.rows, metrics: output.repeated_development_metrics, indeterminate: output.indeterminate_analysis, perturbation: output.perturbation_stability, cohorts: output.cohort_stability }, null, 2)}\n`);
