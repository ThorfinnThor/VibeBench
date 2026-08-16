import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  assertOptionBV4Payload,
  extractOptionBV4Surface,
  installOptionBV4SurfaceHelpers,
  OPTION_B_V4_COLLECTOR_VERSION,
  waitForOptionBV4Readiness
} from "../lib/option-b-v4-capture.mjs";
import { normalizePublicUrl } from "../lib/public-url-policy.mjs";

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function requireIsolatedRuntime() {
  const proxy = process.env.HTTPS_PROXY;
  if (process.env.OPTION_B_V4_ISOLATED_RUNTIME !== "1") throw new Error("The v4 collector refuses to run outside the isolated runtime.");
  if (proxy !== "http://egress:8080" || process.env.HTTP_PROXY !== proxy) throw new Error("The required isolated egress proxy is not configured.");
  for (const name of ["OPTION_B_V4_COLLECTOR_IMAGE", "OPTION_B_V4_EGRESS_IMAGE", "OPTION_B_V4_COLLECTOR_BASE_DIGEST", "OPTION_B_V4_EGRESS_BASE_DIGEST", "OPTION_B_V4_COLLECTOR_SOURCE_SHA256", "OPTION_B_V4_EGRESS_SOURCE_SHA256"]) if (!process.env[name]) throw new Error(`${name} must record the frozen runtime identity.`);
}

function artifactPath(name) {
  const root = path.resolve(process.env.OPTION_B_V4_ARTIFACT_ROOT || "/artifacts");
  const candidate = path.resolve(argument(name, path.join(root, name === "--output" ? "capture.json" : "attempt-audit.json")));
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) throw new Error(`${name} must stay inside the artifact root.`);
  return candidate;
}

async function atomicJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, file);
}

function assertNoUnexpectedSensitiveFields(value, at = "output") {
  if (Array.isArray(value)) { value.forEach((item, index) => assertNoUnexpectedSensitiveFields(item, `${at}[${index}]`)); return; }
  if (!value || typeof value !== "object") return;
  const blocked = /^(?:target_url|resolved_url|url|hostname|label|target|target_group|cohort|provenance_url|raw_html|html|visible_text|text|screenshot|image)$/i;
  for (const [key, item] of Object.entries(value)) {
    if (blocked.test(key)) throw new Error(`Prohibited persisted field at ${at}.${key}`);
    assertNoUnexpectedSensitiveFields(item, `${at}.${key}`);
  }
}

function classify(error, stage, status) {
  const message = String(error?.message || error || "");
  if (/gültige öffentliche URL/i.test(message)) return "invalid_url";
  if (/Nur öffentliche HTTP|Zugangsdaten|Standardports|nicht öffentliche|reservierte|lokale/i.test(message)) return "private_or_disallowed_target";
  if (/ERR_TUNNEL_CONNECTION_FAILED|proxy|egress|blockedbyclient/i.test(message)) return "egress_policy_blocked";
  if (/ENOTFOUND|ERR_NAME_NOT_RESOLVED|dns/i.test(message)) return "dns_unresolved";
  if (/ECONNREFUSED|ECONNRESET|ERR_CONNECTION_|socket|tcp/i.test(message)) return "tcp_connection_failed";
  if (/CERT|certificate|TLS|SSL/i.test(message)) return "tls_certificate_error";
  if (status === 401 || status === 403 || status === 429) return "http_blocked_or_denied";
  if (status >= 400) return "http_error";
  if (/capture_surface_unstable/i.test(message)) return "capture_surface_unstable";
  if (/dom_readiness_timeout/i.test(message)) return "dom_readiness_timeout";
  if (/timeout/i.test(message)) return stage === "http_navigation" ? "navigation_timeout" : "dom_readiness_timeout";
  if (stage === "computed_style_extraction") return "computed_style_extraction_failed";
  if (stage === "structural_aggregation") return "structural_aggregation_failed";
  if (stage === "serialization") return "serialization_failed";
  return "unknown_technical_error";
}

requireIsolatedRuntime();
const manifestPath = path.resolve(argument("--manifest", "outputs/development_v0_5_option_b_v4/option_b_v4_pilot_manifest.json"));
const contractPath = path.resolve(argument("--contract", "outputs/development_v0_5_option_b_v4/option_b_capture_contract_v4.json"));
const waiverPath = path.resolve(argument("--waiver", "outputs/development_v0_5_option_b_v4/option_b_v4_repeat_waiver_v1.json"));
const outputPath = artifactPath("--output");
const auditPath = artifactPath("--audit");
const [manifestText, contractText] = await Promise.all([readFile(manifestPath, "utf8"), readFile(contractPath, "utf8")]);
const manifest = JSON.parse(manifestText);
const contract = JSON.parse(contractText);
if (contract.status !== "ISOLATED_SIX_SITE_PILOT_APPROVED" || !contract.execution_gate.six_site_pilot_may_execute || contract.execution_gate.full_81_site_run_may_execute) throw new Error("The frozen v4 execution gate does not approve this pilot.");
const isPilot = manifest.status === "LABEL_BLIND_TECHNICAL_PILOT_ONLY" && manifest.rows.length === 6;
const isExtension = manifest.status === "LABEL_BLIND_TECHNICAL_EXTENSION_20_FROZEN" && manifest.rows.length === 20;
let waiverText = null;
if (isExtension) {
  waiverText = await readFile(waiverPath, "utf8");
  const waiver = JSON.parse(waiverText);
  if (waiver.status !== "TECHNICAL_REPEAT_ACCEPTED_WITH_EXPLICIT_TIME_WINDOW_WAIVER" || waiver.original_time_gate_passed !== false || waiver.approved_effect?.fixed_label_blind_extension_20_may_execute !== true || waiver.approved_effect?.full_81_site_run_may_execute !== false) throw new Error("The fixed extension lacks an explicit valid repeat adjudication.");
}
if ((!isPilot && !isExtension) || manifest.collector_visible_fields.join(",") !== "sample_id,target_url") throw new Error("The manifest is not an approved label-blind v4 collection manifest.");
if (manifest.rows.some((row) => Object.keys(row).sort().join(",") !== "sample_id,target_url")) throw new Error("The manifest exposes prohibited collector fields.");

const runId = randomUUID();
const originSalt = randomUUID();
const fixedUserAgent = `VibeBenchResearch/${OPTION_B_V4_COLLECTOR_VERSION}`;
const allowedOutcomes = new Set(contract.terminal_outcomes.map(({ code }) => code));
const captures = [];
const attempts = [];
let browser;
let browserVersion;

try {
  browser = await chromium.launch({
    headless: true,
    proxy: { server: process.env.HTTPS_PROXY },
    args: ["--force-webrtc-ip-handling-policy=disable_non_proxied_udp", "--webrtc-ip-handling-policy=disable_non_proxied_udp"]
  });
  browserVersion = await browser.version();
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
      context = await browser.newContext({
        viewport: { width: contract.viewports[0].width, height: contract.viewports[0].height },
        locale: contract.runtime_requirements.locale,
        timezoneId: contract.runtime_requirements.timezone,
        colorScheme: "light",
        reducedMotion: "reduce",
        deviceScaleFactor: 1,
        serviceWorkers: "block",
        acceptDownloads: false,
        userAgent: fixedUserAgent
      });
      await context.route("**/*", async (route) => {
        const request = route.request();
        if (!["GET", "HEAD"].includes(request.method())) return route.abort("blockedbyclient");
        let requestUrl;
        try { requestUrl = new URL(request.url()); } catch { return route.abort("blockedbyclient"); }
        if (["data:", "blob:", "about:"].includes(requestUrl.protocol)) return route.continue();
        if (!["http:", "https:"].includes(requestUrl.protocol)) return route.abort("blockedbyclient");
        try { normalizePublicUrl(requestUrl.toString()); return route.continue(); }
        catch { return route.abort("blockedbyclient"); }
      });
      if (typeof context.routeWebSocket === "function") await context.routeWebSocket("**/*", (socket) => socket.close());
      const page = await context.newPage();
      stage = "http_navigation";
      const response = await page.goto(target.toString(), { waitUntil: "domcontentloaded", timeout: contract.budgets.navigation_timeout_ms });
      documentObserved = true;
      status = response?.status() || null;
      if (status && status >= 400) throw new Error(`HTTP ${status}`);
      resolvedOriginHash = createHash("sha256").update(`${originSalt}\0${new URL(page.url()).origin}`).digest("hex");
      await installOptionBV4SurfaceHelpers(page);
      stage = "dom_readiness";
      await waitForOptionBV4Readiness(page, {
        timeout_ms: contract.budgets.readiness_timeout_ms,
        sampling_interval_ms: contract.readiness.sampling_interval_ms,
        required_consecutive_stable_samples: contract.readiness.required_consecutive_stable_samples,
        dimension_delta_px_max: contract.readiness.stable_if_document_dimensions_delta_px_max,
        visible_element_delta_share_max: contract.readiness.stable_if_visible_element_count_delta_share_max
      });
      domObserved = true;
      stage = "rendered_content_eligibility";
      const eligibility = await page.evaluate(() => {
        const helper = window.__VIBEBENCH_OPTION_B_V4_SURFACE__;
        return { text: (document.body?.innerText || "").length, elements: [...document.body.querySelectorAll("*")].filter(helper.isVisible).length };
      });
      if (eligibility.text < contract.rendered_content_eligibility.minimum_visible_text_characters || eligibility.elements < contract.rendered_content_eligibility.minimum_visible_elements) throw new Error("ineligible_empty_or_interstitial");
      stage = "computed_style_extraction";
      const payload = await Promise.race([
        extractOptionBV4Surface(page, contract.budgets),
        new Promise((_, reject) => setTimeout(() => reject(new Error("computed_style_extraction_timeout")), contract.budgets.extraction_timeout_ms))
      ]);
      stage = "structural_aggregation";
      assertOptionBV4Payload(payload);
      stage = "serialization";
      JSON.stringify(payload);
      captures.push({ sample_id: row.sample_id, run_id: runId, attempt_id: attemptId, viewport_id: "desktop", payload });
      attempts.push({ sample_id: row.sample_id, run_id: runId, attempt_id: attemptId, viewport_id: "desktop", started_at: started.toISOString(), finished_at: new Date().toISOString(), elapsed_ms: Date.now() - startedMs, terminal_stage: "serialization", outcome_code: "success", retry_number: 0, document_observed: documentObserved, dom_observed: domObserved, http_status_if_observed: status, resolved_origin_hash_if_observed: resolvedOriginHash, browser_engine: "chromium", browser_version: browserVersion, collector_version: OPTION_B_V4_COLLECTOR_VERSION });
      process.stdout.write(`${index + 1}/${manifest.rows.length} ${row.sample_id} success\n`);
    } catch (error) {
      const outcome = String(error?.message || "").includes("ineligible_empty_or_interstitial") ? "ineligible_empty_or_interstitial" : classify(error, stage, status);
      if (!allowedOutcomes.has(outcome)) throw new Error(`Collector emitted unknown outcome ${outcome}.`);
      attempts.push({ sample_id: row.sample_id, run_id: runId, attempt_id: attemptId, viewport_id: "desktop", started_at: started.toISOString(), finished_at: new Date().toISOString(), elapsed_ms: Date.now() - startedMs, terminal_stage: stage, outcome_code: outcome, retry_number: 0, document_observed: documentObserved, dom_observed: domObserved, http_status_if_observed: status, resolved_origin_hash_if_observed: resolvedOriginHash, browser_engine: "chromium", browser_version: browserVersion, collector_version: OPTION_B_V4_COLLECTOR_VERSION });
      process.stdout.write(`${index + 1}/${manifest.rows.length} ${row.sample_id} ${outcome}\n`);
    } finally {
      await context?.close().catch(() => {});
    }
  }
} finally {
  await browser?.close().catch(() => {});
}

const common = {
  generated_at: new Date().toISOString(), run_id: runId, status: isPilot ? "ISOLATED_LABEL_BLIND_SIX_SITE_PILOT" : "ISOLATED_LABEL_BLIND_TECHNICAL_EXTENSION_20",
  runtime: {
    engine: "chromium", version: browserVersion, source: "official-playwright-container", playwright_version: "1.54.2", operating_system: "ephemeral-linux-container",
    locale: contract.runtime_requirements.locale, timezone: contract.runtime_requirements.timezone, user_agent: fixedUserAgent, viewport: contract.viewports[0],
    isolation: { collector_direct_network: false, peer_pinning_egress: true, read_only_root: true, non_root: true, no_new_privileges: true, capabilities_dropped: "ALL", collector_image_id: process.env.OPTION_B_V4_COLLECTOR_IMAGE, egress_image_id: process.env.OPTION_B_V4_EGRESS_IMAGE, collector_base_digest: process.env.OPTION_B_V4_COLLECTOR_BASE_DIGEST, egress_base_digest: process.env.OPTION_B_V4_EGRESS_BASE_DIGEST, collector_source_sha256: process.env.OPTION_B_V4_COLLECTOR_SOURCE_SHA256, egress_source_sha256: process.env.OPTION_B_V4_EGRESS_SOURCE_SHA256 }
  },
  inputs: {
    manifest: { path: path.relative(process.cwd(), manifestPath), sha256: createHash("sha256").update(manifestText).digest("hex") },
    contract: { path: path.relative(process.cwd(), contractPath), sha256: createHash("sha256").update(contractText).digest("hex") },
    ...(waiverText ? { waiver: { path: path.relative(process.cwd(), waiverPath), sha256: createHash("sha256").update(waiverText).digest("hex") } } : {})
  }
};
const captureSchema = isPilot ? "vibebench.option_b.v4_pilot_capture.v1" : "vibebench.option_b.v4_extension_capture.v1";
const auditSchema = isPilot ? "vibebench.option_b.v4_pilot_attempt_audit.v1" : "vibebench.option_b.v4_extension_attempt_audit.v1";
const captureOutput = { schema_version: captureSchema, ...common, privacy: { urls_persisted: false, raw_html_persisted: false, text_persisted: false, screenshots_created: false }, summary: { attempted: manifest.rows.length, successful: captures.length, failed: manifest.rows.length - captures.length }, captures };
const auditOutput = { schema_version: auditSchema, ...common, summary: { attempted: attempts.length, successful: attempts.filter(({ outcome_code }) => outcome_code === "success").length, failed: attempts.filter(({ outcome_code }) => outcome_code !== "success").length }, attempts };
assertNoUnexpectedSensitiveFields(captureOutput);
assertNoUnexpectedSensitiveFields(auditOutput);
await Promise.all([atomicJson(outputPath, captureOutput), atomicJson(auditPath, auditOutput)]);
process.stdout.write(`${JSON.stringify({ capture: outputPath, audit: auditPath, summary: captureOutput.summary }, null, 2)}\n`);
