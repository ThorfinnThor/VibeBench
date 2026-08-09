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
}

for (const [key, normalize] of [["target_url", normalizedUrl], ["domain_group", undefined], ["project_group", undefined]]) {
  for (const [value, ids] of duplicates(rows, key, normalize)) errors.push(`Duplicate ${key} ${value}: ${ids.join(", ")}`);
}
for (const [value, ids] of duplicates(rows, "organization_group")) {
  warnings.push(`Repeated organization_group ${value}: ${ids.join(", ")}`);
}

const developmentPath = path.resolve("vibebench_url_scan_queue_63_v0_9.csv");
const developmentRows = parseCsv(await readFile(developmentPath, "utf8"));
const developmentUrls = new Set(developmentRows.flatMap((row) => [row.target_url, row.url, row.requested_url, row.final_url]).map(normalizedUrl).filter((value) => value && value !== "INVALID"));
for (const row of rows) {
  const target = normalizedUrl(row.target_url);
  if (target && developmentUrls.has(target)) errors.push(`${row.sample_id}: target_url overlaps the Development set`);
}

const requiredForReady = [
  "website_type", "target_url", "provenance_url", "provenance_type", "provenance_summary", "collected_at",
  "deployment_verified_at", "domain_group", "project_group"
];
const readyRows = rows.filter((row) => requiredForReady.every((key) => row[key])
  && row.reachability_status === "REACHABLE"
  && row.development_overlap_check === "PASS"
  && row.domain_overlap_check === "PASS"
  && row.provenance_review === "PASS");

if (freeze) {
  if (!/^[0-9a-f]{40}$/i.test(scannerCommit)) errors.push("--scanner-commit must be a full 40-character Git SHA when freezing");
  if (readyRows.length !== 100) errors.push(`Freeze requires 100 ready rows, found ${readyRows.length}`);
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
    policy: "outputs/VIBEBENCH_WEB_SCANNER_DECISION_POLICY_V0_1.md"
  };
  const lockPath = `${manifestPath}.freeze.json`;
  await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
  process.stdout.write(`Wrote ${lockPath}\n`);
}
