import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { pairedSuccessfulSampleIds, selectFrozenTechnicalReplacements, terminalAttemptRates } from "../lib/option-b-v5-development-finalize.mjs";
import { chooseOptionBV5TechnicalReplacement } from "../lib/option-b-v5-development-manifests.mjs";

const root = new URL("../outputs/development_v0_6_option_b_v5/", import.meta.url);
const read = async (name) => JSON.parse(await readFile(new URL(name, root), "utf8"));

test("v5 Development manifests keep labels out of the collector and families out of both partitions", async () => {
  const [primary, reserve, registry, freeze] = await Promise.all([
    read("option_b_v5_development_primary_manifest_v1.json"),
    read("option_b_v5_development_reserve_manifest_v1.json"),
    read("option_b_v5_development_evaluation_registry_v1.json"),
    read("option_b_v5_development_package_v1.freeze.json")
  ]);
  assert.equal(primary.rows.length, 200);
  assert.ok(reserve.rows.length >= 50);
  assert.deepEqual(primary.collector_visible_fields, ["sample_id", "target_url"]);
  assert.equal([...primary.rows, ...reserve.rows].every((row) => Object.keys(row).sort().join(",") === "sample_id,target_url"), true);
  const primaryIds = new Set(primary.rows.map(({ sample_id }) => sample_id));
  const primaryFamilies = new Set(registry.rows.filter(({ sample_id }) => primaryIds.has(sample_id)).map(({ project_family_id }) => project_family_id));
  const reserveFamilies = new Set(registry.rows.filter(({ partition }) => partition === "reserve").map(({ project_family_id }) => project_family_id));
  assert.equal([...primaryFamilies].some((family) => reserveFamilies.has(family)), false);
  assert.deepEqual(registry.summary.primary_targets, { 0: 100, 1: 100 });
  assert.equal(freeze.capture_may_start, false);
});

test("capture finalization uses only complete viewport pairs and advances past failed reserves", () => {
  const primarySuccessfulIds = pairedSuccessfulSampleIds({ captures: [
    { sample_id: "p1", viewport_id: "desktop" }, { sample_id: "p1", viewport_id: "mobile" },
    { sample_id: "p2", viewport_id: "desktop" }
  ] });
  const reserveSuccessfulIds = pairedSuccessfulSampleIds({ captures: [
    { sample_id: "r2", viewport_id: "desktop" }, { sample_id: "r2", viewport_id: "mobile" }
  ] });
  assert.deepEqual([...primarySuccessfulIds], ["p1"]);
  const result = selectFrozenTechnicalReplacements({
    primarySampleIds: ["p1", "p2"],
    primarySuccessfulIds,
    reserveSuccessfulIds,
    primaryBucketBySampleId: { p1: "AI_NATIVE", p2: "AI_NATIVE" },
    reserveByBucket: { AI_NATIVE: ["r1", "r2"] }
  });
  assert.equal(result.unresolved.length, 0);
  assert.equal(result.replacements[0].selected_reserve_sample_id, "r2");
  assert.deepEqual(result.replacements[0].attempted_reserve_candidates, [
    { sample_id: "r1", technically_successful: false },
    { sample_id: "r2", technically_successful: true }
  ]);
});

test("v5 technical replacement is pre-registered, label-compatible and family-exclusive", async () => {
  const [registryArtifact, policy] = await Promise.all([
    read("option_b_v5_development_evaluation_registry_v1.json"),
    read("option_b_v5_development_replacement_policy_v1.json")
  ]);
  const failed = registryArtifact.rows.find(({ partition }) => partition === "primary");
  const replacement = chooseOptionBV5TechnicalReplacement({
    failedSampleId: failed.sample_id,
    registry: registryArtifact.rows,
    reserveByBucket: policy.reserve_by_bucket,
    usedSampleIds: new Set()
  });
  assert.ok(replacement);
  assert.equal(replacement.partition, "reserve");
  assert.equal(replacement.target, failed.target);
  assert.equal(replacement.replacement_bucket, failed.replacement_bucket);
  assert.notEqual(replacement.project_family_id, failed.project_family_id);
  const exhausted = new Set(policy.reserve_by_bucket[failed.replacement_bucket]);
  assert.equal(chooseOptionBV5TechnicalReplacement({ failedSampleId: failed.sample_id, registry: registryArtifact.rows, reserveByBucket: policy.reserve_by_bucket, usedSampleIds: exhausted }), null);
});

test("collector error gates use terminal retry outcomes rather than every attempt", () => {
  const rates = terminalAttemptRates([{ attempts: [
    { sample_id: "a", viewport_id: "desktop", retry_number: 0, attempt_id: "a0", outcome_code: "unknown_technical_error" },
    { sample_id: "a", viewport_id: "desktop", retry_number: 1, attempt_id: "a1", outcome_code: "success" },
    { sample_id: "a", viewport_id: "mobile", retry_number: 0, attempt_id: "a2", outcome_code: "success" },
    { sample_id: "b", viewport_id: "desktop", retry_number: 0, attempt_id: "b0", outcome_code: "computed_style_extraction_failed" },
    { sample_id: "b", viewport_id: "mobile", retry_number: 0, attempt_id: "b1", outcome_code: "unknown_technical_error" }
  ] }]);
  assert.equal(rates.denominator_terminal_target_viewports, 4);
  assert.equal(rates.unknown_technical_error, 0.25);
  assert.equal(rates.collector_origin_extraction_failure, 0.25);
  assert.match(rates.basis, /last attempt/);
});
