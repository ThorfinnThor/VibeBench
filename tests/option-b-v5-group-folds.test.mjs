import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assertNoGroupLeakage, groupedFoldsFor, nestedGroupedEvaluation } from "../lib/option-b-v5-grouped-evaluation.mjs";

test("v5 contract explicitly stops before grouped evaluation", async () => {
  const contract = JSON.parse(await readFile(new URL("../outputs/development_v0_6_option_b_v5/option_b_capture_contract_v5.json", import.meta.url), "utf8"));
  assert.equal(contract.execution_gate.scored_development_run_may_execute, false);
  assert.equal(contract.execution_gate.group_cv_may_execute, false);
  assert.equal(contract.execution_gate.nested_evaluation_may_execute, false);
  assert.equal(contract.execution_gate.candidate_freeze_may_execute, false);
});

const syntheticRows = Array.from({ length: 24 }, (_, groupIndex) => {
  const target = groupIndex % 2;
  return Array.from({ length: 2 }, (_, rowIndex) => ({
    sample_id: `g${groupIndex}-r${rowIndex}`,
    target,
    target_group: `family-${groupIndex}`,
    cohort: groupIndex < 12 ? "earlier" : "later",
    builder_group: target ? "AI_TEST" : "HUMAN_TEST",
    features: { signal: target ? 1 + rowIndex * 0.02 : -1 - rowIndex * 0.02, noise: ((groupIndex * 7 + rowIndex) % 5) / 10 }
  }));
}).flat();

test("true grouped folds keep every project family wholly inside one fold", () => {
  const folds = groupedFoldsFor(syntheticRows, 17, 3);
  assert.equal(assertNoGroupLeakage(folds), true);
  for (let groupIndex = 0; groupIndex < 24; groupIndex += 1) {
    const containing = folds.filter((fold) => fold.some(({ target_group }) => target_group === `family-${groupIndex}`));
    assert.equal(containing.length, 1);
    assert.equal(containing[0].filter(({ target_group }) => target_group === `family-${groupIndex}`).length, 2);
  }
});

test("nested selection records disjoint outer groups and never authorizes candidate freeze automatically", () => {
  const result = nestedGroupedEvaluation(syntheticRows, ["signal", "noise"], {
    outer_seeds: [3],
    outer_folds: 3,
    inner_folds: 3,
    thresholds: [0.45, 0.5, 0.55],
    configurations: [
      { id: "test-l2", family: "logistic_l2", l1: 0, l2: 1, class_weight: "none", feature_limit: null },
      { id: "test-elastic", family: "logistic_elastic_net", l1: 0.01, l2: 3, class_weight: "balanced", feature_limit: 1 }
    ],
    iterations: 80,
    learning_rate: 0.08,
    minimum_subgroup_rows: 2
  });
  assert.equal(result.selection_audit.length, 3);
  for (const audit of result.selection_audit) assert.equal(audit.test_groups.some((group) => audit.train_groups.includes(group)), false);
  assert.equal(result.candidate_freeze_authorized, false);
  assert.equal(Object.values(result.metrics).every((metric) => Number.isFinite(metric.p10) && Number.isFinite(metric.median)), true);
});

test("grouped evaluation protocol is frozen before labels can be joined", async () => {
  const freeze = JSON.parse(await readFile(new URL("../outputs/development_v0_6_option_b_v5/option_b_v5_evaluation_protocol_v2.freeze.json", import.meta.url), "utf8"));
  assert.equal(freeze.status, "GROUPED_NESTED_EVALUATION_AUTHORIZED_AFTER_CAPTURE_FREEZE");
  assert.equal(freeze.prerequisites.target_group, "project_family_id");
  assert.equal(freeze.safeguards.candidate_freeze_automatic, false);
  assert.equal(freeze.safeguards.confirmation_data_available_to_selection, false);
});
