import { pairedSuccessfulSampleIds, terminalAttemptRates } from "./option-b-v5-development-finalize.mjs";

const RUNTIME_KEYS = [
  "collector_base_digest",
  "egress_base_digest",
  "collector_source_sha256",
  "egress_source_sha256"
];

const payloadByPair = (capture) => new Map((capture.captures || []).map((row) => [
  `${row.sample_id}\0${row.viewport_id}`,
  JSON.stringify(row.payload)
]));

export function compareOptionBV5DevelopmentRuns(runA, runB) {
  const runs = [runA, runB];
  for (const [index, run] of runs.entries()) {
    if (run.primaryCapture?.schema_version !== "vibebench.option_b.v5_development_capture.v1" || run.reserveCapture?.schema_version !== run.primaryCapture.schema_version) throw new Error(`Run ${index + 1} capture schema mismatch.`);
    if (run.primaryAudit?.schema_version !== "vibebench.option_b.v5_development_attempt_audit.v1" || run.reserveAudit?.schema_version !== run.primaryAudit.schema_version) throw new Error(`Run ${index + 1} audit schema mismatch.`);
  }
  const runtimeStable = RUNTIME_KEYS.every((key) => {
    const values = runs.flatMap((run) => [run.primaryCapture.runtime?.isolation?.[key], run.reserveCapture.runtime?.isolation?.[key]]);
    return values.every(Boolean) && new Set(values).size === 1;
  });
  const inputStable = ["manifest", "contract"].every((input) =>
    runs.every((run) => run.primaryCapture.inputs?.[input]?.sha256 === runA.primaryCapture.inputs?.[input]?.sha256) &&
    runs.every((run) => run.reserveCapture.inputs?.[input]?.sha256 === runA.reserveCapture.inputs?.[input]?.sha256)
  );
  const summaries = runs.map((run, index) => {
    const primarySuccessful = pairedSuccessfulSampleIds(run.primaryCapture).size;
    const reserveSuccessful = pairedSuccessfulSampleIds(run.reserveCapture).size;
    const terminal = terminalAttemptRates([run.primaryAudit, run.reserveAudit]);
    return {
      run: index + 1,
      primary_attempted: run.primaryCapture.summary.attempted,
      primary_successful_pairs: primarySuccessful,
      primary_technical_yield: primarySuccessful / Math.max(1, run.primaryCapture.summary.attempted),
      reserve_attempted: run.reserveCapture.summary.attempted,
      reserve_successful_pairs: reserveSuccessful,
      reserve_technical_yield: reserveSuccessful / Math.max(1, run.reserveCapture.summary.attempted),
      terminal
    };
  });
  const terminalDenominator = summaries.reduce((sum, run) => sum + run.terminal.denominator_terminal_target_viewports, 0);
  const terminalUnknown = summaries.reduce((sum, run) => sum + run.terminal.unknown_technical_error_count, 0);
  const terminalExtraction = summaries.reduce((sum, run) => sum + run.terminal.collector_origin_extraction_failure_count, 0);
  const aggregateTerminal = {
    denominator_terminal_target_viewports: terminalDenominator,
    unknown_technical_error_count: terminalUnknown,
    collector_origin_extraction_failure_count: terminalExtraction,
    unknown_technical_error: terminalUnknown / Math.max(1, terminalDenominator),
    collector_origin_extraction_failure: terminalExtraction / Math.max(1, terminalDenominator),
    basis: "terminal target-viewports aggregated across the two independent frozen runs"
  };
  const pairsA = payloadByPair({ captures: [...runA.primaryCapture.captures, ...runA.reserveCapture.captures] });
  const pairsB = payloadByPair({ captures: [...runB.primaryCapture.captures, ...runB.reserveCapture.captures] });
  const commonKeys = [...pairsA.keys()].filter((key) => pairsB.has(key));
  const exactMatches = commonKeys.filter((key) => pairsA.get(key) === pairsB.get(key)).length;
  const gates = {
    two_independent_frozen_runs: runA.primaryCapture.run_id !== runB.primaryCapture.run_id,
    runtime_identity_stable: runtimeStable,
    frozen_inputs_stable: inputStable,
    primary_technical_yield_at_least_90_percent_each_run: summaries.every(({ primary_technical_yield }) => primary_technical_yield >= 0.9),
    aggregate_unknown_technical_error_at_most_1_percent: aggregateTerminal.unknown_technical_error <= 0.01,
    aggregate_collector_origin_extraction_failure_at_most_2_percent: aggregateTerminal.collector_origin_extraction_failure <= 0.02
  };
  return {
    status: Object.values(gates).every(Boolean) ? "MULTI_RUN_COLLECTOR_GATE_PASSED" : "MULTI_RUN_COLLECTOR_GATE_FAILED",
    gates,
    runs: summaries,
    aggregate_terminal_rates: aggregateTerminal,
    payload_repeat: {
      common_successful_viewport_pairs: commonKeys.length,
      exact_payload_matches: exactMatches,
      exact_payload_match_share: exactMatches / Math.max(1, commonKeys.length),
      interpretation: "Recorded for stability diagnosis only; no minimum exact-byte match is used as a promotion gate because live layout counts may legitimately vary."
    }
  };
}
