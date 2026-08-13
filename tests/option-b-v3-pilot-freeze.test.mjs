import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assertMinimalPilotPrivacy } from "../lib/option-b-v3-minimal-capture.mjs";

test("official Option-B v3 pilot run 1 remains hash-bound, private and repeat-gated", async () => {
  const freeze = JSON.parse(await readFile(new URL("../outputs/development_v0_5_option_b_v3/pilot_run_1/option_b_local_pilot_freeze_v1.json", import.meta.url), "utf8"));
  assert.equal(freeze.status, "FIRST_RUN_FROZEN_REPEAT_REQUIRED");
  assert.equal(freeze.summary.successful, 5);
  assert.equal(freeze.full_batch_approved, false);
  assert.equal(Date.parse(freeze.repeat_window.earliest_utc) - Date.parse(freeze.generated_at), 24 * 60 * 60 * 1000);
  assert.equal(Date.parse(freeze.repeat_window.latest_utc) - Date.parse(freeze.generated_at), 72 * 60 * 60 * 1000);

  for (const [key, artifact] of Object.entries(freeze.artifacts)) {
    const bytes = await readFile(new URL(`../${artifact.path}`, import.meta.url));
    assert.equal(bytes.byteLength, artifact.bytes, `${key} byte count drifted`);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), artifact.sha256, `${key} hash drifted`);
    if (key !== "review") {
      const value = JSON.parse(bytes.toString("utf8"));
      assert.equal(assertMinimalPilotPrivacy(value), true);
      assert.equal(/https?:\/\//i.test(JSON.stringify(value)), false);
    }
  }
});
