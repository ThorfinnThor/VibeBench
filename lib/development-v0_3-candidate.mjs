import { STACK_FEATURES, METRIC_FEATURES } from "./development-v0_2-candidate.mjs";

export const EXTENDED_METRICS = [
  "html_bytes", "visible_text_chars", "visible_words", "unique_visible_words",
  "paragraphs", "sections", "anchors", "navs", "footers", "dialogs", "tables",
  "code_blocks", "canvases", "videos", "meta_tags", "jsonld_scripts", "comments",
  "id_attributes", "role_attributes", "alt_attributes", "custom_elements",
  "tailwind_like_tokens", "arbitrary_class_tokens", "css_variables", "gradients",
  "keyframes", "external_host_count", "shadcn_variable_coverage", "data_slot_attributes",
  "radix_fingerprints", "lucide_fingerprints", "cva_fingerprints", "tailwind_merge_fingerprints",
  "next_themes_fingerprints", "sonner_fingerprints", "cmdk_fingerprints", "recharts_fingerprints",
  "embla_fingerprints", "tanstack_fingerprints", "react_hook_form_fingerprints", "zod_fingerprints",
  "framer_motion_fingerprints", "ui_cliche_tokens", "vite_fingerprints", "next_fingerprints"
];

export const ARTIFACT_FEATURES = [
  "artifact:any_direct", "artifact:lovable_direct", "artifact:bolt_direct", "artifact:v0_direct",
  "artifact:replit_direct", "context:lovable_hosting", "context:replit_hosting",
  "context:replit_runtime", "context:stackblitz_webcontainer", "header:vercel",
  "header:netlify", "header:replit", "header:cloudflare", "hint:count"
];

export const RATIO_FEATURES = [
  "ratio:unique_class_tokens", "ratio:visible_words_per_dom", "ratio:aria_per_dom",
  "ratio:tailwind_per_class", "ratio:asset_fetch_success", "ratio:text_bytes_per_html"
];

export const BASE_FEATURES = [
  ...STACK_FEATURES.map((name) => `stack:${name}`),
  ...METRIC_FEATURES.map((name) => `metric:${name}`)
];
export const STRUCTURE_FEATURES = [
  ...BASE_FEATURES,
  ...EXTENDED_METRICS.map((name) => `extended:${name}`),
  ...RATIO_FEATURES
];
export const ALL_FEATURES = [...STRUCTURE_FEATURES, ...ARTIFACT_FEATURES];

function ratio(numerator, denominator) {
  return Number(numerator || 0) / Math.max(1, Number(denominator || 0));
}

export function buildV03FeatureMap(row) {
  const features = {};
  for (const name of STACK_FEATURES) features[`stack:${name}`] = row.stack_signals.includes(name) ? 1 : 0;
  for (const name of METRIC_FEATURES) features[`metric:${name}`] = Math.log1p(Number(row.page_metrics[name] || 0));
  for (const name of EXTENDED_METRICS) features[`extended:${name}`] = Math.log1p(Number(row.extended_metrics[name] || 0));
  const p = row.page_metrics;
  const e = row.extended_metrics;
  features["ratio:unique_class_tokens"] = ratio(p.unique_class_tokens, p.class_tokens);
  features["ratio:visible_words_per_dom"] = ratio(e.visible_words, p.dom_tags);
  features["ratio:aria_per_dom"] = ratio(p.aria_attributes, p.dom_tags);
  features["ratio:tailwind_per_class"] = ratio(e.tailwind_like_tokens, p.class_tokens);
  features["ratio:asset_fetch_success"] = ratio(row.asset_scan.fetched, row.asset_scan.requested);
  features["ratio:text_bytes_per_html"] = ratio(e.visible_text_chars, e.html_bytes);
  const directLabels = new Set(row.direct_evidence.map((item) => item.label));
  const contextLabels = new Set(row.context_evidence.map((item) => item.label));
  const headerLabels = new Set(row.header_evidence.map((item) => item.label));
  features["artifact:any_direct"] = directLabels.size ? 1 : 0;
  features["artifact:lovable_direct"] = directLabels.has("Lovable") ? 1 : 0;
  features["artifact:bolt_direct"] = directLabels.has("Bolt") ? 1 : 0;
  features["artifact:v0_direct"] = directLabels.has("v0") ? 1 : 0;
  features["artifact:replit_direct"] = directLabels.has("Replit Agent") ? 1 : 0;
  features["context:lovable_hosting"] = contextLabels.has("Lovable hosting") ? 1 : 0;
  features["context:replit_hosting"] = contextLabels.has("Replit hosting") ? 1 : 0;
  features["context:replit_runtime"] = contextLabels.has("Replit runtime") ? 1 : 0;
  features["context:stackblitz_webcontainer"] = contextLabels.has("StackBlitz/WebContainer") ? 1 : 0;
  features["header:vercel"] = headerLabels.has("Vercel response") ? 1 : 0;
  features["header:netlify"] = headerLabels.has("Netlify response") ? 1 : 0;
  features["header:replit"] = headerLabels.has("Replit response") ? 1 : 0;
  features["header:cloudflare"] = headerLabels.has("Cloudflare edge") ? 1 : 0;
  features["hint:count"] = Math.log1p(row.structural_hints.length);
  for (const name of ALL_FEATURES) if (!Number.isFinite(features[name])) throw new Error(`Invalid feature ${name} for ${row.sample_id}.`);
  return features;
}

const sigmoid = (value) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value))));

export function trainV03(rows, featureNames, options) {
  const statistics = featureNames.map((name) => {
    const values = rows.map((row) => row.features[name]);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const standardDeviation = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length) || 1;
    return { name, mean, standard_deviation: standardDeviation };
  });
  const vectors = rows.map((row) => [1, ...statistics.map((stat) => (row.features[stat.name] - stat.mean) / stat.standard_deviation)]);
  const weights = new Array(featureNames.length + 1).fill(0);
  for (let iteration = 0; iteration < options.iterations; iteration += 1) {
    const gradient = new Array(weights.length).fill(0);
    for (let index = 0; index < rows.length; index += 1) {
      let linear = 0;
      for (let column = 0; column < weights.length; column += 1) linear += weights[column] * vectors[index][column];
      const error = sigmoid(linear) - rows[index].target;
      for (let column = 0; column < weights.length; column += 1) gradient[column] += error * vectors[index][column];
    }
    for (let column = 0; column < weights.length; column += 1) {
      if (column) gradient[column] += options.l2 * weights[column];
      weights[column] -= options.learning_rate * gradient[column] / rows.length;
    }
  }
  return {
    schema_version: "v0.3-development-logistic-candidate",
    feature_names: featureNames,
    training: options,
    intercept: weights[0],
    coefficients: Object.fromEntries(featureNames.map((name, index) => [name, weights[index + 1]])),
    standardization: Object.fromEntries(statistics.map((stat) => [stat.name, { mean: stat.mean, standard_deviation: stat.standard_deviation }]))
  };
}

export function scoreV03(model, features) {
  let value = model.intercept;
  for (const name of model.feature_names) {
    const stat = model.standardization[name];
    value += model.coefficients[name] * ((features[name] - stat.mean) / stat.standard_deviation);
  }
  return sigmoid(value);
}

export function metrics(predictions, threshold) {
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
  return { tp, fp, tn, fn, precision, recall, specificity: tn / (tn + fp), accuracy: (tp + tn) / predictions.length, f1: precision + recall ? 2 * precision * recall / (precision + recall) : 0 };
}
