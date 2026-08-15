import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assessDevelopmentPageQuality } from "../lib/content-quality.mjs";

const frozenPath = "outputs/development_v0_2/vibebench_development_v0_2_frozen_manifest.json";
const frozen = JSON.parse(await readFile(frozenPath, "utf8"));

test("Development v0.2 freeze records a complete leakage-safe research corpus", () => {
  assert.equal(frozen.status, "FROZEN");
  assert.equal(frozen.rows, 40);
  assert.equal(frozen.constraints.completed_holdout_as_source, false);
  assert.equal(frozen.constraints.completed_holdout_for_tuning, false);
  assert.equal(frozen.constraints.production_rule_change_authorized, false);
  assert.equal(frozen.constraints.new_holdout_required_for_evaluation, true);
});

test("Development v0.2 frozen file hashes still match the working tree", async () => {
  for (const [file, metadata] of Object.entries(frozen.files)) {
    const text = await readFile(file, "utf8");
    const actual = createHash("sha256").update(text).digest("hex");
    assert.equal(actual, metadata.sha256, `${file} drifted after the freeze`);
  }
});

test("Development freeze content gate rejects parked domains", () => {
  const parked = assessDevelopmentPageQuality({
    headers: new Headers({ server: "Parking/1.0" }),
    html: '<a href="https://img.sedoparking.com">Buy this domain</a>'
  });
  assert.equal(parked.eligible, false);
  assert.deepEqual(parked.disqualifying_signals, ["parking-server-header", "sedo-parking", "buy-this-domain", "no-meaningful-document-structure"]);
});

test("Development freeze content gate rejects challenge, expired and empty pages", () => {
  assert.equal(assessDevelopmentPageQuality({ headers: new Headers(), html: "<title>Just a moment...</title><div id=cf-chl-widget></div>" }).eligible, false);
  assert.equal(assessDevelopmentPageQuality({ headers: new Headers(), html: "<main>This domain has expired. Renewal instructions follow.</main>" }).eligible, false);
  assert.equal(assessDevelopmentPageQuality({ headers: new Headers(), html: "<title>Hi</title>" }).eligible, false);
});

test("Development freeze content gate accepts an ordinary application page", () => {
  const page = assessDevelopmentPageQuality({
    headers: new Headers({ server: "Netlify" }),
    html: "<title>Example app</title><main>Dashboard</main>"
  });
  assert.deepEqual(page, { eligible: true, disqualifying_signals: [] });
});
