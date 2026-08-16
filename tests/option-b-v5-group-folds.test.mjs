import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("v5 contract explicitly stops before grouped evaluation", async () => {
  const contract = JSON.parse(await readFile(new URL("../outputs/development_v0_6_option_b_v5/option_b_capture_contract_v5.json", import.meta.url), "utf8"));
  assert.equal(contract.execution_gate.scored_development_run_may_execute, false);
  assert.equal(contract.execution_gate.group_cv_may_execute, false);
  assert.equal(contract.execution_gate.nested_evaluation_may_execute, false);
  assert.equal(contract.execution_gate.candidate_freeze_may_execute, false);
});
