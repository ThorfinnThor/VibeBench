import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assessDevelopmentPageQuality } from "../lib/content-quality.mjs";

const outputDir = path.resolve("outputs/confirmation_v0_2");
const outputPath = path.join(outputDir, "vibebench_confirmation_v0_2_candidate_pool.json");
const cutoff = "2022-11-30T00:00:00Z";
const aiTool = /(?:Replit Agent|Lovable|Bolt|V0 by Vercel|Cursor|Claude Code|Windsurf|Codex)/i;
const githubQueries = [
  "topic:webapp created:<2022-11-30 stars:>500",
  "topic:saas created:<2022-11-30 stars:>100",
  "topic:website created:<2022-11-30 stars:>1000",
  "topic:productivity created:<2022-11-30 stars:>500"
];

function normalizeUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (!['http:', 'https:'].includes(url.protocol)) return "";
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(?:utm_|ref$)/i.test(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return "";
  }
}

function host(value) {
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
}

async function existingHosts() {
  const files = [
    "outputs/development_v0_2/vibebench_development_extension_40_v0_2.json",
    "outputs/holdout_v0_1/blind_run_v0_1_2026-08-10/vibebench_blind_holdout_raw_results_v0_1.json",
    "outputs/vibebench_production_browser_capture_post_hardening_2026-08-09.json"
  ];
  const values = await Promise.all(files.map((file) => readFile(path.resolve(file), "utf8").then(JSON.parse)));
  const urls = [
    ...values[0].samples.map((row) => row.target_url),
    ...values[1].flattenedResults.map((row) => row.target_url || row.url),
    ...values[2].map((row) => row.url || row.target_url)
  ];
  return new Set(urls.map(host).filter(Boolean));
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

async function inspectReachability(row) {
  try {
    const response = await fetch(row.target_url, {
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
      headers: { "user-agent": "VibeBench/0.2-confirmation-acquisition", accept: "text/html,application/xhtml+xml" }
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
        server: response.headers.get("server") || "",
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

const excluded = await existingHosts();
const hot100Response = await fetch("https://www.hot100.ai/api/chart/top100", { signal: AbortSignal.timeout(20_000) });
if (!hot100Response.ok) throw new Error(`Hot100 API HTTP ${hot100Response.status}`);
const hot100 = await hot100Response.json();
const aiSeen = new Set(excluded);
const aiCandidates = [];
for (const project of hot100.projects || []) {
  const targetUrl = normalizeUrl(project.projectUrl);
  const targetHost = host(targetUrl);
  const tools = (project.builtWith || []).map(String);
  if (!targetUrl || !targetHost || aiSeen.has(targetHost) || !tools.some((tool) => aiTool.test(tool))) continue;
  if (/^(?:play|apps)\.google\.com$|^apps\.apple\.com$/i.test(targetHost)) continue;
  aiSeen.add(targetHost);
  aiCandidates.push({
    candidate_id: `CONF2-AI-${String(aiCandidates.length + 1).padStart(3, "0")}`,
    label: "AI",
    target_url: targetUrl,
    project_family_id: targetHost,
    project_name: project.projectName,
    builder_evidence: tools.filter((tool) => aiTool.test(tool)),
    provenance_type: "independent_reviewed_directory",
    provenance_url: project.hot100Url || `https://hot100.ai/project/${project.id}`,
    provenance_summary: `Reviewed project metadata lists: ${tools.join(", ")}.`,
    source_rank: project.rank,
    source_project_id: project.id,
    overlap_check: "PASS",
    score_inspected_during_acquisition: false
  });
}

const githubItems = [];
for (const query of githubQueries) {
  const url = `https://api.github.com/search/repositories?${new URLSearchParams({ q: query, sort: "stars", order: "desc", per_page: "100" })}`;
  const response = await fetch(url, { headers: { accept: "application/vnd.github+json", "user-agent": "VibeBench-confirmation-acquisition" }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`GitHub search HTTP ${response.status} for ${query}`);
  const payload = await response.json();
  githubItems.push(...(payload.items || []).map((item) => ({ ...item, acquisition_query: query })));
}
const humanSeen = new Set([...excluded, ...aiSeen]);
const repoSeen = new Set();
const humanCandidates = [];
for (const repo of githubItems.sort((a, b) => b.stargazers_count - a.stargazers_count || a.full_name.localeCompare(b.full_name))) {
  const targetUrl = normalizeUrl(repo.homepage);
  const targetHost = host(targetUrl);
  if (!targetUrl || !targetHost || humanSeen.has(targetHost) || repoSeen.has(repo.full_name)) continue;
  if (Date.parse(repo.created_at) >= Date.parse(cutoff)) continue;
  if (/github\.com$|github\.io$|youtube\.com$|youtu\.be$|medium\.com$|twitter\.com$|x\.com$/i.test(targetHost)) continue;
  humanSeen.add(targetHost);
  repoSeen.add(repo.full_name);
  humanCandidates.push({
    candidate_id: `CONF2-HUM-${String(humanCandidates.length + 1).padStart(3, "0")}`,
    label: "HUMAN",
    target_url: targetUrl,
    project_family_id: targetHost,
    project_name: repo.name,
    repository: repo.full_name,
    repository_created_at: repo.created_at,
    provenance_type: "official_public_source_repository",
    provenance_url: repo.html_url,
    provenance_summary: `Official public repository links the target and was created before ${cutoff}.`,
    source_stars: repo.stargazers_count,
    source_query: repo.acquisition_query,
    overlap_check: "PASS",
    score_inspected_during_acquisition: false,
    label_limitation: "Operational Human control; pre-cutoff project history does not prove that no later contributor used AI assistance."
  });
}

const inspected = await mapConcurrent([...aiCandidates.slice(0, 70), ...humanCandidates.slice(0, 80)], 8, inspectReachability);
const readyAi = inspected.filter((row) => row.label === "AI" && row.reachability.ok);
const readyHuman = inspected.filter((row) => row.label === "HUMAN" && row.reachability.ok);
const output = {
  schema_version: "v0.2-confirmation-candidate-pool",
  generated_at: new Date().toISOString(),
  purpose: "Independent confirmation acquisition before any candidate-model scoring.",
  model_scores_inspected: false,
  completed_v0_1_holdout_used_for_tuning: false,
  sources: {
    ai: "https://www.hot100.ai/api/chart/top100",
    human: githubQueries
  },
  cutoff,
  excluded_existing_hosts: excluded.size,
  summary: {
    inspected: inspected.length,
    ready_ai: readyAi.length,
    ready_human: readyHuman.length,
    rejected_ai: inspected.filter((row) => row.label === "AI" && !row.reachability.ok).length,
    rejected_human: inspected.filter((row) => row.label === "HUMAN" && !row.reachability.ok).length
  },
  candidates: inspected
};
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), ...output.summary }, null, 2)}\n`);
