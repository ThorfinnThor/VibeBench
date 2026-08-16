import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("v5 repeat comparison freezes technical reproducibility without inspecting model performance", async () => {
  const result = JSON.parse(await readFile(new URL("../outputs/development_v0_6_option_b_v5/option_b_v5_smoke_repeat_comparison_v1.json", import.meta.url), "utf8"));
  assert.equal(result.status, "V5_REPEAT_INTEGRITY_ACCEPTABLE_PHASE_2_TECHNICAL_REVIEW_COMPLETE");
  assert.equal(Object.values(result.gates).every(Boolean), true);
  assert.equal(result.summary.common_captures, 10);
  assert.equal(result.summary.exact_payload_matches, 6);
  assert.equal(result.model_performance_inspected, false);
  assert.equal(result.timing.interval_gate_applied, false);
  assert.match(result.phase_gate, /EXPANSION_REQUIRES_SEPARATE/);
});
