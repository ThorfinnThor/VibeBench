import assert from "node:assert/strict";
import test from "node:test";
import { compareOptionBV5DevelopmentRuns } from "../lib/option-b-v5-development-repeat.mjs";

const isolation = { collector_base_digest: "c", egress_base_digest: "e", collector_source_sha256: "cs", egress_source_sha256: "es" };
const capture = (runId, payloadValue = 1, sampleId = "s") => ({
  schema_version: "vibebench.option_b.v5_development_capture.v1",
  run_id: runId,
  runtime: { isolation },
  inputs: { manifest: { sha256: "m" }, contract: { sha256: "c" } },
  summary: { attempted: 1 },
  captures: [
    { sample_id: sampleId, viewport_id: "desktop", payload: { value: payloadValue } },
    { sample_id: sampleId, viewport_id: "mobile", payload: { value: payloadValue } }
  ]
});
const audit = (runId, sampleId = "s") => ({
  schema_version: "vibebench.option_b.v5_development_attempt_audit.v1",
  run_id: runId,
  attempts: [
    { sample_id: sampleId, viewport_id: "desktop", retry_number: 0, attempt_id: `${runId}-${sampleId}-d`, outcome_code: "success" },
    { sample_id: sampleId, viewport_id: "mobile", retry_number: 0, attempt_id: `${runId}-${sampleId}-m`, outcome_code: "success" }
  ]
});

test("multi-run collector gate requires distinct run IDs and terminal technical quality", () => {
  const runA = { primaryCapture: capture("a"), reserveCapture: capture("a", 1, "r"), primaryAudit: audit("a"), reserveAudit: audit("a", "r") };
  const runB = { primaryCapture: capture("b", 2), reserveCapture: capture("b", 2, "r"), primaryAudit: audit("b"), reserveAudit: audit("b", "r") };
  const result = compareOptionBV5DevelopmentRuns(runA, runB);
  assert.equal(result.status, "MULTI_RUN_COLLECTOR_GATE_PASSED");
  assert.equal(result.payload_repeat.exact_payload_match_share, 0);
  assert.equal(result.gates.two_independent_frozen_runs, true);
  const sameRun = compareOptionBV5DevelopmentRuns(runA, { ...runB, primaryCapture: capture("a", 2) });
  assert.equal(sameRun.status, "MULTI_RUN_COLLECTOR_GATE_FAILED");
  assert.equal(sameRun.gates.two_independent_frozen_runs, false);
});
