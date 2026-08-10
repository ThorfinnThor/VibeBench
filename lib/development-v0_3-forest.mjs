function createRandom(seed) {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296);
}

function leaf(rows) {
  const probability = rows.reduce((sum, row) => sum + row.target, 0) / rows.length;
  return { probability, count: rows.length };
}

function impurity(rows) {
  if (!rows.length) return 0;
  const p = rows.reduce((sum, row) => sum + row.target, 0) / rows.length;
  return 2 * p * (1 - p);
}

function sampleFeatures(featureNames, count, random) {
  const selected = [];
  const available = [...featureNames];
  while (selected.length < Math.min(count, available.length)) {
    selected.push(available.splice(Math.floor(random() * available.length), 1)[0]);
  }
  return selected;
}

function buildTree(rows, featureNames, options, random, depth = 0) {
  const positives = rows.reduce((sum, row) => sum + row.target, 0);
  if (depth >= options.max_depth || rows.length < options.min_leaf * 2 || positives === 0 || positives === rows.length) return leaf(rows);
  let best = null;
  for (const feature of sampleFeatures(featureNames, options.features_per_split, random)) {
    const values = rows.map((row) => row.features[feature]);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    if (minimum === maximum) continue;
    const sorted = [...new Set(values)].sort((a, b) => a - b);
    const thresholds = [];
    for (let index = 1; index <= options.thresholds_per_feature; index += 1) {
      const position = Math.min(sorted.length - 1, Math.max(1, Math.floor(index * sorted.length / (options.thresholds_per_feature + 1))));
      const threshold = (sorted[position - 1] + sorted[position]) / 2;
      if (!thresholds.includes(threshold)) thresholds.push(threshold);
    }
    for (const threshold of thresholds) {
      const left = rows.filter((row) => row.features[feature] <= threshold);
      const right = rows.filter((row) => row.features[feature] > threshold);
      if (left.length < options.min_leaf || right.length < options.min_leaf) continue;
      const loss = (left.length * impurity(left) + right.length * impurity(right)) / rows.length;
      if (!best || loss < best.loss) best = { feature, threshold, left, right, loss };
    }
  }
  if (!best) return leaf(rows);
  return {
    feature: best.feature,
    threshold: best.threshold,
    count: rows.length,
    left: buildTree(best.left, featureNames, options, random, depth + 1),
    right: buildTree(best.right, featureNames, options, random, depth + 1)
  };
}

export function trainForest(rows, featureNames, options) {
  const random = createRandom(options.seed);
  const trees = [];
  for (let tree = 0; tree < options.trees; tree += 1) {
    const sample = Array.from({ length: rows.length }, () => rows[Math.floor(random() * rows.length)]);
    trees.push(buildTree(sample, featureNames, options, random));
  }
  return { schema_version: "v0.3-development-extra-random-forest", feature_names: featureNames, training: options, trees };
}

function scoreTree(tree, features) {
  let node = tree;
  while (node.probability === undefined) node = features[node.feature] <= node.threshold ? node.left : node.right;
  return node.probability;
}

export function scoreForest(model, features) {
  return model.trees.reduce((sum, tree) => sum + scoreTree(tree, features), 0) / model.trees.length;
}
