import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const base = new URL("../outputs/development_v0_5_option_b/", import.meta.url);

test("Option-B v2 evaluation remains a reproducible Development result", async () => {
  const [evaluationText, matrixText] = await Promise.all([
    readFile(new URL("option_b_visible_evaluation_v2.json", base), "utf8"),
    readFile(new URL("option_b_visible_feature_matrix_v2.json", base), "utf8")
  ]);
  const evaluation = JSON.parse(evaluationText);
  assert.equal(evaluation.status, "DEVELOPMENT_RESEARCH_ONLY");
  assert.match(evaluation.interpretation, /not independent validation/i);
  assert.equal(evaluation.inputs.matrix.sha256, createHash("sha256").update(matrixText).digest("hex"));
  assert.deepEqual(
    { usable: evaluation.rows.technically_usable, attempted: evaluation.rows.originally_attempted, failed: evaluation.rows.technical_failures },
    { usable: 81, attempted: 169, failed: 88 }
  );
  assert.equal(evaluation.protocol.assignments, 20);
  assert.equal(evaluation.protocol.folds, 5);
  assert.equal(evaluation.protocol.l2, 10);
  assert.equal(evaluation.protocol.threshold, .5);
  assert.deepEqual(evaluation.protocol.indeterminate_range_inclusive, [.38, .62]);
  assert.equal(evaluation.assignments.length, 20);
  assert.equal(evaluation.explanation_feature_stability.models, 100);
});

test("Option-B v2 reports uncertainty and stability without an artificial pass gate", async () => {
  const evaluation = JSON.parse(await readFile(new URL("option_b_visible_evaluation_v2.json", base), "utf8"));
  const { repeated_development_metrics: metrics, indeterminate_analysis: abstention, perturbation_stability: perturbation } = evaluation;
  assert.ok(metrics.precision.median > 0 && metrics.precision.median < 1);
  assert.ok(metrics.recall.median > 0 && metrics.recall.median < 1);
  assert.ok(metrics.expected_calibration_error.median > 0);
  assert.ok(abstention.abstention_rate.median > 0);
  assert.ok(abstention.decided_precision.median >= metrics.precision.median);
  assert.equal(perturbation.simulation_only, true);
  assert.equal(perturbation.comparisons, 3240);
  assert.ok(perturbation.threshold_flip_rate >= 0 && perturbation.threshold_flip_rate <= 1);
  assert.equal("gate" in evaluation, false);
});
