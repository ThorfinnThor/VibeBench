import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const freeze = args.includes("--freeze");
const commitIndex = args.indexOf("--scanner-commit");
const scannerCommit = commitIndex >= 0 ? args[commitIndex + 1] : "";
const manifestArg = args.find((arg, index) => !arg.startsWith("--") && !(commitIndex >= 0 && index === commitIndex + 1))
  || "outputs/holdout_v0_1/vibebench_blind_holdout_100_v0_1.csv";
const manifestPath = path.resolve(manifestArg);

function parseCsv(text) {
  const records = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell.replace(/\r$/, ""));
      if (row.some((value) => value !== "")) records.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    records.push(row);
  }
  const [headers, ...data] = records;
  if (!headers) return [];
  return data.map((values) => Object.fromEntries(headers.map((header, index) => [header.replace(/^\uFEFF/, ""), values[index] ?? ""])));
}

function normalizedUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    url.hash = "";
    url.search = "";
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    return `${url.protocol}//${hostname}${pathname}`;
  } catch {
    return "INVALID";
  }
}

function normalizedHostname(value) {
  if (!value) return "";
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return url.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return "INVALID";
  }
}

function normalizedDomainGroup(value) {
  if (!value) return "";
  const host = normalizedHostname(value);
  return host === "INVALID" ? value.trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "") : host;
}

const sharedHostingGroups = new Set([
  "lovable.app", "vercel.app", "netlify.app", "replit.app", "pages.dev", "github.io",
  "web.app", "firebaseapp.com", "bolt.host"
]);

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function duplicates(rows, key, normalize = (value) => value.trim().toLowerCase()) {
  const groups = new Map();
  for (const row of rows) {
    const value = normalize(row[key] || "");
    if (!value || value === "INVALID") continue;
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(row.sample_id);
  }
  return [...groups.entries()].filter(([, sampleIds]) => sampleIds.length > 1);
}

const manifestText = await readFile(manifestPath, "utf8");
const rows = parseCsv(manifestText);
const errors = [];
const warnings = [];
const expectedGroups = new Map([
  ["AI_LOVABLE", ["AI", "Lovable"]],
  ["AI_BOLT", ["AI", "Bolt"]],
  ["AI_REPLIT_AGENT", ["AI", "Replit Agent"]],
  ["AI_V0", ["AI", "v0"]],
  ["AI_OTHER_AGENTIC", ["AI", "Other agentic/custom"]],
  ["HUMAN_MODERN_APP", ["HUMAN", ""]],
  ["HUMAN_SAAS", ["HUMAN", ""]],
  ["HUMAN_PORTFOLIO_AGENCY", ["HUMAN", ""]],
  ["HUMAN_CONTENT_DOCS", ["HUMAN", ""]],
  ["HUMAN_PRE_AI_SNAPSHOT", ["HUMAN", ""]]
]);

if (rows.length !== 100) errors.push(`Expected 100 rows, found ${rows.length}`);
const sampleIds = rows.map((row) => row.sample_id);
if (new Set(sampleIds).size !== sampleIds.length) errors.push("sample_id values must be unique");

for (const [group, [label, builder]] of expectedGroups) {
  const groupRows = rows.filter((row) => row.target_group === group);
  if (groupRows.length !== 10) errors.push(`${group} must contain 10 rows, found ${groupRows.length}`);
  const provenanceCount = new Set(groupRows.map((row) => normalizedUrl(row.provenance_url)).filter((value) => value && value !== "INVALID")).size;
  if (provenanceCount < 6) errors.push(`${group} must use at least 6 distinct provenance sources, found ${provenanceCount}`);
  for (const row of groupRows) {
    if (row.label !== label) errors.push(`${row.sample_id}: expected label ${label}`);
    if (row.builder !== builder) errors.push(`${row.sample_id}: expected builder ${builder || "blank"}`);
  }
}

for (const row of rows) {
  if (row.target_url && normalizedUrl(row.target_url) === "INVALID") errors.push(`${row.sample_id}: invalid target_url`);
  if (row.provenance_url && normalizedUrl(row.provenance_url) === "INVALID") errors.push(`${row.sample_id}: invalid provenance_url`);
  if (row.target_url && !row.target_url.toLowerCase().startsWith("https://")) errors.push(`${row.sample_id}: target_url must use HTTPS`);
  if (row.provenance_url && !row.provenance_url.toLowerCase().startsWith("https://")) errors.push(`${row.sample_id}: provenance_url must use HTTPS`);
  if (row.target_url && normalizedUrl(row.target_url) === normalizedUrl(row.provenance_url)) {
    errors.push(`${row.sample_id}: target_url and provenance_url must be independent`);
  }
  if (row.target_url && row.provenance_url && normalizedHostname(row.target_url) === normalizedHostname(row.provenance_url)) {
    errors.push(`${row.sample_id}: target_url and provenance_url must use different hosts`);
  }
  const targetHost = normalizedHostname(row.target_url);
  const domainGroup = normalizedDomainGroup(row.domain_group);
  if (targetHost && domainGroup && targetHost !== "INVALID" && domainGroup !== "INVALID"
      && targetHost !== domainGroup && !targetHost.endsWith(`.${domainGroup}`)) {
    errors.push(`${row.sample_id}: domain_group must contain the target host`);
  }
  for (const key of ["source_published_at", "collected_at", "deployment_verified_at"]) {
    if (row[key] && !isIsoDate(row[key])) errors.push(`${row.sample_id}: ${key} must be a valid YYYY-MM-DD date`);
  }
  if (isIsoDate(row.source_published_at) && isIsoDate(row.collected_at) && row.source_published_at > row.collected_at) {
    errors.push(`${row.sample_id}: source_published_at cannot be after collected_at`);
  }
  if (isIsoDate(row.deployment_verified_at) && isIsoDate(row.collected_at) && row.deployment_verified_at > row.collected_at) {
    errors.push(`${row.sample_id}: deployment_verified_at cannot be after collected_at`);
  }
}

for (const [key, normalize] of [["target_url", normalizedUrl], ["domain_group", undefined], ["project_group", undefined]]) {
  for (const [value, ids] of duplicates(rows, key, normalize)) errors.push(`Duplicate ${key} ${value}: ${ids.join(", ")}`);
}
for (const [value, ids] of duplicates(rows, "organization_group")) {
  warnings.push(`Repeated organization_group ${value}: ${ids.join(", ")}`);
}
for (const [value, ids] of duplicates(rows, "provenance_url", normalizedUrl)) {
  warnings.push(`Repeated provenance_url ${value}: ${ids.join(", ")}`);
}

const targetUrls = new Map(rows.filter((row) => row.target_url).map((row) => [normalizedUrl(row.target_url), row.sample_id]));
for (const row of rows) {
  const targetOwner = targetUrls.get(normalizedUrl(row.provenance_url));
  if (targetOwner && targetOwner !== row.sample_id) {
    errors.push(`${row.sample_id}: provenance_url is another holdout target (${targetOwner})`);
  }
}

const developmentPath = path.resolve("vibebench_url_scan_queue_63_v0_9.csv");
const developmentText = await readFile(developmentPath, "utf8");
const developmentRows = parseCsv(developmentText);
const developmentRawUrls = developmentRows.flatMap((row) => [row.target_url, row.url, row.requested_url, row.final_url]);
const developmentUrls = new Set(developmentRawUrls.map(normalizedUrl).filter((value) => value && value !== "INVALID"));
const developmentHosts = new Set(developmentRawUrls.map(normalizedHostname).filter((value) => value && value !== "INVALID"));
const developmentDomainGroups = new Set(developmentRows.map((row) => normalizedDomainGroup(row.url_group))
  .filter((value) => value && !sharedHostingGroups.has(value)));
for (const row of rows) {
  const target = normalizedUrl(row.target_url);
  if (target && developmentUrls.has(target)) errors.push(`${row.sample_id}: target_url overlaps the Development set`);
  const targetHost = normalizedHostname(row.target_url);
  if (targetHost && developmentHosts.has(targetHost) && !developmentUrls.has(target)) {
    errors.push(`${row.sample_id}: target host overlaps the Development set`);
  }
  const domainGroup = normalizedDomainGroup(row.domain_group);
  if (domainGroup && developmentDomainGroups.has(domainGroup)) {
    errors.push(`${row.sample_id}: domain_group overlaps the Development set`);
  }
}

const requiredForReady = [
  "website_type", "target_url", "provenance_url", "provenance_type", "provenance_summary", "collected_at",
  "deployment_verified_at", "domain_group", "project_group", "organization_group", "notes"
];
function isReady(row) {
  return requiredForReady.every((key) => row[key])
  && row.reachability_status === "REACHABLE"
  && row.development_overlap_check === "PASS"
  && row.domain_overlap_check === "PASS"
  && row.provenance_review === "PASS";
}

const readyRows = rows.filter(isReady);
const provenanceTypes = new Set(["official_builder_story", "maker_statement", "repository_deployment_mapping", "archived_pre_ai_snapshot", "independent_project_record", "other_reviewed"]);
const reachabilityStatuses = new Set(["PENDING", "REACHABLE", "FAILED", "RETRY"]);
const reviewStatuses = new Set(["PENDING", "PASS", "FAIL"]);
for (const row of rows) {
  if (row.provenance_type && !provenanceTypes.has(row.provenance_type)) errors.push(`${row.sample_id}: unsupported provenance_type`);
  if (row.label === "AI" && row.provenance_type === "repository_deployment_mapping") {
    errors.push(`${row.sample_id}: AI labels require explicit builder evidence, not repository mapping alone`);
  }
  if (row.label === "HUMAN" && !["repository_deployment_mapping", "archived_pre_ai_snapshot", "other_reviewed"].includes(row.provenance_type)) {
    errors.push(`${row.sample_id}: HUMAN label uses an unsupported provenance class`);
  }
  if (!reachabilityStatuses.has(row.reachability_status)) errors.push(`${row.sample_id}: unsupported reachability_status`);
  for (const key of ["development_overlap_check", "domain_overlap_check", "provenance_review"]) {
    if (!reviewStatuses.has(row[key])) errors.push(`${row.sample_id}: unsupported ${key}`);
  }
  const expectedFreezeStatus = isReady(row) ? "READY" : "PENDING";
  if (row.freeze_status !== expectedFreezeStatus) {
    errors.push(`${row.sample_id}: freeze_status must be ${expectedFreezeStatus}`);
  }
  if (isReady(row) && row.provenance_summary.trim().length < 60) {
    errors.push(`${row.sample_id}: READY provenance_summary is too short for audit`);
  }
  if (isReady(row) && row.notes.trim().length < 60) {
    errors.push(`${row.sample_id}: READY notes are too short for audit`);
  }
}

const reachabilityAuditPath = path.resolve("outputs/holdout_v0_1/vibebench_holdout_reachability_audit_2026-08-10.json");
let reachabilityAuditText = "";
let reachabilityAudit = null;
if (freeze) {
  if (!/^[0-9a-f]{40}$/i.test(scannerCommit)) errors.push("--scanner-commit must be a full 40-character Git SHA when freezing");
  if (readyRows.length !== 100) errors.push(`Freeze requires 100 ready rows, found ${readyRows.length}`);
  try {
    reachabilityAuditText = await readFile(reachabilityAuditPath, "utf8");
    reachabilityAudit = JSON.parse(reachabilityAuditText);
    if (reachabilityAudit.samples !== 100 || reachabilityAudit.targetSuccesses !== 100
        || reachabilityAudit.provenanceSuccesses !== 100 || reachabilityAudit.failures !== 0) {
      errors.push("Freeze requires a successful 100-target and 100-provenance reachability audit");
    }
  } catch (error) {
    errors.push(`Freeze requires a readable reachability audit: ${error.message}`);
  }
}

const summary = {
  manifest: path.relative(process.cwd(), manifestPath),
  rows: rows.length,
  ai: rows.filter((row) => row.label === "AI").length,
  human: rows.filter((row) => row.label === "HUMAN").length,
  urlsFilled: rows.filter((row) => row.target_url).length,
  provenanceFilled: rows.filter((row) => row.provenance_url).length,
  reachable: rows.filter((row) => row.reachability_status === "REACHABLE").length,
  ready: readyRows.length,
  warnings,
  errors
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (errors.length) process.exitCode = 1;

if (freeze && errors.length === 0) {
  const lock = {
    schemaVersion: "v0.1",
    frozenAt: new Date().toISOString(),
    manifest: path.relative(process.cwd(), manifestPath),
    manifestSha256: createHash("sha256").update(manifestText).digest("hex"),
    scannerCommit,
    sampleCount: rows.length,
    labelCounts: { AI: 50, HUMAN: 50 },
    developmentManifest: path.relative(process.cwd(), developmentPath),
    developmentManifestSha256: createHash("sha256").update(developmentText).digest("hex"),
    reachabilityAudit: path.relative(process.cwd(), reachabilityAuditPath),
    reachabilityAuditSha256: createHash("sha256").update(reachabilityAuditText).digest("hex"),
    warningsAtFreeze: warnings,
    policy: "outputs/VIBEBENCH_WEB_SCANNER_DECISION_POLICY_V0_1.md"
  };
  const lockPath = `${manifestPath}.freeze.json`;
  await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
  process.stdout.write(`Wrote ${lockPath}\n`);
}
