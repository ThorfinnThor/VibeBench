import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const base = new URL("../outputs/development_v0_5_option_b/", import.meta.url);
const readJson = async (name) => JSON.parse(await readFile(new URL(name, base), "utf8"));

test("Option B locks the visible-footprint target before evaluation", async () => {
  const protocol = await readJson("option_b_protocol_v1.json");
  assert.equal(protocol.primary_task, "strong_visible_vibe_footprint");
  assert.equal(protocol.cutoff, "2022-11-30T00:00:00Z");
  assert.equal(protocol.strong_ai.assistant_only_is_ambiguous, true);
  assert.equal(protocol.stable_human.latest_default_branch_commit_before_cutoff, true);
  assert.equal(protocol.development_gate.precision_min, .9);
  assert.equal(protocol.development_gate.recall_min, .9);
  assert.equal(protocol.development_gate.all_repeated_assignments_must_pass, true);
});

test("Option-B relabeling is score-blind and retains ambiguous rows", async () => {
  const registry = await readJson("option_b_label_registry_v1.json");
  assert.equal(registry.selection_used_model_scores, false);
  assert.equal(registry.selection_used_public_surface_features, false);
  assert.deepEqual(
    { total: registry.summary.total, strong_ai: registry.summary.strong_ai, stable_human: registry.summary.stable_human, ambiguous: registry.summary.ambiguous },
    { total: 366, strong_ai: 12, stable_human: 26, ambiguous: 328 }
  );
  assert.equal(registry.records.length, 366);
});

test("frozen Option-B surface matrix contains no prohibited identity feature", async () => {
  const matrix = await readJson("option_b_browser_surface_matrix_v1.json");
  assert.deepEqual(matrix.summary, { total: 169, successful: 81, errors: 88, strong_ai_successful: 28, stable_human_successful: 53 });
  assert.equal(matrix.feature_names.length, 68);
  assert.equal(matrix.feature_names.some((name) => /host|url|provenance|builder/i.test(name)), false);
  assert.equal(matrix.rows.filter((row) => row.ok).every((row) => Object.keys(row.features).length === 68), true);
});

test("Option B honestly records that Development 90/90 is not met", async () => {
  const validation = await readJson("option_b_development_validation_v1.json");
  assert.equal(validation.status, "DEVELOPMENT_90_90_GATE_NOT_MET");
  assert.equal(validation.best.assignments, 20);
  assert.equal(validation.best.assignments_meeting_90_90, 0);
  assert.ok(validation.best.precision.median < .9);
  assert.ok(validation.best.recall.median < .9);
});
