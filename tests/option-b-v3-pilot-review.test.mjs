import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { reviewOptionBV3Pilot } from "../lib/option-b-v3-pilot-review.mjs";

const captureContract = JSON.parse(await readFile(new URL("../outputs/development_v0_5_option_b_v3/option_b_capture_contract_v3.json", import.meta.url), "utf8"));
const reviewContract = JSON.parse(await readFile(new URL("../outputs/development_v0_5_option_b_v3/option_b_pilot_review_contract_v1.json", import.meta.url), "utf8"));
const ids = Array.from({ length: 6 }, (_, index) => `PILOT-${index + 1}`);

function style() {
  return Object.fromEntries(captureContract.capture_payload.computed_style_properties.map((field) => [field, field.includes("display") || field.includes("position") || field.includes("align") || field.includes("category") || field.includes("overflow") ? "none" : 0]));
}

function payload() {
  return {
    document: Object.fromEntries(captureContract.capture_payload.document.map((field) => [field, field === "viewport_width" ? 1440 : field === "viewport_height" ? 900 : 1])),
    layout_regions: [],
    visible_elements: [{ dom_preorder_index: 1, computed_style: style() }],
    repetition: {
      structural_signature_frequency: [],
      computed_style_signature_frequency: [],
      repeated_sibling_group_sizes: [],
      repeated_region_signature_frequency: []
    },
    public_assets: {
      same_origin_stylesheet_candidates: 1,
      same_origin_stylesheets_fetched: 1,
      stylesheet_fetch_outcomes: { readable: 1, inaccessible: 0, capped: 0 },
      css_custom_property_name_hashes: [],
      css_custom_property_value_type: [],
      font_face_count: 0,
      media_query_count: 0,
      container_query_count: 0
    }
  };
}

function artifacts() {
  const runId = "run-1";
  const runtime = { engine: "chromium-compatible", version: "Chromium 139.0.0", source: "playwright-bundle", playwright_version: "1.54.2" };
  const attempts = ids.map((sampleId, index) => ({
    sample_id: sampleId,
    run_id: runId,
    attempt_id: `attempt-${index}`,
    viewport_id: "desktop",
    started_at: "2026-08-13T00:00:00.000Z",
    finished_at: "2026-08-13T00:00:01.000Z",
    elapsed_ms: 1000,
    terminal_stage: index < 5 ? "serialization" : "http_navigation",
    outcome_code: index < 5 ? "success" : "http_error",
    retry_number: 0,
    document_observed: index < 5,
    dom_observed: index < 5,
    http_status_if_observed: index < 5 ? 200 : 404,
    resolved_origin_hash_if_observed: index < 5 ? "a".repeat(64) : null,
    browser_engine: "chromium-compatible",
    browser_version: "139.0.0",
    collector_version: "test"
  }));
  const captures = attempts.slice(0, 5).map((attempt) => ({ sample_id: attempt.sample_id, run_id: runId, attempt_id: attempt.attempt_id, viewport_id: "desktop", payload: payload() }));
  return {
    capture: { schema_version: "vibebench.option_b.local_pilot_capture.v1", run_id: runId, runtime, privacy: { urls_persisted: false, raw_html_persisted: false, text_persisted: false, screenshots_created: false }, summary: { attempted: 6, successful: 5, failed: 1 }, captures },
    audit: { schema_version: "vibebench.option_b.local_pilot_attempt_audit.v1", run_id: runId, runtime, summary: { attempted: 6, successful: 5, failed: 1 }, attempts }
  };
}

test("v3 pilot review accepts five complete successes but keeps full batch blocked", () => {
  const result = reviewOptionBV3Pilot({ ...artifacts(), captureContract, reviewContract, expectedSampleIds: ids, captureBytes: 10000, auditBytes: 5000 });
  assert.equal(result.first_run_approved, true);
  assert.equal(result.full_batch_approved, false);
  assert.equal(result.status, "FIRST_RUN_TECHNICALLY_ACCEPTABLE_REPEAT_REQUIRED");
  assert.equal(result.gates.every((gate) => gate.passed), true);
});

test("v3 pilot review fails closed on privacy and payload contract violations", () => {
  const fixture = artifacts();
  fixture.capture.captures[0].target_url = "https://example.com";
  delete fixture.capture.captures[1].payload.public_assets.stylesheet_fetch_outcomes;
  const result = reviewOptionBV3Pilot({ ...fixture, captureContract, reviewContract, expectedSampleIds: ids, captureBytes: 10000, auditBytes: 5000 });
  assert.equal(result.first_run_approved, false);
  assert.equal(result.gates.find((gate) => gate.id === "privacy").passed, false);
  assert.equal(result.gates.find((gate) => gate.id === "payload_completeness").passed, false);
});

test("v3 pilot review rejects a technically successful capture from an unapproved browser surface", () => {
  const fixture = artifacts();
  fixture.capture.runtime = { ...fixture.capture.runtime, source: "codex-in-app-browser-diagnostic" };
  fixture.audit.runtime = fixture.capture.runtime;
  const result = reviewOptionBV3Pilot({ ...fixture, captureContract, reviewContract, expectedSampleIds: ids, captureBytes: 10000, auditBytes: 5000 });
  assert.equal(result.first_run_approved, false);
  assert.deepEqual(result.gates.find((gate) => gate.id === "runtime_contract").findings, ["capture_runtime_source_not_approved", "audit_runtime_source_not_approved"]);
});
