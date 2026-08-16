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

const EXTRACTION_FAILURE_OUTCOMES = new Set([
  "computed_style_extraction_failed",
  "structural_aggregation_failed",
  "serialization_failed"
]);

export function terminalAttemptRates(audits) {
  const terminalByTargetViewport = new Map();
  for (const audit of audits) {
    for (const attempt of audit.attempts || []) {
      if (!attempt.sample_id || !attempt.viewport_id || !Number.isInteger(attempt.retry_number)) {
        throw new Error("Invalid v5 attempt-audit row.");
      }
      const key = `${attempt.sample_id}\0${attempt.viewport_id}`;
      const previous = terminalByTargetViewport.get(key);
      if (!previous || attempt.retry_number > previous.retry_number) terminalByTargetViewport.set(key, attempt);
      else if (attempt.retry_number === previous.retry_number && attempt.attempt_id !== previous.attempt_id) {
        throw new Error(`Duplicate terminal retry number for ${attempt.sample_id}/${attempt.viewport_id}.`);
      }
    }
  }
  const terminal = [...terminalByTargetViewport.values()];
  const denominator = terminal.length;
  const unknown = terminal.filter(({ outcome_code }) => outcome_code === "unknown_technical_error").length;
  const extraction = terminal.filter(({ outcome_code }) => EXTRACTION_FAILURE_OUTCOMES.has(outcome_code)).length;
  return {
    denominator_terminal_target_viewports: denominator,
    unknown_technical_error_count: unknown,
    collector_origin_extraction_failure_count: extraction,
    unknown_technical_error: unknown / Math.max(1, denominator),
    collector_origin_extraction_failure: extraction / Math.max(1, denominator),
    basis: "last attempt per sample_id and viewport_id after the frozen retry policy"
  };
}
