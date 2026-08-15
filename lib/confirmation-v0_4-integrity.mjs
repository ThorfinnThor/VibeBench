const unique = (values, label) => {
  const set = new Set(values);
  if (set.size !== values.length) throw new Error(`Duplicate ${label}.`);
  return set;
};

const sameSet = (left, right) => left.size === right.size && [...left].every((value) => right.has(value));
const divide = (a, b) => b ? a / b : null;

export function evaluateConfirmationIntegrity({ manifest, raw, model, expectedTotal = 100 }) {
  if (manifest.samples?.length !== expectedTotal || raw.results?.length !== expectedTotal || raw.total !== expectedTotal || raw.labels_used_by_runner !== false) {
    throw new Error("Incomplete or non-blind confirmation results.");
  }
  if (!Number.isFinite(model?.training?.threshold) || model.training.threshold < 0 || model.training.threshold > 1) throw new Error("Invalid frozen model threshold.");

  const manifestIds = unique(manifest.samples.map((row) => row.sample_id), "manifest sample IDs");
  const resultIds = unique(raw.results.map((row) => row.sample_id), "result sample IDs");
  if (!sameSet(manifestIds, resultIds)) throw new Error("Manifest and result sample ID sets differ.");
  if (manifest.samples.some((row) => !["AI", "HUMAN"].includes(row.label))) throw new Error("Invalid confirmation label.");
  const ai = manifest.samples.filter((row) => row.label === "AI").length;
  const human = manifest.samples.filter((row) => row.label === "HUMAN").length;
  if (ai !== expectedTotal / 2 || human !== expectedTotal / 2) throw new Error("Unexpected confirmation class balance.");

  const labels = new Map(manifest.samples.map((row) => [row.sample_id, row.label]));
  let tp = 0, fp = 0, tn = 0, fn = 0;
  const rows = raw.results.map((row) => {
    const label = labels.get(row.sample_id);
    if (row.ok) {
      if (!Number.isFinite(row.probability) || row.probability < 0 || row.probability > 1) throw new Error(`Invalid probability for ${row.sample_id}.`);
      if (typeof row.predicted_positive !== "boolean") throw new Error(`Invalid stored classification for ${row.sample_id}.`);
      const recomputed = row.probability >= model.training.threshold;
      if (row.predicted_positive !== recomputed) throw new Error(`Stored classification disagrees with probability for ${row.sample_id}.`);
      if (label === "AI" && recomputed) tp++;
      else if (label === "AI") fn++;
      else if (recomputed) fp++;
      else tn++;
    }
    return {
      sample_id: row.sample_id,
      label,
      technical_outcome: row.ok ? "success" : "technical_error",
      probability: row.ok ? row.probability : null,
      predicted_positive: row.ok ? row.predicted_positive : null,
      capture_complete: row.capture_complete === true ? true : null
    };
  });
  const successful = raw.results.filter((row) => row.ok).length;
  const technicalErrors = expectedTotal - successful;
  if (raw.successful !== successful || raw.technical_errors !== technicalErrors) throw new Error("Stored technical totals disagree with result rows.");

  const precision = divide(tp, tp + fp);
  const recall = divide(tp, tp + fn);
  const specificity = divide(tn, tn + fp);
  const accuracy = divide(tp + tn, tp + fp + tn + fn);
  const f1 = precision + recall ? 2 * precision * recall / (precision + recall) : 0;
  return {
    rows,
    technical: { total: expectedTotal, successful, errors: technicalErrors, coverage: successful / expectedTotal },
    confusion: { tp, fp, tn, fn },
    primary: { precision, recall, specificity, accuracy, f1 },
    capture_completeness: {
      explicitly_complete_rows: raw.results.filter((row) => row.ok && row.capture_complete === true).length,
      unverifiable_legacy_rows: raw.results.filter((row) => row.ok && row.capture_complete !== true).length
    }
  };
}
