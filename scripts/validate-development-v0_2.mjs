import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const manifestPath = path.resolve(process.argv[2] || "outputs/development_v0_2/vibebench_development_extension_40_v0_2.json");
const developmentPath = path.resolve("outputs/vibebench_production_browser_capture_post_hardening_2026-08-09.json");
const holdoutPath = path.resolve("outputs/holdout_v0_1/blind_run_v0_1_2026-08-10/vibebench_blind_holdout_raw_results_v0_1.json");
const requiredReadyFields = ["target_url", "provenance_url", "provenance_type", "provenance_summary", "collected_at", "notes"];
const humanProjectCutoff = Date.parse("2022-11-30T00:00:00Z");
const expectedGroups = {
  AI_REPLIT_AGENT_NEW: { label: "AI", builder: "Replit Agent" },
  AI_BOLT_NEW: { label: "AI", builder: "Bolt" },
  HUMAN_MODERN_SAAS_NEW: { label: "HUMAN", builder: "" },
  HUMAN_MODERN_APP_NEW: { label: "HUMAN", builder: "" }
};
const sharedDeploymentSuffixes = ["replit.app", "repl.co", "bolt.host", "lovable.app", "vercel.app", "netlify.app", "pages.dev"];

function normalizedUrl(value) {
  if (!value) return "";
  const url = new URL(value);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

function host(value) {
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
}

function leakageHost(value) {
  const hostname = host(value);
  return sharedDeploymentSuffixes.find((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)) || hostname;
}

export function validateDevelopmentExtension({ manifest, existingDevelopment, holdout }) {
  const errors = [];
  const warnings = [];
  const rows = manifest?.samples || [];
  if (rows.length !== 40) errors.push(`Expected 40 slots, found ${rows.length}.`);
  const ids = new Set();
  const targetOwners = new Map();
  const provenanceOwners = new Map();
  const existingUrls = new Set(existingDevelopment.map((row) => normalizedUrl(row.url)));
  const existingHosts = new Set(existingDevelopment.map((row) => leakageHost(row.url)));
  const holdoutUrls = new Set(holdout.map((row) => normalizedUrl(row.target_url)));
  const holdoutHosts = new Set(holdout.map((row) => leakageHost(row.target_url)));

  for (const row of rows) {
    const expected = expectedGroups[row.target_group];
    if (!expected) errors.push(`${row.sample_id}: unknown target_group ${row.target_group}.`);
    if (expected && row.label !== expected.label) errors.push(`${row.sample_id}: label must be ${expected.label}.`);
    if (expected && row.builder !== expected.builder) errors.push(`${row.sample_id}: builder must be ${expected.builder || "empty"}.`);
    if (ids.has(row.sample_id)) errors.push(`${row.sample_id}: duplicate sample_id.`);
    ids.add(row.sample_id);
    if (!["PENDING", "READY"].includes(row.status)) errors.push(`${row.sample_id}: invalid status ${row.status}.`);

    const partiallyFilled = Boolean(row.target_url || row.provenance_url || row.status !== "PENDING");
    if (!partiallyFilled) continue;
    for (const field of requiredReadyFields) if (!row[field]) errors.push(`${row.sample_id}: ${field} is required for a reviewed row.`);
    let target;
    let provenance;
    try { target = normalizedUrl(row.target_url); } catch { errors.push(`${row.sample_id}: invalid target_url.`); }
    try { provenance = normalizedUrl(row.provenance_url); } catch { errors.push(`${row.sample_id}: invalid provenance_url.`); }
    if (target && !target.startsWith("https://")) errors.push(`${row.sample_id}: target_url must use HTTPS.`);
    if (provenance && !provenance.startsWith("https://")) errors.push(`${row.sample_id}: provenance_url must use HTTPS.`);
    if (target && existingUrls.has(target)) errors.push(`${row.sample_id}: target_url overlaps existing Development data.`);
    if (target && holdoutUrls.has(target)) errors.push(`${row.sample_id}: target_url overlaps the completed holdout.`);
    if (target && existingHosts.has(leakageHost(target))) errors.push(`${row.sample_id}: target host overlaps existing Development data.`);
    if (target && holdoutHosts.has(leakageHost(target))) errors.push(`${row.sample_id}: target host overlaps the completed holdout.`);
    if (target && provenance && host(target) === host(provenance)) errors.push(`${row.sample_id}: provenance must use an independent host.`);
    if (target && targetOwners.has(target)) errors.push(`${row.sample_id}: duplicate target_url with ${targetOwners.get(target)}.`);
    const provenanceReference = provenance ? `${provenance}#${row.provenance_locator || ""}` : "";
    if (provenanceReference && provenanceOwners.has(provenanceReference)) warnings.push(`${row.sample_id}: provenance reference is also used by ${provenanceOwners.get(provenanceReference)}.`);
    if (target) targetOwners.set(target, row.sample_id);
    if (provenanceReference) provenanceOwners.set(provenanceReference, row.sample_id);

    if (row.status === "READY") {
      for (const field of ["development_overlap_check", "holdout_overlap_check", "provenance_review"]) {
        if (row[field] !== "PASS") errors.push(`${row.sample_id}: ${field} must be PASS for READY.`);
      }
      if (row.label === "HUMAN") {
        if (row.provenance_type !== "official_public_source_repository") errors.push(`${row.sample_id}: Human controls require official_public_source_repository provenance.`);
        if (host(row.provenance_url) !== "github.com") errors.push(`${row.sample_id}: Human control provenance must point to the reviewed public GitHub repository.`);
        if (!row.label_definition) errors.push(`${row.sample_id}: label_definition is required for a Human control.`);
        if (!row.label_limitation) errors.push(`${row.sample_id}: label_limitation is required for a Human control.`);
        const projectStartedAt = Date.parse(row.project_started_at || "");
        if (!Number.isFinite(projectStartedAt)) errors.push(`${row.sample_id}: valid project_started_at is required for a Human control.`);
        else if (projectStartedAt >= humanProjectCutoff) errors.push(`${row.sample_id}: Human control project must predate 2022-11-30.`);
        if (!row.baseline_scan?.checked_at || !row.baseline_scan?.level || !Array.isArray(row.baseline_scan?.stack_signals)) {
          errors.push(`${row.sample_id}: complete baseline_scan is required for a Human control.`);
        }
        if (row.baseline_scan?.endpoint !== "https://vibe-bench-cyan.vercel.app/api/scan") {
          errors.push(`${row.sample_id}: baseline_scan must identify the production endpoint.`);
        }
      }
      if (row.label === "AI") {
        if (!["official_builder_showcase", "official_builder_article", "independent_hackathon_submission"].includes(row.provenance_type)) {
          errors.push(`${row.sample_id}: AI controls require reviewed builder-specific provenance.`);
        }
        if (!row.provenance_locator) errors.push(`${row.sample_id}: provenance_locator is required for an AI control.`);
        if (!row.label_definition) errors.push(`${row.sample_id}: label_definition is required for an AI control.`);
        if (!row.label_limitation) errors.push(`${row.sample_id}: label_limitation is required for an AI control.`);
        if (!row.baseline_scan?.checked_at || !row.baseline_scan?.level || !Array.isArray(row.baseline_scan?.stack_signals)) {
          errors.push(`${row.sample_id}: complete baseline_scan is required for an AI control.`);
        }
        if (row.baseline_scan?.endpoint !== "https://vibe-bench-cyan.vercel.app/api/scan") {
          errors.push(`${row.sample_id}: baseline_scan must identify the production endpoint.`);
        }
      }
    }
  }

  for (const group of Object.keys(expectedGroups)) {
    const count = rows.filter((row) => row.target_group === group).length;
    if (count !== 10) errors.push(`${group}: expected 10 slots, found ${count}.`);
  }
  return {
    rows: rows.length,
    ready: rows.filter((row) => row.status === "READY").length,
    pending: rows.filter((row) => row.status === "PENDING").length,
    groups: Object.fromEntries(Object.keys(expectedGroups).map((group) => [group, rows.filter((row) => row.target_group === group && row.status === "READY").length])),
    warnings,
    errors
  };
}

if (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [manifest, existingDevelopment, holdoutRaw] = await Promise.all([
    readFile(manifestPath, "utf8").then(JSON.parse),
    readFile(developmentPath, "utf8").then(JSON.parse),
    readFile(holdoutPath, "utf8").then(JSON.parse)
  ]);
  const result = validateDevelopmentExtension({ manifest, existingDevelopment, holdout: holdoutRaw.flattenedResults });
  process.stdout.write(`${JSON.stringify({ manifest: path.relative(process.cwd(), manifestPath), ...result }, null, 2)}\n`);
  if (result.errors.length) process.exitCode = 1;
}
