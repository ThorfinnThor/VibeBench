import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { FEATURE_NAMES } from "../lib/development-v0_2-candidate.mjs";

const matrix = JSON.parse(await readFile("outputs/development_v0_2/vibebench_development_v0_2_feature_matrix.json", "utf8"));
const evaluation = JSON.parse(await readFile("outputs/development_v0_2/vibebench_development_v0_2_candidate_evaluation.json", "utf8"));
const frozen = JSON.parse(await readFile("outputs/development_v0_2/vibebench_development_v0_2_candidate.freeze.json", "utf8"));

test("portable candidate matrix is balanced and excludes leakage-prone features", () => {
  assert.equal(matrix.holdout_used, false);
  assert.equal(matrix.rows.length, 40);
  assert.equal(matrix.rows.filter((row) => row.target === 1).length, 20);
  assert.deepEqual(matrix.feature_names, FEATURE_NAMES);
  assert.equal(FEATURE_NAMES.some((name) => /host|url|builder|provenance|header|marker/i.test(name)), false);
  for (const row of matrix.rows) assert.deepEqual(Object.keys(row.features), FEATURE_NAMES);
});

test("Development candidate clears the fixed 80/80 cross-validation gate", () => {
  assert.equal(evaluation.status, "DEVELOPMENT_GATE_PASSED");
  assert.equal(evaluation.holdout_used, false);
  assert.equal(evaluation.production_rule_change_authorized, false);
  assert.equal(evaluation.new_holdout_required, true);
  assert.ok(evaluation.primary_metrics.precision >= 0.8);
  assert.ok(evaluation.primary_metrics.recall >= 0.8);
  assert.equal(evaluation.primary_predictions.length, 40);
});

test("frozen candidate files still match their recorded hashes", async () => {
  assert.equal(frozen.status, "FROZEN_FOR_CONFIRMATION");
  assert.equal(frozen.constraints.completed_holdout_used, false);
  assert.equal(frozen.constraints.further_development_tuning_allowed, false);
  assert.equal(frozen.constraints.production_rule_change_authorized, false);
  assert.equal(frozen.constraints.new_holdout_required, true);
  for (const [file, metadata] of Object.entries(frozen.files)) {
    const text = await readFile(file, "utf8");
    assert.equal(createHash("sha256").update(text).digest("hex"), metadata.sha256, `${file} drifted after candidate freeze`);
  }
});
