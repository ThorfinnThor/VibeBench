export const STACK_FEATURES = [
  "Next.js",
  "React",
  "Vite",
  "Tailwind CSS",
  "Framer Motion",
  "Radix UI",
  "Lucide",
  "Supabase",
  "Firebase"
];

export const METRIC_FEATURES = [
  "script_tags",
  "module_scripts",
  "stylesheet_links",
  "preload_links",
  "inline_styles",
  "inline_script_bytes",
  "data_attributes",
  "aria_attributes",
  "class_attributes",
  "class_tokens",
  "unique_class_tokens",
  "dom_tags",
  "forms",
  "inputs",
  "buttons",
  "headings",
  "images",
  "svgs",
  "same_origin_scripts_requested",
  "same_origin_styles_requested",
  "same_origin_scripts_fetched",
  "same_origin_styles_fetched",
  "asset_bytes_fetched"
];

export const FEATURE_NAMES = [
  ...STACK_FEATURES.map((name) => `stack:${name}`),
  ...METRIC_FEATURES.map((name) => `metric:${name}`)
];

export const CANDIDATE_TRAINING = Object.freeze({
  l2: 10,
  learning_rate: 0.04,
  iterations: 4000,
  threshold: 0.5
});

export function buildPortableFeatureMap({ stackSignals = [], pageMetrics = {} }) {
  const features = {};
  for (const name of STACK_FEATURES) features[`stack:${name}`] = stackSignals.includes(name) ? 1 : 0;
  for (const name of METRIC_FEATURES) {
    const value = Number(pageMetrics[name] || 0);
    if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid metric ${name}: ${pageMetrics[name]}`);
    features[`metric:${name}`] = Math.log1p(value);
  }
  return features;
}

function sigmoid(value) {
  return 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value))));
}

export function trainCandidate(rows, options = CANDIDATE_TRAINING) {
  if (!rows.length) throw new Error("Cannot train without rows.");
  const statistics = FEATURE_NAMES.map((name) => {
    const values = rows.map((row) => Number(row.features[name]));
    if (values.some((value) => !Number.isFinite(value))) throw new Error(`Missing or invalid feature ${name}.`);
    const mean = values.reduce((total, value) => total + value, 0) / values.length;
    const standardDeviation = Math.sqrt(values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length) || 1;
    return { name, mean, standard_deviation: standardDeviation };
  });
  const vectors = rows.map((row) => [1, ...statistics.map((stat) => (row.features[stat.name] - stat.mean) / stat.standard_deviation)]);
  const weights = new Array(FEATURE_NAMES.length + 1).fill(0);
  for (let iteration = 0; iteration < options.iterations; iteration += 1) {
    const gradient = new Array(weights.length).fill(0);
    for (let index = 0; index < rows.length; index += 1) {
      const probability = sigmoid(weights.reduce((total, weight, column) => total + weight * vectors[index][column], 0));
      for (let column = 0; column < weights.length; column += 1) {
        gradient[column] += (probability - rows[index].target) * vectors[index][column];
      }
    }
    for (let column = 0; column < weights.length; column += 1) {
      if (column > 0) gradient[column] += options.l2 * weights[column];
      weights[column] -= options.learning_rate * gradient[column] / rows.length;
    }
  }
  return {
    schema_version: "v0.2-development-logistic-candidate",
    feature_names: FEATURE_NAMES,
    training: { ...options },
    intercept: weights[0],
    coefficients: Object.fromEntries(FEATURE_NAMES.map((name, index) => [name, weights[index + 1]])),
    standardization: Object.fromEntries(statistics.map((stat) => [stat.name, { mean: stat.mean, standard_deviation: stat.standard_deviation }]))
  };
}

export function scoreCandidate(model, features) {
  let value = model.intercept;
  for (const name of model.feature_names) {
    const stat = model.standardization[name];
    value += model.coefficients[name] * ((features[name] - stat.mean) / stat.standard_deviation);
  }
  return sigmoid(value);
}

export function classificationMetrics(predictions, threshold = CANDIDATE_TRAINING.threshold) {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  for (const row of predictions) {
    const positive = row.probability >= threshold;
    if (row.target === 1 && positive) tp += 1;
    else if (row.target === 1) fn += 1;
    else if (positive) fp += 1;
    else tn += 1;
  }
  const precision = tp + fp ? tp / (tp + fp) : null;
  const recall = tp + fn ? tp / (tp + fn) : null;
  return {
    tp,
    fp,
    tn,
    fn,
    accuracy: (tp + tn) / predictions.length,
    precision,
    recall,
    specificity: tn / (tn + fp),
    f1: precision === null || recall === null || precision + recall === 0 ? null : 2 * precision * recall / (precision + recall)
  };
}

export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296);
}

export function shuffled(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
