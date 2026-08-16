import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { normalizePublicUrl } from "../lib/public-url-policy.mjs";
import {
  assertOptionBV5Payload,
  classifyOptionBV5Error,
  extractOptionBV5Surface,
  installOptionBV5SurfaceHelpers,
  OPTION_B_V5_COLLECTOR_VERSION,
  OPTION_B_V5_RETRYABLE_OUTCOMES,
  retryDelayOptionBV5,
  waitForOptionBV5Readiness
} from "../lib/option-b-v5-capture.mjs";

const arg = (name, fallback) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; };
const mode = arg("--mode", "smoke");
if (!new Set(["smoke", "development"]).has(mode)) throw new Error("--mode must be smoke or development.");
const root = path.resolve(process.env.OPTION_B_V5_ARTIFACT_ROOT || "outputs/development_v0_6_option_b_v5");
const outputPath = path.resolve(arg("--output", path.join(root, "option_b_v5_capture.json")));
const auditPath = path.resolve(arg("--audit", path.join(root, "option_b_v5_attempt_audit.json")));
const manifestPath = path.resolve(arg("--manifest", mode === "smoke" ? "outputs/development_v0_6_option_b_v5/option_b_v5_primary_manifest.json" : "outputs/development_v0_6_option_b_v5/option_b_v5_development_primary_manifest_v1.json"));
const contractPath = path.resolve(arg("--contract", mode === "smoke" ? "outputs/development_v0_6_option_b_v5/option_b_capture_contract_v5.json" : "outputs/development_v0_6_option_b_v5/option_b_v5_development_capture_contract_v1.json"));

if (process.env.OPTION_B_V5_ISOLATED_RUNTIME !== "1") throw new Error("The v5 collector requires OPTION_B_V5_ISOLATED_RUNTIME=1.");
if (process.env.HTTPS_PROXY !== "http://egress:8080" || process.env.HTTP_PROXY !== process.env.HTTPS_PROXY) throw new Error("The v5 collector requires the isolated egress proxy.");
for (const name of ["OPTION_B_V5_COLLECTOR_IMAGE", "OPTION_B_V5_EGRESS_IMAGE", "OPTION_B_V5_COLLECTOR_BASE_DIGEST", "OPTION_B_V5_EGRESS_BASE_DIGEST", "OPTION_B_V5_COLLECTOR_SOURCE_SHA256", "OPTION_B_V5_EGRESS_SOURCE_SHA256"]) if (!process.env[name]) throw new Error(`${name} must record the frozen runtime identity.`);

const [manifestText, contractText] = await Promise.all([readFile(manifestPath, "utf8"), readFile(contractPath, "utf8")]);
const manifest = JSON.parse(manifestText);
const contract = JSON.parse(contractText);
const expectedManifestSchema = mode === "smoke" ? "vibebench.option_b.v5_primary_manifest.v1" : /^vibebench\.option_b\.v5_development_(?:primary|reserve)_manifest\.v1$/;
if ((typeof expectedManifestSchema === "string" ? manifest.schema_version !== expectedManifestSchema : !expectedManifestSchema.test(manifest.schema_version)) || (mode === "smoke" && manifest.rows?.length !== 6) || (mode === "development" && !(manifest.rows?.length > 0 && manifest.rows.length <= 200)) || manifest.collector_visible_fields?.join(",") !== "sample_id,target_url") throw new Error(`Invalid label-blind v5 ${mode} manifest.`);
if (manifest.rows.some((row) => Object.keys(row).sort().join(",") !== "sample_id,target_url")) throw new Error("v5 manifest exposes prohibited collector fields.");
if (mode === "smoke" && (contract.status !== "ISOLATED_SIX_SITE_SMOKE_ONLY" || contract.execution_gate?.six_site_smoke_may_execute !== true)) throw new Error("v5 smoke execution gate is not approved.");
if (mode === "development" && (contract.status !== "ISOLATED_DEVELOPMENT_EXPANSION_FROZEN" || contract.execution_gate?.expansion_may_execute !== true || contract.execution_gate?.group_cv_may_execute !== false)) throw new Error("v5 Development execution gate is not approved.");

const runId = randomUUID();
const originSalt = randomUUID();
const fixedUserAgent = `VibeBenchResearch/${OPTION_B_V5_COLLECTOR_VERSION}`;
const captures = [];
const attempts = [];
const browser = await chromium.launch({ headless: true, proxy: { server: process.env.HTTPS_PROXY }, args: ["--force-webrtc-ip-handling-policy=disable_non_proxied_udp", "--webrtc-ip-handling-policy=disable_non_proxied_udp"] });
const browserVersion = await browser.version();

const auditAttempt = ({ row, viewport, attemptId, retryNumber, started, startedMs, stage, outcome, documentObserved, domObserved, status, resolvedOriginHash }) => ({
  sample_id: row.sample_id,
  viewport_id: viewport.id,
  attempt_id: attemptId,
  started_at: started.toISOString(),
  finished_at: new Date().toISOString(),
  elapsed_ms: Date.now() - startedMs,
  terminal_stage: stage,
  outcome_code: outcome,
  retry_number: retryNumber,
  document_observed: documentObserved,
  dom_observed: domObserved,
  http_status_if_observed: status,
  resolved_origin_hash_if_observed: resolvedOriginHash,
  browser_engine: "chromium",
  browser_version: browserVersion,
  collector_version: OPTION_B_V5_COLLECTOR_VERSION
});

async function attempt(row, viewport, retryNumber) {
  const started = new Date();
  const startedMs = Date.now();
  const attemptId = randomUUID();
  let stage = "input_validation";
  let documentObserved = false;
  let domObserved = false;
  let status = null;
  let resolvedOriginHash = null;
  let context;
  try {
    const target = normalizePublicUrl(row.target_url);
    context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, locale: contract.runtime_requirements.locale, timezoneId: contract.runtime_requirements.timezone, colorScheme: "light", reducedMotion: "reduce", deviceScaleFactor: 1, serviceWorkers: "block", acceptDownloads: false, userAgent: fixedUserAgent });
    await context.route("**/*", async (route) => {
      const request = route.request();
      if (!["GET", "HEAD"].includes(request.method())) return route.abort("blockedbyclient");
      let requestUrl;
      try { requestUrl = new URL(request.url()); } catch { return route.abort("blockedbyclient"); }
      if (["data:", "blob:", "about:"].includes(requestUrl.protocol)) return route.continue();
      if (!["http:", "https:"].includes(requestUrl.protocol)) return route.abort("blockedbyclient");
      try { normalizePublicUrl(requestUrl.toString()); return route.continue(); } catch { return route.abort("blockedbyclient"); }
    });
    if (typeof context.routeWebSocket === "function") await context.routeWebSocket("**/*", (socket) => socket.close());
    const page = await context.newPage();
    stage = "http_navigation";
    const response = await page.goto(target.toString(), { waitUntil: "domcontentloaded", timeout: contract.budgets.navigation_timeout_ms });
    documentObserved = true;
    status = response?.status() || null;
    if (status === 429) throw new Error("HTTP 429");
    if (status && status >= 400) throw new Error(`HTTP ${status}`);
    resolvedOriginHash = createHash("sha256").update(`${originSalt}\0${new URL(page.url()).origin}`).digest("hex");
    stage = "surface_helper_installation";
    await installOptionBV5SurfaceHelpers(page);
    stage = "dom_readiness";
    await waitForOptionBV5Readiness(page, { timeout_ms: contract.budgets.readiness_timeout_ms, sampling_interval_ms: contract.readiness.sampling_interval_ms, required_consecutive_stable_samples: contract.readiness.required_consecutive_stable_samples, dimension_delta_px_max: contract.readiness.stable_if_document_dimensions_delta_px_max, visible_element_delta_share_max: contract.readiness.stable_if_visible_element_count_delta_share_max });
    domObserved = true;
    const eligibility = await page.evaluate(() => { const helper = window.__VIBEBENCH_OPTION_B_V4_SURFACE__; return { text: (document.body?.innerText || "").length, elements: [...document.body.querySelectorAll("*")].filter(helper.isVisible).length }; });
    if (eligibility.text < 80 || eligibility.elements < 8) throw new Error("ineligible_empty_or_interstitial");
    stage = "computed_style_extraction";
    const payload = await Promise.race([extractOptionBV5Surface(page, contract.budgets), new Promise((_, reject) => setTimeout(() => reject(new Error("computed_style_extraction_timeout")), contract.budgets.extraction_timeout_ms))]);
    stage = "structural_aggregation";
    assertOptionBV5Payload(payload);
    stage = "serialization";
    JSON.stringify(payload);
    captures.push({ sample_id: row.sample_id, run_id: runId, attempt_id: attemptId, viewport_id: viewport.id, payload });
    const audit = auditAttempt({ row, viewport, attemptId, retryNumber, started, startedMs, stage, outcome: "success", documentObserved, domObserved, status, resolvedOriginHash });
    attempts.push(audit);
    return { ok: true, audit };
  } catch (error) {
    const outcome = classifyOptionBV5Error(error, stage, status);
    const audit = auditAttempt({ row, viewport, attemptId, retryNumber, started, startedMs, stage, outcome, documentObserved, domObserved, status, resolvedOriginHash });
    attempts.push(audit);
    return { ok: false, audit };
  } finally {
    await context?.close().catch(() => {});
  }
}

try {
  for (const [index, row] of manifest.rows.entries()) {
    let siteSuccess = true;
    for (const viewport of contract.viewports) {
      let final;
      for (let retryNumber = 0; retryNumber < contract.retry_policy.maximum_attempts; retryNumber += 1) {
        final = await attempt(row, viewport, retryNumber);
        if (final.ok || !OPTION_B_V5_RETRYABLE_OUTCOMES.has(final.audit.outcome_code) || retryNumber + 1 >= contract.retry_policy.maximum_attempts) break;
        await new Promise((resolve) => setTimeout(resolve, retryDelayOptionBV5(final.audit.outcome_code, retryNumber)));
      }
      if (!final?.ok) siteSuccess = false;
    }
    process.stdout.write(`${index + 1}/${manifest.rows.length} ${row.sample_id} ${siteSuccess ? "success" : "failed"}\n`);
  }
} finally {
  await browser.close();
}

const common = { generated_at: new Date().toISOString(), run_id: runId, status: mode === "smoke" ? "ISOLATED_LABEL_BLIND_SIX_SITE_SMOKE" : "ISOLATED_LABEL_BLIND_DEVELOPMENT_CAPTURE", runtime: { engine: "chromium", version: browserVersion, source: "official-playwright-container", playwright_version: "1.54.2", locale: contract.runtime_requirements.locale, timezone: contract.runtime_requirements.timezone, user_agent: fixedUserAgent, viewports: contract.viewports, isolation: { collector_direct_network: false, peer_pinning_egress: true, read_only_root: true, non_root: true, no_new_privileges: true, capabilities_dropped: "ALL", collector_image_id: process.env.OPTION_B_V5_COLLECTOR_IMAGE, egress_image_id: process.env.OPTION_B_V5_EGRESS_IMAGE, collector_base_digest: process.env.OPTION_B_V5_COLLECTOR_BASE_DIGEST, egress_base_digest: process.env.OPTION_B_V5_EGRESS_BASE_DIGEST, collector_source_sha256: process.env.OPTION_B_V5_COLLECTOR_SOURCE_SHA256, egress_source_sha256: process.env.OPTION_B_V5_EGRESS_SOURCE_SHA256 } }, inputs: { manifest: { path: path.relative(process.cwd(), manifestPath), sha256: createHash("sha256").update(manifestText).digest("hex") }, contract: { path: path.relative(process.cwd(), contractPath), sha256: createHash("sha256").update(contractText).digest("hex") } } };
const privacy = { urls_persisted: false, raw_html_persisted: false, text_persisted: false, screenshots_created: false };
const captureCounts = captures.reduce((counts, { sample_id }) => (counts.set(sample_id, (counts.get(sample_id) || 0) + 1), counts), new Map());
const successfulSiteIds = new Set([...captureCounts].filter(([, count]) => count === contract.viewports.length).map(([sampleId]) => sampleId));
const captureOutput = { schema_version: mode === "smoke" ? "vibebench.option_b.v5_smoke_capture.v1" : "vibebench.option_b.v5_development_capture.v1", ...common, privacy, summary: { attempted: manifest.rows.length, viewports: contract.viewports.length, successful: successfulSiteIds.size, captures: captures.length, failed: manifest.rows.length - successfulSiteIds.size, incomplete_viewport_pairs: [...captureCounts].filter(([, count]) => count !== contract.viewports.length).length }, captures };
const auditOutput = { schema_version: mode === "smoke" ? "vibebench.option_b.v5_smoke_attempt_audit.v1" : "vibebench.option_b.v5_development_attempt_audit.v1", ...common, summary: { sites_attempted: manifest.rows.length, attempts: attempts.length, successful_attempts: attempts.filter(({ outcome_code }) => outcome_code === "success").length, failed_attempts: attempts.filter(({ outcome_code }) => outcome_code !== "success").length }, attempts };
const assertPrivacy = (value, at = "output") => { if (Array.isArray(value)) return value.forEach((item, index) => assertPrivacy(item, `${at}[${index}]`)); if (!value || typeof value !== "object") return; for (const [key, item] of Object.entries(value)) { if (/^(target_url|resolved_url|url|hostname|label|target_group|raw_html|visible_text|text|screenshot|image)$/i.test(key)) throw new Error(`Prohibited persisted field at ${at}.${key}`); assertPrivacy(item, `${at}.${key}`); } };
assertPrivacy(captureOutput); assertPrivacy(auditOutput);
const atomicJson = async (file, value) => { await mkdir(path.dirname(file), { recursive: true }); const tmp = `${file}.${randomUUID()}.tmp`; await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 }); await rename(tmp, file); };
await Promise.all([atomicJson(outputPath, captureOutput), atomicJson(auditPath, auditOutput)]);
process.stdout.write(`${JSON.stringify({ capture: outputPath, audit: auditPath, summary: captureOutput.summary }, null, 2)}\n`);
