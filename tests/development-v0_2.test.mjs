import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { validateDevelopmentExtension } from "../scripts/validate-development-v0_2.mjs";

const manifest = JSON.parse(await readFile("outputs/development_v0_2/vibebench_development_extension_40_v0_2.json", "utf8"));
const existingDevelopment = JSON.parse(await readFile("outputs/vibebench_production_browser_capture_post_hardening_2026-08-09.json", "utf8"));
const holdoutRaw = JSON.parse(await readFile("outputs/holdout_v0_1/blind_run_v0_1_2026-08-10/vibebench_blind_holdout_raw_results_v0_1.json", "utf8"));

test("preallocates a balanced 40-slot v0.2 Development extension", () => {
  const result = validateDevelopmentExtension({ manifest, existingDevelopment, holdout: holdoutRaw.flattenedResults });
  assert.equal(result.rows, 40);
  assert.equal(result.ready, 40);
  assert.equal(result.pending, 0);
  assert.deepEqual(result.groups, {
    AI_REPLIT_AGENT_NEW: 10,
    AI_BOLT_NEW: 10,
    HUMAN_MODERN_SAAS_NEW: 10,
    HUMAN_MODERN_APP_NEW: 10
  });
  assert.deepEqual(result.errors, []);
});

test("new Replit Agent controls use custom domains, explicit provenance, and frozen baselines", () => {
  const replit = manifest.samples.filter((row) => row.target_group === "AI_REPLIT_AGENT_NEW" && row.status === "READY");
  assert.equal(replit.length, 10);
  for (const row of replit) {
    const targetHost = new URL(row.target_url).hostname.replace(/^www\./, "");
    assert.ok(!targetHost.endsWith(".replit.app"));
    assert.ok(!targetHost.endsWith(".repl.co"));
    assert.notEqual(new URL(row.provenance_url).hostname.replace(/^www\./, ""), targetHost);
    assert.equal(row.independence_review, "PASS");
    assert.ok(row.project_family_id);
    assert.match(row.label_limitation, /does not|not quantify|cannot attribute/i);
    assert.ok(["indicative", "indeterminate"].includes(row.baseline_scan.level));
  }
  assert.equal(replit.filter((row) => row.baseline_scan.level === "indicative").length, 1);
  assert.equal(replit.filter((row) => row.baseline_scan.level === "indeterminate").length, 9);
});

test("new Bolt controls have specific third-party provenance and disclose baseline outcomes", () => {
  const bolt = manifest.samples.filter((row) => row.target_group === "AI_BOLT_NEW" && row.status === "READY");
  assert.equal(bolt.length, 10);
  for (const row of bolt) {
    assert.ok(["independent_hackathon_submission", "independent_reviewed_directory"].includes(row.provenance_type));
    const expectedProvenanceHost = row.provenance_type === "independent_reviewed_directory" ? "hot100.ai" : "devpost.com";
    assert.equal(new URL(row.provenance_url).hostname, expectedProvenanceHost);
    assert.match(row.label_limitation, /does not (?:quantify|attribute)/i);
    assert.ok(["direct", "indeterminate"].includes(row.baseline_scan.level));
  }
  assert.equal(bolt.filter((row) => row.baseline_scan.level === "direct").length, 1);
  assert.equal(bolt.filter((row) => row.baseline_scan.level === "indeterminate").length, 9);
});

test("Human controls use pre-generative public-source provenance and disclose label limits", () => {
  const humans = manifest.samples.filter((row) => row.label === "HUMAN");
  assert.equal(humans.length, 20);
  for (const row of humans) {
    assert.equal(row.status, "READY");
    assert.equal(row.provenance_type, "official_public_source_repository");
    assert.ok(Date.parse(row.project_started_at) < Date.parse("2022-11-30T00:00:00Z"));
    assert.match(row.label_limitation, /does not prove/i);
    assert.ok(row.baseline_scan.checked_at);
    assert.ok(["indicative", "indeterminate"].includes(row.baseline_scan.level));
  }
});

test("rejects a post-cutoff project as a Human control", () => {
  const candidate = structuredClone(manifest);
  candidate.samples.find((row) => row.label === "HUMAN").project_started_at = "2024-01-01T00:00:00Z";
  const result = validateDevelopmentExtension({ manifest: candidate, existingDevelopment, holdout: holdoutRaw.flattenedResults });
  assert.ok(result.errors.some((error) => error.includes("must predate 2022-11-30")));
});

test("blocks reuse of an existing Development or holdout target", () => {
  const candidate = structuredClone(manifest);
  Object.assign(candidate.samples[0], {
    target_url: existingDevelopment[0].url,
    provenance_url: "https://example.org/provenance",
    provenance_type: "official_builder_story",
    provenance_summary: "Reviewed exact deployment mapping.",
    collected_at: "2026-08-10",
    notes: "Overlap regression fixture.",
    development_overlap_check: "PASS",
    holdout_overlap_check: "PASS",
    provenance_review: "PASS",
    status: "READY"
  });
  Object.assign(candidate.samples[1], {
    target_url: holdoutRaw.flattenedResults[0].target_url,
    provenance_url: "https://example.net/provenance",
    provenance_type: "official_builder_story",
    provenance_summary: "Reviewed exact deployment mapping.",
    collected_at: "2026-08-10",
    notes: "Holdout overlap regression fixture.",
    development_overlap_check: "PASS",
    holdout_overlap_check: "PASS",
    provenance_review: "PASS",
    status: "READY"
  });
  const result = validateDevelopmentExtension({ manifest: candidate, existingDevelopment, holdout: holdoutRaw.flattenedResults });
  assert.ok(result.errors.some((error) => error.includes("overlaps existing Development")));
  assert.ok(result.errors.some((error) => error.includes("overlaps the completed holdout")));
});

test("treats separate tenants on a shared deployment platform as holdout overlap", () => {
  const candidate = structuredClone(manifest);
  Object.assign(candidate.samples[0], {
    target_url: "https://new-unseen-tenant.replit.app",
    provenance_url: "https://replit.com/usecases/example",
    provenance_type: "official_builder_showcase",
    provenance_locator: "Example deployment",
    provenance_summary: "Official builder page maps the example deployment.",
    baseline_scan: {
      endpoint: "https://vibe-bench-cyan.vercel.app/api/scan",
      checked_at: "2026-08-10",
      level: "indeterminate",
      stack_signals: []
    },
    collected_at: "2026-08-10",
    notes: "Shared-host leakage regression fixture.",
    development_overlap_check: "PASS",
    holdout_overlap_check: "PASS",
    provenance_review: "PASS",
    status: "READY"
  });
  const result = validateDevelopmentExtension({ manifest: candidate, existingDevelopment, holdout: holdoutRaw.flattenedResults });
  assert.ok(result.errors.some((error) => error.includes("target host overlaps the completed holdout")));
});

test("rejects two Development rows from the same reviewed project family", () => {
  const candidate = structuredClone(manifest);
  candidate.samples[1].project_family_id = candidate.samples[0].project_family_id;
  const result = validateDevelopmentExtension({ manifest: candidate, existingDevelopment, holdout: holdoutRaw.flattenedResults });
  assert.ok(result.errors.some((error) => error.includes("project_family_id overlaps")));
});
