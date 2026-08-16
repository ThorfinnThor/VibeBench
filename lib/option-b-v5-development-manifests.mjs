import { createHash } from "node:crypto";

export const OPTION_B_V5_DEVELOPMENT_FREEZE_AT = "2026-08-16T18:00:00.000Z";
export const OPTION_B_V5_PRIMARY_QUOTAS = Object.freeze({
  AI_NATIVE: 43,
  AI_ASSISTANT: 57,
  HUMAN_CONTROL: 100
});

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const orderBy = (purpose, rows) => [...rows].sort((left, right) =>
  sha256(`${purpose}\0${left.project_family_id}\0${left.sample_id}`)
    .localeCompare(sha256(`${purpose}\0${right.project_family_id}\0${right.sample_id}`))
);

const replacementBucketFor = ({ target, target_group: targetGroup, builder_bucket: builderBucket }) => {
  if (target === 0) return "HUMAN_CONTROL";
  if (builderBucket === "NATIVE_BUILDER" || /(?:BOLT|REPLIT|LOVABLE|NATIVE|\bV0\b)/i.test(targetGroup || "")) return "AI_NATIVE";
  return "AI_ASSISTANT";
};

const browserCandidate = (row) => ({
  sample_id: row.sample_id,
  target_url: row.target_url,
  target: row.target,
  label: row.target === 1 ? "AI" : "HUMAN",
  label_definition: row.target === 1 ? "declared_ai_builder_provenance" : "pre_ai_origin_proxy",
  target_group: row.project_family_id,
  project_family_id: row.project_family_id,
  builder_group: row.target_group,
  replacement_bucket: replacementBucketFor(row),
  cohort: row.cohort || "option_b_hard_gold",
  provenance_type: "frozen_option_b_hard_gold_registry",
  provenance_url: row.provenance_url,
  source_artifact: "option_b_browser_surface_matrix_v1",
  historical_technical_eligibility: true,
  model_score_inspected_for_selection: false
});

const poolCandidate = (row) => ({
  sample_id: `V5-${row.candidate_id}`,
  target_url: row.target_url,
  target: row.label === "AI" ? 1 : 0,
  label: row.label,
  label_definition: row.label === "AI" ? "declared_ai_builder_provenance" : "pre_ai_origin_proxy",
  target_group: row.project_family_id,
  project_family_id: row.project_family_id,
  builder_group: row.label === "AI" ? row.builder_bucket : "HUMAN_CONTROL",
  replacement_bucket: replacementBucketFor({
    target: row.label === "AI" ? 1 : 0,
    target_group: row.builder_bucket,
    builder_bucket: row.builder_bucket
  }),
  cohort: "v0_5_development_candidate_pool",
  provenance_type: row.provenance_type,
  provenance_url: row.provenance_url,
  source_artifact: "vibebench_development_v0_5_candidate_pool",
  historical_technical_eligibility: row.reachability?.ok === true,
  model_score_inspected_for_selection: row.model_score_inspected_during_acquisition === true
});

export function buildOptionBV5DevelopmentPackage({ browserRows, poolRows, excludedFamilies = new Set() }) {
  const candidatesByFamily = new Map();
  for (const row of browserRows.filter(({ ok }) => ok === true)) {
    if (!excludedFamilies.has(row.project_family_id)) candidatesByFamily.set(row.project_family_id, browserCandidate(row));
  }
  for (const row of poolRows.filter(({ reachability }) => reachability?.ok === true)) {
    if (!excludedFamilies.has(row.project_family_id) && !candidatesByFamily.has(row.project_family_id)) {
      candidatesByFamily.set(row.project_family_id, poolCandidate(row));
    }
  }

  const candidates = [...candidatesByFamily.values()];
  if (candidates.some((row) => row.model_score_inspected_for_selection)) throw new Error("Development selection may not use model-scored candidates.");
  if (new Set(candidates.map(({ sample_id }) => sample_id)).size !== candidates.length) throw new Error("Duplicate v5 Development sample IDs.");
  if (new Set(candidates.map(({ project_family_id }) => project_family_id)).size !== candidates.length) throw new Error("Duplicate v5 Development project families.");

  const primary = [];
  for (const [bucket, quota] of Object.entries(OPTION_B_V5_PRIMARY_QUOTAS)) {
    const rows = orderBy(`v5-primary-${bucket}`, candidates.filter(({ replacement_bucket }) => replacement_bucket === bucket));
    if (rows.length <= quota) throw new Error(`Need more than ${quota} eligible rows for ${bucket}; found ${rows.length}.`);
    primary.push(...rows.slice(0, quota));
  }
  const primaryFamilies = new Set(primary.map(({ project_family_id }) => project_family_id));
  const reserve = candidates.filter(({ project_family_id }) => !primaryFamilies.has(project_family_id));
  const primaryOrdered = orderBy("v5-primary-capture-order", primary);
  const reserveOrdered = orderBy("v5-reserve-capture-order", reserve);
  const partitionByFamily = new Map([
    ...primaryOrdered.map((row) => [row.project_family_id, "primary"]),
    ...reserveOrdered.map((row) => [row.project_family_id, "reserve"])
  ]);
  const registry = orderBy("v5-registry-order", candidates).map((row) => ({
    ...row,
    partition: partitionByFamily.get(row.project_family_id)
  }));
  const reserveByBucket = Object.fromEntries(Object.keys(OPTION_B_V5_PRIMARY_QUOTAS).map((bucket) => [
    bucket,
    orderBy(`v5-replacement-${bucket}`, reserveOrdered.filter(({ replacement_bucket }) => replacement_bucket === bucket))
      .map(({ sample_id }) => sample_id)
  ]));
  for (const [bucket, ids] of Object.entries(reserveByBucket)) if (!ids.length) throw new Error(`No reserve candidates for ${bucket}.`);

  return { primary: primaryOrdered, reserve: reserveOrdered, registry, reserveByBucket };
}

export function collectorManifest({ rows, partition, sources }) {
  return {
    schema_version: `vibebench.option_b.v5_development_${partition}_manifest.v1`,
    locked_at: OPTION_B_V5_DEVELOPMENT_FREEZE_AT,
    status: `LABEL_BLIND_DEVELOPMENT_${partition.toUpperCase()}_FROZEN`,
    purpose: "Development-only v5 public-surface capture; not an independent performance claim",
    sources,
    selection: {
      labels_inspected_by_collector: false,
      model_scores_inspected: false,
      previous_features_inspected: false,
      historical_technical_eligibility_required: true
    },
    collector_visible_fields: ["sample_id", "target_url"],
    rows: rows.map(({ sample_id, target_url }) => ({ sample_id, target_url }))
  };
}

export function chooseOptionBV5TechnicalReplacement({ failedSampleId, registry, reserveByBucket, usedSampleIds = new Set() }) {
  const failed = registry.find(({ sample_id }) => sample_id === failedSampleId && partitionFor(registry, sample_id) === "primary");
  if (!failed) return null;
  const registryById = new Map(registry.map((row) => [row.sample_id, row]));
  const replacementId = (reserveByBucket[failed.replacement_bucket] || []).find((sampleId) => !usedSampleIds.has(sampleId));
  if (!replacementId) return null;
  const replacement = registryById.get(replacementId);
  if (!replacement || replacement.partition !== "reserve" || replacement.target !== failed.target || replacement.replacement_bucket !== failed.replacement_bucket || replacement.project_family_id === failed.project_family_id) {
    throw new Error("Frozen v5 replacement policy integrity failure.");
  }
  return replacement;
}

function partitionFor(registry, sampleId) {
  return registry.find(({ sample_id }) => sample_id === sampleId)?.partition;
}

export function sha256Text(text) {
  return sha256(text);
}
