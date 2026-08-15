import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { evaluateConfirmationIntegrity } from "../lib/confirmation-v0_4-integrity.mjs";
import { assertOptionBV3DerivedPayload } from "../lib/option-b-v3-derived-payload-validation-v1.mjs";
import { collectPortablePageMetrics } from "../lib/portable-page-metrics.mjs";

test("historical snapshot IDs cannot escape their configured roots", () => {
  const source = [
    "from pathlib import Path",
    "from vibebench_snapshot_builder import validate_sample_id, contained_path",
    "assert validate_sample_id('HIS-0001') == 'HIS-0001'",
    "assert contained_path(Path('/tmp/vibebench-test'), '_work', 'HIS-0001') == Path('/tmp/vibebench-test/_work/HIS-0001').resolve()",
    "for value in ['../escape', 'HIS/0001', '', 'lowercase']:",
    "  try: validate_sample_id(value)",
    "  except ValueError: pass",
    "  else: raise AssertionError(value)",
    "try: contained_path(Path('/tmp/vibebench-test'), '..', 'escape')",
    "except ValueError: pass",
    "else: raise AssertionError('containment')"
  ].join("\n");
  assert.doesNotThrow(() => execFileSync("python3", ["-c", source], { cwd: new URL("..", import.meta.url), stdio: "pipe" }));
});

test("Option B derived ingestion validates relational payload invariants", async () => {
  const capture = JSON.parse(await readFile(new URL("../outputs/development_v0_5_option_b_v3/option_b_local_pilot_capture_v1.json", import.meta.url), "utf8"));
  const payload = capture.captures[0].payload;
  assert.equal(assertOptionBV3DerivedPayload(payload), payload);

  const fetchedTooHigh = structuredClone(payload);
  fetchedTooHigh.public_assets.same_origin_stylesheets_fetched = fetchedTooHigh.public_assets.same_origin_stylesheet_candidates + 1;
  assert.throws(() => assertOptionBV3DerivedPayload(fetchedTooHigh), /exceeds candidates/);

  const badFrequency = structuredClone(payload);
  badFrequency.repetition.structural_signature_frequency[0].count += 1;
  assert.throws(() => assertOptionBV3DerivedPayload(badFrequency), /counts .* expected/);

  const incompleteStyle = structuredClone(payload);
  delete incompleteStyle.visible_elements[0].computed_style.font_size_px;
  assert.throws(() => assertOptionBV3DerivedPayload(incompleteStyle), /Missing computed style field/);
});

test("confirmation integrity reconstructs predictions and rejects stored inconsistencies", () => {
  const manifest = { samples: [
    { sample_id: "A1", label: "AI" }, { sample_id: "A2", label: "AI" },
    { sample_id: "H1", label: "HUMAN" }, { sample_id: "H2", label: "HUMAN" }
  ] };
  const raw = {
    total: 4,
    labels_used_by_runner: false,
    successful: 4,
    technical_errors: 0,
    results: [
      { sample_id: "A1", ok: true, probability: .9, predicted_positive: true, capture_complete: true },
      { sample_id: "A2", ok: true, probability: .4, predicted_positive: false, capture_complete: true },
      { sample_id: "H1", ok: true, probability: .7, predicted_positive: true, capture_complete: true },
      { sample_id: "H2", ok: true, probability: .1, predicted_positive: false, capture_complete: true }
    ]
  };
  const result = evaluateConfirmationIntegrity({ manifest, raw, model: { training: { threshold: .5 } }, expectedTotal: 4 });
  assert.deepEqual(result.confusion, { tp: 1, fp: 1, tn: 1, fn: 1 });
  assert.deepEqual(result.capture_completeness, { explicitly_complete_rows: 4, unverifiable_legacy_rows: 0 });

  const inconsistent = structuredClone(raw);
  inconsistent.results[0].predicted_positive = false;
  assert.throws(() => evaluateConfirmationIntegrity({ manifest, raw: inconsistent, model: { training: { threshold: .5 } }, expectedTotal: 4 }), /disagrees/);
});

test("JSON-LD and import maps do not inflate executable inline script bytes", () => {
  const html = '<script type="application/ld+json">{"large":"value"}</script><script type="importmap">{"imports":{}}</script><script>abc()</script>';
  const metrics = collectPortablePageMetrics({ html, assets: [], fetchedAssets: [] });
  assert.equal(metrics.inline_script_bytes, 5);
});

test("CI dependencies are immutable and historical builds default to non-root", async () => {
  const [workflow, dependabot, dockerfile, confirmationBuilder] = await Promise.all([
    readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8"),
    readFile(new URL("../.github/dependabot.yml", import.meta.url), "utf8"),
    readFile(new URL("../Dockerfile.vibebench-historical", import.meta.url), "utf8"),
    readFile(new URL("../scripts/build-confirmation-v0_4-manifest.mjs", import.meta.url), "utf8")
  ]);
  const actionRefs = [...workflow.matchAll(/uses:\s*[^@\s]+@([a-f0-9]+)/g)].map((match) => match[1]);
  assert.ok(actionRefs.length >= 2);
  assert.equal(actionRefs.every((value) => value.length === 40), true);
  assert.match(dependabot, /package-ecosystem:\s*github-actions/);
  assert.match(dockerfile, /USER 10001:10001/);
  assert.match(confirmationBuilder, /frozen v0\.4 confirmation package is immutable/);
});
