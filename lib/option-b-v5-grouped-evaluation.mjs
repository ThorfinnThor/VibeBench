const sigmoid = (value) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value))));

export const OPTION_B_V5_NESTED_PROTOCOL = Object.freeze({
  outer_seeds: [11, 29, 47, 71, 97],
  outer_folds: 5,
  inner_folds: 4,
  inner_seed_offset: 10_000,
  thresholds: [0.4, 0.45, 0.5, 0.55, 0.6],
  configurations: [
    { id: "logistic-l2-3-unweighted-k40", family: "logistic_l2", l1: 0, l2: 3, class_weight: "none", feature_limit: 40 },
    { id: "logistic-l2-10-balanced-k80", family: "logistic_l2", l1: 0, l2: 10, class_weight: "balanced", feature_limit: 80 },
    { id: "logistic-l2-30-balanced-all", family: "logistic_l2", l1: 0, l2: 30, class_weight: "balanced", feature_limit: null },
    { id: "elastic-1-balanced-k40", family: "logistic_elastic_net", l1: 0.01, l2: 3, class_weight: "balanced", feature_limit: 40 },
    { id: "elastic-3-unweighted-k80", family: "logistic_elastic_net", l1: 0.03, l2: 10, class_weight: "none", feature_limit: 80 },
    { id: "elastic-6-balanced-all", family: "logistic_elastic_net", l1: 0.06, l2: 30, class_weight: "balanced", feature_limit: null }
  ],
  iterations: 300,
  learning_rate: 0.05,
  abstention_margin: 0.08,
  minimum_selective_coverage: 0.8,
  reliability_bins: [0, 0.2, 0.4, 0.6, 0.8, 1],
  minimum_subgroup_rows: 10
});

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

export function groupedFoldsFor(rows, seed, foldCount = 5) {
  if (!Number.isInteger(foldCount) || foldCount < 2) throw new Error("Grouped evaluation requires at least two folds.");
  const grouped = new Map();
  for (const row of rows) {
    if (!row.target_group) throw new Error(`Missing target_group for ${row.sample_id || "row"}.`);
    if (!grouped.has(row.target_group)) grouped.set(row.target_group, []);
    grouped.get(row.target_group).push(row);
  }
  const groups = [...grouped.entries()].map(([id, members]) => {
    const targets = new Set(members.map(({ target }) => target));
    if (targets.size !== 1 || ![0, 1].includes(members[0].target)) throw new Error(`Mixed or invalid target group: ${id}`);
    return { id, target: members[0].target, rows: members };
  });
  for (const target of [0, 1]) if (groups.filter((group) => group.target === target).length < foldCount) throw new Error(`Class ${target} has fewer target groups than folds.`);
  const rng = random(seed);
  const folds = Array.from({ length: foldCount }, (_, index) => ({ index, rows: [], classCounts: { 0: 0, 1: 0 } }));
  for (const target of [0, 1]) {
    const targetGroups = shuffle(groups.filter((group) => group.target === target), rng).sort((left, right) => right.rows.length - left.rows.length);
    for (const group of targetGroups) {
      const destination = [...folds].sort((left, right) =>
        left.classCounts[target] - right.classCounts[target] || left.rows.length - right.rows.length || left.index - right.index
      )[0];
      destination.rows.push(...group.rows);
      destination.classCounts[target] += group.rows.length;
    }
  }
  const result = folds.map(({ rows: foldRows }) => foldRows);
  assertNoGroupLeakage(result);
  return result;
}

export function assertNoGroupLeakage(folds) {
  for (let testIndex = 0; testIndex < folds.length; testIndex += 1) {
    const testGroups = new Set(folds[testIndex].map(({ target_group }) => target_group));
    const trainingGroups = new Set(folds.flatMap((fold, index) => index === testIndex ? [] : fold).map(({ target_group }) => target_group));
    for (const group of testGroups) if (trainingGroups.has(group)) throw new Error(`Group leakage detected: ${group}`);
  }
  return true;
}

export function selectFeaturesInsideTraining(rows, featureNames, limit) {
  const ranked = featureNames.map((name) => {
    const values = rows.map(({ features }) => Number(features[name]));
    if (values.some((value) => !Number.isFinite(value))) throw new Error(`Invalid training feature ${name}.`);
    const average = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
    const variance = values.reduce((sum, value) => sum + ((value - average) ** 2), 0) / Math.max(1, values.length);
    return { name, variance };
  }).sort((left, right) => right.variance - left.variance || left.name.localeCompare(right.name));
  return ranked.slice(0, limit === null ? ranked.length : Math.min(limit, ranked.length)).map(({ name }) => name);
}

function classWeights(rows, mode) {
  if (mode !== "balanced") return { 0: 1, 1: 1 };
  const counts = { 0: rows.filter(({ target }) => target === 0).length, 1: rows.filter(({ target }) => target === 1).length };
  return { 0: rows.length / Math.max(1, 2 * counts[0]), 1: rows.length / Math.max(1, 2 * counts[1]) };
}

export function trainOptionBV5Logistic(rows, featureNames, configuration, training = OPTION_B_V5_NESTED_PROTOCOL) {
  if (!rows.length || rows.every(({ target }) => target === rows[0].target)) throw new Error("Logistic training requires both classes.");
  const statistics = featureNames.map((name) => {
    const values = rows.map(({ features }) => Number(features[name]));
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const standardDeviation = Math.sqrt(values.reduce((sum, value) => sum + ((value - average) ** 2), 0) / values.length) || 1;
    return { name, mean: average, standard_deviation: standardDeviation };
  });
  const vectors = rows.map(({ features }) => [1, ...statistics.map(({ name, mean: average, standard_deviation: deviation }) => (features[name] - average) / deviation)]);
  const weights = new Array(featureNames.length + 1).fill(0);
  const sampleWeights = classWeights(rows, configuration.class_weight);
  for (let iteration = 0; iteration < training.iterations; iteration += 1) {
    const gradient = new Array(weights.length).fill(0);
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      let linear = 0;
      for (let column = 0; column < weights.length; column += 1) linear += weights[column] * vectors[rowIndex][column];
      const error = (sigmoid(linear) - rows[rowIndex].target) * sampleWeights[rows[rowIndex].target];
      for (let column = 0; column < weights.length; column += 1) gradient[column] += error * vectors[rowIndex][column];
    }
    for (let column = 0; column < weights.length; column += 1) {
      if (column) gradient[column] += configuration.l2 * weights[column] + configuration.l1 * Math.sign(weights[column]);
      weights[column] -= training.learning_rate * gradient[column] / rows.length;
    }
  }
  return {
    family: configuration.family,
    configuration,
    feature_names: featureNames,
    intercept: weights[0],
    coefficients: Object.fromEntries(featureNames.map((name, index) => [name, weights[index + 1]])),
    standardization: Object.fromEntries(statistics.map(({ name, mean: average, standard_deviation }) => [name, { mean: average, standard_deviation }]))
  };
}

export function scoreOptionBV5Logistic(model, features) {
  let value = model.intercept;
  for (const name of model.feature_names) {
    const statistics = model.standardization[name];
    value += model.coefficients[name] * ((features[name] - statistics.mean) / statistics.standard_deviation);
  }
  return sigmoid(value);
}

export function classificationMetrics(predictions, threshold) {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (const row of predictions) {
    const positive = row.probability >= threshold;
    if (row.target === 1 && positive) tp += 1;
    else if (row.target === 1) fn += 1;
    else if (positive) fp += 1;
    else tn += 1;
  }
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  const specificity = tn + fp ? tn / (tn + fp) : 0;
  return { tp, fp, tn, fn, precision, recall, specificity, accuracy: predictions.length ? (tp + tn) / predictions.length : 0, f1: precision + recall ? 2 * precision * recall / (precision + recall) : 0 };
}

export function probabilisticMetrics(predictions, reliabilityBins = OPTION_B_V5_NESTED_PROTOCOL.reliability_bins) {
  const clipped = predictions.map((row) => ({ ...row, probability: Math.max(1e-9, Math.min(1 - 1e-9, row.probability)) }));
  const positives = clipped.filter(({ target }) => target === 1);
  const negatives = clipped.filter(({ target }) => target === 0);
  const brier = clipped.reduce((sum, row) => sum + ((row.probability - row.target) ** 2), 0) / Math.max(1, clipped.length);
  const logLoss = -clipped.reduce((sum, row) => sum + row.target * Math.log(row.probability) + (1 - row.target) * Math.log(1 - row.probability), 0) / Math.max(1, clipped.length);
  let pairScore = 0;
  for (const positive of positives) for (const negative of negatives) pairScore += positive.probability > negative.probability ? 1 : positive.probability === negative.probability ? 0.5 : 0;
  const rocAuc = positives.length && negatives.length ? pairScore / (positives.length * negatives.length) : 0;
  const ranked = [...clipped].sort((left, right) => right.probability - left.probability);
  let seenPositive = 0;
  let precisionSum = 0;
  ranked.forEach((row, index) => { if (row.target === 1) { seenPositive += 1; precisionSum += seenPositive / (index + 1); } });
  const averagePrecision = positives.length ? precisionSum / positives.length : 0;
  const bins = reliabilityBins.slice(0, -1).map((lower, index) => {
    const upper = reliabilityBins[index + 1];
    const members = clipped.filter(({ probability }) => probability >= lower && (index === reliabilityBins.length - 2 ? probability <= upper : probability < upper));
    const meanScore = members.length ? members.reduce((sum, row) => sum + row.probability, 0) / members.length : null;
    const observed = members.length ? members.reduce((sum, row) => sum + row.target, 0) / members.length : null;
    return { lower, upper, count: members.length, mean_score: meanScore, observed_positive_rate: observed };
  });
  const expectedCalibrationError = bins.reduce((sum, bin) => sum + (bin.count / Math.max(1, clipped.length)) * (bin.count ? Math.abs(bin.mean_score - bin.observed_positive_rate) : 0), 0);
  return { roc_auc: rocAuc, average_precision: averagePrecision, brier, log_loss: logLoss, expected_calibration_error: expectedCalibrationError };
}

export function selectiveMetrics(predictions, threshold, margin) {
  const lower = Math.max(0, threshold - margin);
  const upper = Math.min(1, threshold + margin);
  const decided = predictions.filter(({ probability }) => probability < lower || probability > upper);
  const classified = decided.map((row) => ({ ...row, probability: row.probability > upper ? 1 : 0 }));
  const decidedMetrics = classificationMetrics(classified, 0.5);
  const positiveTotal = predictions.filter(({ target }) => target === 1).length;
  const decidedTruePositives = classified.filter(({ target, probability }) => target === 1 && probability === 1).length;
  return {
    lower, upper,
    coverage: predictions.length ? decided.length / predictions.length : 0,
    abstention_rate: predictions.length ? 1 - (decided.length / predictions.length) : 0,
    decided_rows: decided.length,
    decided_precision: decidedMetrics.precision,
    decided_recall: decidedMetrics.recall,
    decided_specificity: decidedMetrics.specificity,
    decided_f1: decidedMetrics.f1,
    overall_positive_recall_with_abstentions_unresolved: positiveTotal ? decidedTruePositives / positiveTotal : 0
  };
}

function innerSelection(rows, featureNames, outerSeed, outerFold, protocol) {
  const innerFolds = groupedFoldsFor(rows, protocol.inner_seed_offset + outerSeed * 31 + outerFold, protocol.inner_folds);
  const candidates = [];
  for (const configuration of protocol.configurations) {
    const predictions = [];
    for (let fold = 0; fold < innerFolds.length; fold += 1) {
      const validation = innerFolds[fold];
      const trainingRows = innerFolds.flatMap((items, index) => index === fold ? [] : items);
      const selectedFeatures = selectFeaturesInsideTraining(trainingRows, featureNames, configuration.feature_limit);
      const model = trainOptionBV5Logistic(trainingRows, selectedFeatures, configuration, protocol);
      predictions.push(...validation.map((row) => ({ sample_id: row.sample_id, target: row.target, probability: scoreOptionBV5Logistic(model, row.features) })));
    }
    for (const threshold of protocol.thresholds) {
      const binary = classificationMetrics(predictions, threshold);
      const selective = selectiveMetrics(predictions, threshold, protocol.abstention_margin);
      candidates.push({ configuration, threshold, binary, selective });
    }
  }
  candidates.sort((left, right) =>
    Math.min(right.binary.precision, right.binary.recall) - Math.min(left.binary.precision, left.binary.recall) ||
    right.binary.f1 - left.binary.f1 ||
    Number(right.selective.coverage >= protocol.minimum_selective_coverage) - Number(left.selective.coverage >= protocol.minimum_selective_coverage) ||
    right.selective.coverage - left.selective.coverage ||
    (left.configuration.feature_limit ?? featureNames.length) - (right.configuration.feature_limit ?? featureNames.length) ||
    left.configuration.id.localeCompare(right.configuration.id) || left.threshold - right.threshold
  );
  return candidates[0];
}

function distribution(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const at = (q) => sorted[Math.floor(q * (sorted.length - 1))];
  return { minimum: sorted[0], p10: at(0.1), median: at(0.5), p90: at(0.9), maximum: sorted.at(-1), mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length };
}

export function nestedGroupedEvaluation(rows, featureNames, overrides = {}) {
  const protocol = { ...OPTION_B_V5_NESTED_PROTOCOL, ...overrides };
  const outerResults = [];
  const selectionAudit = [];
  for (const outerSeed of protocol.outer_seeds) {
    const outerFolds = groupedFoldsFor(rows, outerSeed, protocol.outer_folds);
    for (let outerFold = 0; outerFold < outerFolds.length; outerFold += 1) {
      const testRows = outerFolds[outerFold];
      const trainRows = outerFolds.flatMap((fold, index) => index === outerFold ? [] : fold);
      const selected = innerSelection(trainRows, featureNames, outerSeed, outerFold, protocol);
      const selectedFeatures = selectFeaturesInsideTraining(trainRows, featureNames, selected.configuration.feature_limit);
      const model = trainOptionBV5Logistic(trainRows, selectedFeatures, selected.configuration, protocol);
      const predictions = testRows.map((row) => {
        const probability = scoreOptionBV5Logistic(model, row.features);
        return { sample_id: row.sample_id, target: row.target, target_group: row.target_group, cohort: row.cohort, builder_group: row.builder_group, probability, selected_threshold: selected.threshold, decision: probability >= selected.threshold ? 1 : 0 };
      });
      const binary = classificationMetrics(predictions, selected.threshold);
      const probabilistic = probabilisticMetrics(predictions, protocol.reliability_bins);
      const selective = selectiveMetrics(predictions, selected.threshold, protocol.abstention_margin);
      outerResults.push({ outer_seed: outerSeed, outer_fold: outerFold, rows: predictions.length, ...binary, ...probabilistic, selective, predictions });
      selectionAudit.push({
        outer_seed: outerSeed,
        outer_fold: outerFold,
        train_groups: [...new Set(trainRows.map(({ target_group }) => target_group))].sort(),
        test_groups: [...new Set(testRows.map(({ target_group }) => target_group))].sort(),
        selected_by_inner_cv: { model: selected.configuration.family, configuration_id: selected.configuration.id, l1: selected.configuration.l1, l2: selected.configuration.l2, class_weight: selected.configuration.class_weight, feature_limit: selected.configuration.feature_limit, selected_feature_count: selectedFeatures.length, threshold: selected.threshold, feature_contract: "v2" }
      });
    }
  }
  const metricNames = ["precision", "recall", "specificity", "f1", "accuracy", "roc_auc", "average_precision", "brier", "log_loss", "expected_calibration_error"];
  const metrics = Object.fromEntries(metricNames.map((name) => [name, distribution(outerResults.map((row) => row[name]))]));
  const allPredictions = outerResults.flatMap(({ predictions }) => predictions);
  const subgroup = {};
  for (const field of ["cohort", "builder_group"]) {
    subgroup[field] = {};
    for (const value of [...new Set(allPredictions.map((row) => row[field]).filter(Boolean))].sort()) {
      const members = allPredictions.filter((row) => row[field] === value);
      if (members.length < protocol.minimum_subgroup_rows) continue;
      subgroup[field][value] = { rows: members.length, ...classificationMetrics(members.map((row) => ({ ...row, probability: row.decision })), 0.5), ...probabilisticMetrics(members, protocol.reliability_bins) };
    }
  }
  const developmentGate = metrics.precision.p10 >= 0.9 && metrics.recall.p10 >= 0.9 && metrics.precision.median >= 0.92 && metrics.recall.median >= 0.92;
  return {
    protocol,
    metrics,
    selective: Object.fromEntries(["coverage", "abstention_rate", "decided_precision", "decided_recall", "overall_positive_recall_with_abstentions_unresolved"].map((name) => [name, distribution(outerResults.map((row) => row.selective[name]))])),
    subgroup,
    development_gate_passed: developmentGate,
    candidate_freeze_authorized: false,
    candidate_freeze_reason: developmentGate ? "Separate explicit candidate-freeze step still required." : "Grouped Development performance gate not met.",
    selection_audit: selectionAudit,
    outer_results: outerResults.map((row) => Object.fromEntries(Object.entries(row).filter(([name]) => name !== "predictions")))
  };
}
