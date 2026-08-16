export function pairedSuccessfulSampleIds(capture, requiredViewportIds = ["desktop", "mobile"]) {
  const viewportsBySample = new Map();
  for (const row of capture.captures || []) {
    if (!viewportsBySample.has(row.sample_id)) viewportsBySample.set(row.sample_id, new Set());
    viewportsBySample.get(row.sample_id).add(row.viewport_id);
  }
  return new Set([...viewportsBySample].filter(([, viewports]) => requiredViewportIds.every((viewport) => viewports.has(viewport))).map(([sampleId]) => sampleId));
}

export function selectFrozenTechnicalReplacements({ primarySampleIds, primarySuccessfulIds, reserveSuccessfulIds, primaryBucketBySampleId, reserveByBucket }) {
  const usedReserveIds = new Set();
  const replacements = [];
  const unresolved = [];
  for (const sampleId of primarySampleIds) {
    if (primarySuccessfulIds.has(sampleId)) continue;
    const bucket = primaryBucketBySampleId[sampleId];
    if (!bucket || !Array.isArray(reserveByBucket[bucket])) throw new Error(`Missing frozen replacement bucket for ${sampleId}.`);
    const candidates = [];
    let selected = null;
    for (const candidateId of reserveByBucket[bucket]) {
      if (usedReserveIds.has(candidateId)) continue;
      usedReserveIds.add(candidateId);
      candidates.push({ sample_id: candidateId, technically_successful: reserveSuccessfulIds.has(candidateId) });
      if (reserveSuccessfulIds.has(candidateId)) { selected = candidateId; break; }
    }
    if (selected) replacements.push({ failed_primary_sample_id: sampleId, replacement_bucket: bucket, attempted_reserve_candidates: candidates, selected_reserve_sample_id: selected, replacement_pre_registered: true, model_score_inspected: false });
    else unresolved.push({ failed_primary_sample_id: sampleId, replacement_bucket: bucket, attempted_reserve_candidates: candidates, selected_reserve_sample_id: null, replacement_pre_registered: true, model_score_inspected: false });
  }
  return { replacements, unresolved, usedReserveIds };
}
