import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assessDevelopmentPageQuality } from "../lib/content-quality.mjs";

const manifestPath = path.resolve(process.argv[2] || "outputs/development_v0_2/vibebench_development_extension_40_v0_2.json");
const outputPath = path.resolve(process.argv[3] || "outputs/development_v0_2/vibebench_development_v0_2_freeze_audit.json");
const endpoint = "https://vibe-bench-cyan.vercel.app/api/scan";
const concurrency = 4;

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function sorted(values) {
  return [...(values || [])].sort((a, b) => a.localeCompare(b));
}

async function readLimited(response, maxBytes = 500_000) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    const remaining = maxBytes - total;
    chunks.push(value.subarray(0, remaining));
    total += Math.min(value.byteLength, remaining);
    if (value.byteLength > remaining) {
      await reader.cancel();
      break;
    }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function inspectContentQuality(targetUrl) {
  try {
    const response = await fetch(targetUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
      headers: { "user-agent": "VibeBench/0.2-development-freeze-audit", accept: "text/html,application/xhtml+xml" }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await readLimited(response);
    return {
      fetch_ok: true,
      response_status: response.status,
      resolved_url: response.url,
      server: response.headers.get("server") || "",
      html_bytes_checked: new TextEncoder().encode(html).length,
      ...assessDevelopmentPageQuality({ headers: response.headers, html })
    };
  } catch (error) {
    return {
      fetch_ok: false,
      eligible: false,
      disqualifying_signals: ["content-fetch-error"],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function scan(row) {
  const startedAt = new Date().toISOString();
  try {
    const [response, contentQuality] = await Promise.all([
      fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: row.target_url }),
        signal: AbortSignal.timeout(40_000)
      }),
      inspectContentQuality(row.target_url)
    ]);
    const payload = await response.json();
    const observedStacks = sorted(payload.stackSignals);
    const baselineStacks = sorted(row.baseline_scan?.stack_signals);
    return {
      sample_id: row.sample_id,
      target_group: row.target_group,
      target_url: row.target_url,
      started_at: startedAt,
      response_status: response.status,
      api_ok: payload.ok === true,
      resolved_url: payload.resolvedUrl || "",
      observed_level: payload.verdict?.level || "",
      baseline_level: row.baseline_scan?.level || "",
      level_match: payload.verdict?.level === row.baseline_scan?.level,
      observed_stack_signals: observedStacks,
      baseline_stack_signals: baselineStacks,
      stack_match: JSON.stringify(observedStacks) === JSON.stringify(baselineStacks),
      content_quality: contentQuality,
      technical_outcome: payload.technicalOutcome || null,
      error: payload.error || ""
    };
  } catch (error) {
    return {
      sample_id: row.sample_id,
      target_group: row.target_group,
      target_url: row.target_url,
      started_at: startedAt,
      response_status: 0,
      api_ok: false,
      resolved_url: "",
      observed_level: "",
      baseline_level: row.baseline_scan?.level || "",
      level_match: false,
      observed_stack_signals: [],
      baseline_stack_signals: sorted(row.baseline_scan?.stack_signals),
      stack_match: false,
      content_quality: { fetch_ok: false, eligible: false, disqualifying_signals: ["audit-error"] },
      technical_outcome: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function mapConcurrent(rows, limit, worker) {
  const results = new Array(rows.length);
  let cursor = 0;
  async function run() {
    while (cursor < rows.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(rows[index]);
      process.stdout.write(`${index + 1}/${rows.length} ${rows[index].sample_id} ${results[index].api_ok ? results[index].observed_level : "ERROR"}\n`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, rows.length) }, run));
  return results;
}

const manifestText = await readFile(manifestPath, "utf8");
const manifest = JSON.parse(manifestText);
const rows = manifest.samples || [];
if (rows.length !== 40 || rows.some((row) => row.status !== "READY")) {
  throw new Error(`Freeze audit requires exactly 40 READY rows; found ${rows.length} total and ${rows.filter((row) => row.status === "READY").length} READY.`);
}

const results = await mapConcurrent(rows, concurrency, scan);
const summary = {
  total: results.length,
  api_ok: results.filter((row) => row.api_ok).length,
  technical_errors: results.filter((row) => !row.api_ok).length,
  level_matches: results.filter((row) => row.level_match).length,
  level_drifts: results.filter((row) => row.api_ok && !row.level_match).length,
  stack_matches: results.filter((row) => row.stack_match).length,
  stack_drifts: results.filter((row) => row.api_ok && !row.stack_match).length,
  content_eligible: results.filter((row) => row.content_quality?.eligible).length,
  content_disqualified: results.filter((row) => !row.content_quality?.eligible).length,
  groups: Object.fromEntries([...new Set(results.map((row) => row.target_group))].map((group) => {
    const groupRows = results.filter((row) => row.target_group === group);
    return [group, {
      total: groupRows.length,
      api_ok: groupRows.filter((row) => row.api_ok).length,
      direct: groupRows.filter((row) => row.observed_level === "direct").length,
      indicative: groupRows.filter((row) => row.observed_level === "indicative").length,
      indeterminate: groupRows.filter((row) => row.observed_level === "indeterminate").length
    }];
  }))
};
const audit = {
  schema_version: "v0.2-development-freeze-audit",
  generated_at: new Date().toISOString(),
  purpose: "Freeze-time production reachability and baseline drift audit for Development-only data; not an evaluation result.",
  endpoint,
  manifest: path.relative(process.cwd(), manifestPath),
  manifest_sha256: sha256(manifestText),
  summary,
  freeze_ready: summary.api_ok === 40 && summary.level_matches === 40 && summary.content_eligible === 40,
  policy: {
    holdout_reuse: "PROHIBITED",
    tuning_scope: "Development rows only",
    stack_drift: "Recorded as diagnostic metadata; verdict-level drift blocks the freeze.",
    content_quality: "Parking pages and content-fetch failures block the freeze even when the scan endpoint returns successfully."
  },
  results
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), ...summary, freeze_ready: audit.freeze_ready }, null, 2)}\n`);
if (!audit.freeze_ready) process.exitCode = 1;
