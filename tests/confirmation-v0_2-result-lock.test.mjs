import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("failed independent v0.2 confirmation is immutable and excluded from tuning", async () => {
  const lock = JSON.parse(await readFile(new URL("outputs/confirmation_v0_2/blind_run_v0_2/vibebench_confirmation_result_files_v0_2.json", root), "utf8"));
  assert.equal(lock.status, "FAILED_LOCKED_NO_TUNING");
  assert.equal(lock.independent_confirmation, true);
  assert.equal(lock.policy.may_be_used_for_training, false);
  assert.equal(lock.policy.may_be_used_for_threshold_selection, false);
  assert.equal(lock.policy.may_be_used_for_feature_selection, false);
  assert.deepEqual(lock.confusion, { tp: 8, fp: 8, tn: 42, fn: 42 });
  assert.equal(lock.primary.precision, 0.5);
  assert.equal(lock.primary.recall, 0.16);
  assert.equal(lock.gate.passed, false);

  for (const artifact of lock.artifacts) {
    const bytes = await readFile(new URL(artifact.path, root));
    assert.equal(bytes.byteLength, artifact.bytes, artifact.path);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), artifact.sha256, artifact.path);
  }
});
