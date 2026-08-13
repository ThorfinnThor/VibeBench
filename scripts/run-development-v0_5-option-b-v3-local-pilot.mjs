import { createHash, randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { resolveLocalChromiumRuntime } from "../lib/local-chromium-runtime.mjs";
import { assertMinimalPilotPrivacy, extractRenderedSurface, OPTION_B_V3_COLLECTOR_VERSION, waitForRenderedReadiness } from "../lib/option-b-v3-minimal-capture.mjs";
import { assertPublicAddresses, normalizePublicUrl } from "../lib/public-url-policy.mjs";

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}
const manifestPath = path.resolve(argument("--manifest", "outputs/development_v0_5_option_b_v3/option_b_local_pilot_manifest_v1.json"));
const outputPath = path.resolve(argument("--output", "outputs/development_v0_5_option_b_v3/option_b_local_pilot_capture_v1.json"));
const auditPath = path.resolve(argument("--audit", "outputs/development_v0_5_option_b_v3/option_b_local_pilot_attempt_audit_v1.json"));
const contractPath = path.resolve("outputs/development_v0_5_option_b_v3/option_b_capture_contract_v3.json");
const [manifestText, contractText] = await Promise.all([readFile(manifestPath, "utf8"), readFile(contractPath, "utf8")]);
const manifest = JSON.parse(manifestText);
const contract = JSON.parse(contractText);

if (contract.status !== "LOCAL_MINIMAL_PILOT_APPROVED" || !contract.execution_gate.pilot_may_execute) throw new Error("Local v3 pilot is not approved by the frozen contract.");
if (manifest.status !== "LABEL_BLIND_TECHNICAL_PILOT_ONLY" || manifest.collector_visible_fields.join(",") !== "sample_id,target_url") throw new Error("Pilot manifest is not label-blind.");
if (manifest.rows.length > 10 || manifest.rows.some((row) => Object.keys(row).sort().join(",") !== "sample_id,target_url")) throw new Error("Pilot manifest exposes prohibited fields or exceeds pilot size.");

const runtime = await resolveLocalChromiumRuntime({ bundledPath: chromium.executablePath() });
const browser = await chromium.launch({ executablePath: runtime.executable_path, headless: true });
const runId = randomUUID();
const captures = [];
const attempts = [];
const hostChecks = new Map();
const originSalt = randomUUID();
const outcomeCodes = new Set(contract.terminal_outcomes.map((outcome) => outcome.code));

async function publicHost(hostname) {
  const host = hostname.toLowerCase();
  if (!hostChecks.has(host)) hostChecks.set(host, lookup(host, { all: true, verbatim: true }).then((addresses) => assertPublicAddresses(addresses)));
  return hostChecks.get(host);
}

function classify(error, stage, status) {
  const message = String(error?.message || error || "");
  if (/gültige öffentliche URL/i.test(message)) return "invalid_url";
  if (/Nur öffentliche HTTP|Zugangsdaten|Standardports|nicht öffentliche|reservierte|lokale/i.test(message)) return "private_or_disallowed_target";
  if (/ENOTFOUND|ERR_NAME_NOT_RESOLVED|dns/i.test(message)) return "dns_unresolved";
  if (/ECONNREFUSED|ECONNRESET|ERR_CONNECTION_|socket|tcp/i.test(message)) return "tcp_connection_failed";
  if (/CERT|certificate|TLS|SSL/i.test(message)) return "tls_certificate_error";
  if (/ERR_BLOCKED_BY_CLIENT|blocked/i.test(message)) return "client_or_policy_blocked";
  if (status === 401 || status === 403 || status === 429) return "http_blocked_or_denied";
  if (status >= 400) return "http_error";
  if (/dom_readiness_timeout/i.test(message)) return "dom_readiness_timeout";
  if (/timeout/i.test(message)) return stage === "http_navigation" ? "navigation_timeout" : "dom_readiness_timeout";
  if (stage === "computed_style_extraction") return "computed_style_extraction_failed";
  if (stage === "structural_aggregation") return "structural_aggregation_failed";
  if (stage === "serialization") return "serialization_failed";
  return "unknown_technical_error";
}

for (const [index, row] of manifest.rows.entries()) {
  const started = new Date();
  const startedMs = Date.now();
  const attemptId = randomUUID();
  let context;
  let stage = "input_validation";
  let documentObserved = false;
  let domObserved = false;
  let status = null;
  let resolvedOriginHash = null;
  try {
    const target = normalizePublicUrl(row.target_url);
    stage = "dns_resolution";
    await publicHost(target.hostname);
    context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: contract.runtime_requirements.locale,
      timezoneId: contract.runtime_requirements.timezone,
      colorScheme: "light",
      reducedMotion: "reduce",
      deviceScaleFactor: 1,
      serviceWorkers: "block",
      userAgent: `VibeBenchResearch/${OPTION_B_V3_COLLECTOR_VERSION}`
    });
    await context.route("**/*", async (route) => {
      const requestUrl = new URL(route.request().url());
      if (["data:", "blob:", "about:"].includes(requestUrl.protocol)) return route.continue();
      if (!["http:", "https:"].includes(requestUrl.protocol)) return route.abort("blockedbyclient");
      try { await publicHost(requestUrl.hostname); await route.continue(); } catch { await route.abort("blockedbyclient"); }
    });
    const page = await context.newPage();
    stage = "http_navigation";
    const response = await page.goto(target.toString(), { waitUntil: "domcontentloaded", timeout: contract.budgets.navigation_timeout_ms });
    documentObserved = true;
    status = response?.status() || null;
    if (status && status >= 400) throw new Error(`HTTP ${status}`);
    resolvedOriginHash = createHash("sha256").update(`${originSalt}\0${new URL(page.url()).origin}`).digest("hex");
    stage = "dom_readiness";
    await waitForRenderedReadiness(page, {
      timeout_ms: contract.budgets.readiness_timeout_ms,
      sampling_interval_ms: contract.readiness.sampling_interval_ms,
      required_consecutive_stable_samples: contract.readiness.required_consecutive_stable_samples,
      dimension_delta_px_max: contract.readiness.stable_if_document_dimensions_delta_px_max,
      visible_element_delta_share_max: contract.readiness.stable_if_visible_element_count_delta_share_max
    });
    domObserved = true;
    stage = "rendered_content_eligibility";
    const eligibility = await page.evaluate(() => ({ text: (document.body?.innerText || "").length, elements: document.body?.querySelectorAll("*").length || 0 }));
    if (eligibility.text < contract.rendered_content_eligibility.minimum_visible_text_characters || eligibility.elements < contract.rendered_content_eligibility.minimum_visible_elements) throw new Error("ineligible_empty_or_interstitial");
    stage = "computed_style_extraction";
    const payload = await extractRenderedSurface(page, { maximumVisibleElements: contract.budgets.maximum_visible_elements });
    stage = "structural_aggregation";
    if (!payload.visible_elements.length || !payload.document.visible_element_count) throw new Error("structural_aggregation_failed");
    stage = "serialization";
    JSON.stringify(payload);
    captures.push({ sample_id: row.sample_id, run_id: runId, attempt_id: attemptId, viewport_id: "desktop", payload });
    attempts.push({ sample_id: row.sample_id, run_id: runId, attempt_id: attemptId, viewport_id: "desktop", started_at: started.toISOString(), finished_at: new Date().toISOString(), elapsed_ms: Date.now() - startedMs, terminal_stage: "serialization", outcome_code: "success", retry_number: 0, document_observed: documentObserved, dom_observed: domObserved, http_status_if_observed: status, resolved_origin_hash_if_observed: resolvedOriginHash, browser_engine: "chromium-compatible", browser_version: runtime.version, collector_version: OPTION_B_V3_COLLECTOR_VERSION });
    process.stdout.write(`${index + 1}/${manifest.rows.length} ${row.sample_id} success\n`);
  } catch (error) {
    const outcomeCode = String(error?.message || "").includes("ineligible_empty_or_interstitial") ? "ineligible_empty_or_interstitial" : classify(error, stage, status);
    if (!outcomeCodes.has(outcomeCode)) throw new Error(`Collector emitted unknown outcome ${outcomeCode}.`);
    attempts.push({ sample_id: row.sample_id, run_id: runId, attempt_id: attemptId, viewport_id: "desktop", started_at: started.toISOString(), finished_at: new Date().toISOString(), elapsed_ms: Date.now() - startedMs, terminal_stage: stage, outcome_code: outcomeCode, retry_number: 0, document_observed: documentObserved, dom_observed: domObserved, http_status_if_observed: status, resolved_origin_hash_if_observed: resolvedOriginHash, browser_engine: "chromium-compatible", browser_version: runtime.version, collector_version: OPTION_B_V3_COLLECTOR_VERSION });
    process.stdout.write(`${index + 1}/${manifest.rows.length} ${row.sample_id} ${outcomeCode}\n`);
  } finally {
    await context?.close();
  }
}
await browser.close();

const common = {
  generated_at: new Date().toISOString(),
  run_id: runId,
  status: "LOCAL_LABEL_BLIND_TECHNICAL_PILOT",
  runtime: { engine: "chromium-compatible", version: runtime.version, source: runtime.source, playwright_version: "1.54.2" },
  inputs: {
    manifest: { path: path.relative(process.cwd(), manifestPath), sha256: createHash("sha256").update(manifestText).digest("hex") },
    contract: { path: path.relative(process.cwd(), contractPath), sha256: createHash("sha256").update(contractText).digest("hex") }
  }
};
const captureOutput = { schema_version: "vibebench.option_b.local_pilot_capture.v1", ...common, privacy: { urls_persisted: false, raw_html_persisted: false, text_persisted: false, screenshots_created: false }, summary: { attempted: manifest.rows.length, successful: captures.length, failed: manifest.rows.length - captures.length }, captures };
const auditOutput = { schema_version: "vibebench.option_b.local_pilot_attempt_audit.v1", ...common, summary: { attempted: attempts.length, successful: attempts.filter((attempt) => attempt.outcome_code === "success").length, failed: attempts.filter((attempt) => attempt.outcome_code !== "success").length }, attempts };
assertMinimalPilotPrivacy(captureOutput);
assertMinimalPilotPrivacy(auditOutput);
await Promise.all([writeFile(outputPath, `${JSON.stringify(captureOutput, null, 2)}\n`), writeFile(auditPath, `${JSON.stringify(auditOutput, null, 2)}\n`)]);
process.stdout.write(`${JSON.stringify({ capture: path.relative(process.cwd(), outputPath), audit: path.relative(process.cwd(), auditPath), runtime: common.runtime, summary: captureOutput.summary }, null, 2)}\n`);
