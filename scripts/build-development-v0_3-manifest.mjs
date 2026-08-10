import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assessDevelopmentPageQuality } from "../lib/content-quality.mjs";

const outputDir = path.resolve("outputs/development_v0_3");
const poolPath = path.resolve("outputs/confirmation_v0_2/vibebench_confirmation_v0_2_candidate_pool.json");
const confirmationPath = path.resolve("outputs/confirmation_v0_2/vibebench_confirmation_holdout_100_v0_2.json");
const resultLockPath = path.resolve("outputs/confirmation_v0_2/blind_run_v0_2/vibebench_confirmation_result_files_v0_2.json");
const manifestPath = path.join(outputDir, "vibebench_development_extension_60_v0_3.json");
const candidatePath = path.join(outputDir, "vibebench_development_v0_3_candidate_pool.json");
const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const weeks = Array.from({ length: 18 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 7, 3 - index * 14));
  return date.toISOString().slice(0, 10);
});
const bucketRules = [
  ["CURSOR", /\bCursor\b/i],
  ["CLAUDE_CODE", /Claude Code/i],
  ["WINDSURF", /Windsurf/i],
  ["CODEX", /(?:OpenAI )?(?:GPT-[\d.]+-)?Codex/i],
  ["NATIVE_BUILDER", /(?:Replit Agent|Lovable|Bolt|V0 by Vercel)/i]
];

function host(value) {
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
}

function normalizeUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) return "";
    url.hash = "";
    return url.toString();
  } catch { return ""; }
}

async function hostsFromText(file) {
  const text = await readFile(path.resolve(file), "utf8");
  return [...text.matchAll(/https?:\/\/[^\s"',<>]+/gi)].map((match) => host(match[0])).filter(Boolean);
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
    if (value.byteLength > remaining) { await reader.cancel(); break; }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

async function inspect(row) {
  try {
    const response = await fetch(row.target_url, {
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
      headers: { "user-agent": "VibeBench/0.3-development-acquisition", accept: "text/html,application/xhtml+xml" }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (!/html|xhtml/i.test(contentType)) throw new Error(`Unsupported content type: ${contentType}`);
    const html = await readLimited(response);
    const quality = assessDevelopmentPageQuality({ headers: response.headers, html });
    return {
      ...row,
      reachability: {
        ok: quality.eligible,
        status: response.status,
        resolved_url: response.url,
        resolved_host: host(response.url),
        content_type: contentType,
        html_bytes_checked: new TextEncoder().encode(html).length,
        disqualifying_signals: quality.disqualifying_signals
      }
    };
  } catch (error) {
    return { ...row, reachability: { ok: false, error: error instanceof Error ? error.message : String(error) } };
  }
}

async function mapConcurrent(rows, limit, worker) {
  const results = new Array(rows.length);
  let cursor = 0;
  async function run() {
    while (cursor < rows.length) {
      const index = cursor++;
      results[index] = await worker(rows[index]);
      process.stdout.write(`${index + 1}/${rows.length} ${rows[index].candidate_id} ${results[index].reachability.ok ? "READY" : "REJECT"}\n`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, rows.length) }, run));
  return results;
}

const [poolText, confirmationText, resultLockText] = await Promise.all([poolPath, confirmationPath, resultLockPath].map((file) => readFile(file, "utf8")));
const pool = JSON.parse(poolText);
const confirmation = JSON.parse(confirmationText);
const resultLock = JSON.parse(resultLockText);
if (resultLock.status !== "FAILED_LOCKED_NO_TUNING" || resultLock.policy?.may_be_used_for_training !== false) {
  throw new Error("Failed confirmation must be locked and explicitly excluded before v0.3 development.");
}

const exclusionFiles = [
  "outputs/development_v0_2/vibebench_development_extension_40_v0_2.json",
  "outputs/holdout_v0_1/vibebench_blind_holdout_100_v0_1.csv",
  "outputs/vibebench_production_browser_capture_post_hardening_2026-08-09.json"
];
const excluded = new Set([
  ...confirmation.samples.map((row) => row.project_family_id),
  ...(await Promise.all(exclusionFiles.map(hostsFromText))).flat()
]);

const historical = [];
for (const week of weeks) {
  const url = `https://www.hot100.ai/api/chart/top100?weekOf=${week}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Hot100 HTTP ${response.status} for ${week}`);
  const payload = await response.json();
  for (const project of payload.projects || []) historical.push({ ...project, chart_week: payload.chartWeek });
}

const seenAi = new Set(excluded);
const aiByBucket = Object.fromEntries(bucketRules.map(([bucket]) => [bucket, []]));
const sorted = historical.sort((a, b) => b.chart_week.localeCompare(a.chart_week) || a.rank - b.rank || a.id - b.id);
for (const project of sorted) {
  const targetUrl = normalizeUrl(project.projectUrl);
  const targetHost = host(targetUrl);
  const tools = (project.builtWith || []).map(String);
  if (!targetUrl || !targetHost || seenAi.has(targetHost)) continue;
  if (/^(?:play|apps)\.google\.com$|^apps\.apple\.com$/i.test(targetHost)) continue;
  const matching = bucketRules.find(([, pattern]) => tools.some((tool) => pattern.test(tool)));
  if (!matching) continue;
  const [bucket] = matching;
  if (aiByBucket[bucket].length >= 24) continue;
  seenAi.add(targetHost);
  aiByBucket[bucket].push({
    candidate_id: `DEV3-${bucket}-${String(aiByBucket[bucket].length + 1).padStart(3, "0")}`,
    label: "AI",
    target_group: `AI_${bucket}_NEW`,
    builder: bucket,
    target_url: targetUrl,
    project_family_id: targetHost,
    project_name: project.projectName,
    builder_evidence: tools.filter((tool) => bucketRules.some(([, pattern]) => pattern.test(tool))),
    provenance_type: "independent_reviewed_directory_historical_chart",
    provenance_url: project.hot100Url || `https://hot100.ai/project/${project.id}`,
    provenance_summary: `Hot100 chart ${project.chart_week} metadata lists: ${tools.join(", ")}.`,
    source_chart_week: project.chart_week,
    source_rank: project.rank,
    source_project_id: project.id,
    confirmation_result_rows_inspected: false,
    model_score_inspected_during_acquisition: false
  });
}

const confirmationHosts = new Set(confirmation.samples.map((row) => row.project_family_id));
const humanCandidates = pool.candidates
  .filter((row) => row.label === "HUMAN" && row.reachability?.ok && !confirmationHosts.has(row.project_family_id))
  .slice(0, 30)
  .map((row, index) => ({
    ...row,
    candidate_id: `DEV3-HUMAN-${String(index + 1).padStart(3, "0")}`,
    target_group: "HUMAN_ESTABLISHED_PRODUCT_NEW",
    builder: "Human control",
    confirmation_result_rows_inspected: false,
    model_score_inspected_during_acquisition: false
  }));
if (humanCandidates.length !== 30) throw new Error(`Need 30 unused Human controls, found ${humanCandidates.length}.`);

const aiInspected = await mapConcurrent(Object.values(aiByBucket).flat(), 8, inspect);
const selectedAi = [];
for (const [bucket] of bucketRules) {
  const ready = aiInspected.filter((row) => row.builder === bucket && row.reachability.ok);
  if (ready.length < 6) throw new Error(`Need six reachable ${bucket} Development rows, found ${ready.length}.`);
  selectedAi.push(...ready.slice(0, 6));
}
if (selectedAi.length !== 30 || new Set(selectedAi.map((row) => row.project_family_id)).size !== 30) throw new Error("AI v0.3 selection is not 30 unique project families.");

const samples = [...selectedAi, ...humanCandidates].map((row, index) => ({
  sample_id: `DEV3-${String(index + 1).padStart(3, "0")}`,
  target_group: row.target_group,
  label: row.label,
  builder: row.builder,
  target_url: row.target_url,
  project_family_id: row.project_family_id,
  project_name: row.project_name,
  provenance_type: row.provenance_type,
  provenance_url: row.provenance_url,
  provenance_summary: row.provenance_summary,
  source_metadata: row.label === "AI"
    ? { chart_week: row.source_chart_week, rank: row.source_rank, builder_evidence: row.builder_evidence }
    : { repository: row.repository, repository_created_at: row.repository_created_at, stars: row.source_stars },
  acquisition: {
    reachability_checked_before_model_scoring: true,
    model_score_inspected: false,
    failed_confirmation_result_rows_inspected: false
  }
}));

const candidatePool = {
  schema_version: "v0.3-development-candidate-pool",
  generated_at: new Date().toISOString(),
  purpose: "Development-only acquisition after v0.2 failure; no confirmation row-level analysis or model scoring used.",
  historical_chart_weeks: weeks,
  excluded_hosts: excluded.size,
  model_scores_inspected: false,
  failed_confirmation_result_rows_inspected: false,
  summary: Object.fromEntries(bucketRules.map(([bucket]) => [bucket, {
    collected: aiByBucket[bucket].length,
    reachable: aiInspected.filter((row) => row.builder === bucket && row.reachability.ok).length,
    selected: selectedAi.filter((row) => row.builder === bucket).length
  }])),
  candidates: aiInspected
};
const manifest = {
  schema_version: "v0.3-development-extension",
  generated_at: new Date().toISOString(),
  status: "DEVELOPMENT_ONLY_READY",
  independent_evaluation_result: false,
  failed_confirmation_used_for_training: false,
  failed_confirmation_used_for_error_analysis: false,
  acquisition_rule: "Six reachable sites from each of five predeclared AI-tool buckets plus thirty unused established Human controls; no candidate-model scores inspected.",
  source_hashes: {
    confirmation_candidate_pool: sha256(poolText),
    failed_confirmation_manifest: sha256(confirmationText),
    failed_confirmation_result_lock: sha256(resultLockText)
  },
  summary: {
    total: samples.length,
    ai: samples.filter((row) => row.label === "AI").length,
    human: samples.filter((row) => row.label === "HUMAN").length,
    groups: Object.fromEntries([...new Set(samples.map((row) => row.target_group))].map((group) => [group, samples.filter((row) => row.target_group === group).length]))
  },
  samples
};

await mkdir(outputDir, { recursive: true });
await Promise.all([
  writeFile(candidatePath, `${JSON.stringify(candidatePool, null, 2)}\n`, "utf8"),
  writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
]);
process.stdout.write(`${JSON.stringify({ candidate_pool: path.relative(process.cwd(), candidatePath), manifest: path.relative(process.cwd(), manifestPath), summary: manifest.summary, candidate_summary: candidatePool.summary }, null, 2)}\n`);
