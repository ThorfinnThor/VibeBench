import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

function json(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(new URL(path, import.meta.url))).digest("hex");
}

const technicalSourcePath = "../outputs/development_v0_5_option_b/option_b_technical_yield_audit_v1.json";
const uncertaintySourcePath = "../outputs/development_v0_5_option_b/option_b_visible_evaluation_v2.json";
const integritySourcePath = "../outputs/confirmation_v0_4/blind_run_v0_4/vibebench_confirmation_integrity_reconstruction_v0_4.json";

const technicalSource = json(technicalSourcePath);
const uncertaintySource = json(uncertaintySourcePath);
const integritySource = json(integritySourcePath);
const technicalPublic = json("../public/data/insights/website-scan-technical-yield-169-sites.json");
const uncertaintyPublic = json("../public/data/insights/website-score-uncertainty-81-sites.json");
const integrityPublic = json("../public/data/insights/blind-confirmation-integrity-100-sites.json");

test("public technical-yield brief is hash-bound to the frozen source and preserves aggregate counts", () => {
  assert.equal(technicalPublic.source.sha256, sha256(technicalSourcePath));
  assert.deepEqual(technicalPublic.overall, technicalSource.overall);
  for (const label of ["STABLE_HUMAN", "STRONG_AI"]) {
    assert.equal(technicalPublic.by_label[label].attempted, technicalSource.by_label[label].attempted);
    assert.equal(technicalPublic.by_label[label].successful, technicalSource.by_label[label].successful);
    assert.equal(technicalPublic.by_label[label].technical_yield, technicalSource.by_label[label].technical_yield);
  }
  for (const cohort of ["existing", "expansion"]) {
    assert.equal(technicalPublic.by_cohort[cohort].attempted, technicalSource.by_cohort[cohort].attempted);
    assert.equal(technicalPublic.by_cohort[cohort].successful, technicalSource.by_cohort[cohort].successful);
    assert.equal(technicalPublic.by_cohort[cohort].technical_yield, technicalSource.by_cohort[cohort].technical_yield);
  }
});

test("public uncertainty brief preserves the repeated metrics and uncertainty policy", () => {
  assert.equal(uncertaintyPublic.source.sha256, sha256(uncertaintySourcePath));
  assert.equal(uncertaintyPublic.rows.technically_usable, uncertaintySource.rows.technically_usable);
  assert.deepEqual(uncertaintyPublic.protocol.indeterminate_range_inclusive, uncertaintySource.protocol.indeterminate_range_inclusive);
  for (const metric of ["precision", "recall", "specificity", "accuracy", "roc_auc"]) {
    assert.deepEqual(uncertaintyPublic.repeated_development_metrics[metric], {
      p10: uncertaintySource.repeated_development_metrics[metric].p10,
      median: uncertaintySource.repeated_development_metrics[metric].median,
      p90: uncertaintySource.repeated_development_metrics[metric].p90
    });
  }
  assert.equal(uncertaintyPublic.indeterminate_analysis.abstention_rate_median, uncertaintySource.indeterminate_analysis.abstention_rate.median);
  assert.equal(uncertaintyPublic.indeterminate_analysis.overall_positive_recall_with_abstentions_as_unresolved_median, uncertaintySource.indeterminate_analysis.overall_positive_recall_with_abstentions_as_unresolved.median);
  assert.deepEqual(uncertaintyPublic.perturbation_stability, {
    simulation_only: uncertaintySource.perturbation_stability.simulation_only,
    comparisons: uncertaintySource.perturbation_stability.comparisons,
    absolute_score_delta: {
      median: uncertaintySource.perturbation_stability.absolute_score_delta.median,
      p90: uncertaintySource.perturbation_stability.absolute_score_delta.p90,
      maximum: uncertaintySource.perturbation_stability.absolute_score_delta.maximum
    },
    threshold_flip_rate: uncertaintySource.perturbation_stability.threshold_flip_rate,
    qualitative_band_change_rate: uncertaintySource.perturbation_stability.qualitative_band_change_rate
  });
});

test("public integrity brief preserves the failed gate alongside the passing numerical thresholds", () => {
  assert.equal(integrityPublic.source.sha256, sha256(integritySourcePath));
  assert.deepEqual(integrityPublic.technical, integritySource.technical);
  assert.deepEqual(integrityPublic.capture_completeness, integritySource.capture_completeness);
  assert.deepEqual(integrityPublic.confusion, integritySource.confusion);
  assert.deepEqual(integrityPublic.metrics, integritySource.primary);
  assert.deepEqual(integrityPublic.gate, integritySource.gate);
  assert.equal(integrityPublic.gate.metric_thresholds_passed, true);
  assert.equal(integrityPublic.gate.passed, false);
});

test("public data-brief extracts contain no row-level identities or network locations", () => {
  for (const artifact of [technicalPublic, uncertaintyPublic, integrityPublic]) {
    const serialized = JSON.stringify(artifact);
    assert.doesNotMatch(serialized, /https?:\/\//i);
    assert.doesNotMatch(serialized, /"(sample_id|hostname|hosting_suffix|target_url|domain)"/i);
    assert.match(artifact.privacy, /excluded/i);
  }
});
