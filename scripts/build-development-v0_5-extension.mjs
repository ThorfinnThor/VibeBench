import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assessDevelopmentPageQuality } from "../lib/content-quality.mjs";

const outputDir = path.resolve("outputs/development_v0_5");
const poolPath = path.join(outputDir, "vibebench_development_v0_5_candidate_pool.json");
const manifestPath = path.join(outputDir, "vibebench_development_extension_120_v0_5.json");
const cutoff = "2022-11-30T00:00:00Z";
const aiBuckets = [
  ["CURSOR", /\bCursor\b/i],
  ["CLAUDE_CODE", /Claude Code/i],
  ["WINDSURF", /Windsurf/i],
  ["CODEX", /(?:OpenAI )?(?:GPT-[\d.]+-)?Codex|\bCodex\b/i],
  ["NATIVE_BUILDER", /(?:Replit Agent|Lovable|Bolt|v0 by Vercel)/i]
];
const humanQueries = [
  "topic:dashboard created:<2022-11-30 stars:50..5000",
  "topic:e-commerce created:<2022-11-30 stars:50..5000",
  "topic:analytics created:<2022-11-30 stars:50..5000",
  "topic:developer-tools created:<2022-11-30 stars:50..5000"
];
const exclusionFiles = [
  "outputs/development_v0_2/vibebench_development_extension_40_v0_2.json",
  "outputs/development_v0_3/vibebench_development_extension_60_v0_3.json",
  "outputs/development_v0_3/vibebench_development_expansion_88_v0_3.json",
  "outputs/development_v0_4/vibebench_development_extension_58_v0_4.json",
  "outputs/holdout_v0_1/vibebench_blind_holdout_100_v0_1.csv",
  "outputs/confirmation_v0_2/vibebench_confirmation_holdout_100_v0_2.json",
  "outputs/confirmation_v0_3/vibebench_confirmation_holdout_100_v0_3.json",
  "outputs/confirmation_v0_4/vibebench_confirmation_holdout_100_v0_4.json"
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function normalizeUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) return "";
    url.hash = "";
    return url.toString();
  } catch { return ""; }
}
function host(value) {
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return ""; }
}
function developmentPartition(value) {
  return Number.parseInt(sha256(value).slice(0, 8), 16) % 2 === 0;
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
      headers: { "user-agent": "VibeBench/0.5-development-acquisition", accept: "text/html,application/xhtml+xml" }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (!/html|xhtml/i.test(contentType)) throw new Error(`Unsupported content type: ${contentType}`);
    const html = await readLimited(response);
    const quality = assessDevelopmentPageQuality({ headers: response.headers, html });
    return { ...row, reachability: { ok: quality.eligible, status: response.status, resolved_url: response.url, resolved_host: host(response.url), html_bytes_checked: new TextEncoder().encode(html).length, disqualifying_signals: quality.disqualifying_signals } };
  } catch (error) {
    return { ...row, reachability: { ok: false, error: error instanceof Error ? error.message : String(error) } };
  }
}
async function mapConcurrent(rows, limit, worker) {
  const results = new Array(rows.length);
  let cursor = 0;
  let completed = 0;
  async function run() {
    while (cursor < rows.length) {
      const index = cursor++;
      results[index] = await worker(rows[index]);
      completed += 1;
      if (completed % 10 === 0 || completed === rows.length) process.stdout.write(`${completed}/${rows.length} acquisition checks complete\n`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, rows.length) }, run));
  return results;
}
async function fetchJson(url, headers = {}) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.json();
}

const exclusionTexts = await Promise.all(exclusionFiles.map((file) => readFile(path.resolve(file), "utf8")));
const excludedHosts = new Set(exclusionTexts.flatMap((text) => [...text.matchAll(/https?:\/\/[^\s"',<>]+/gi)].map((match) => host(match[0]))).filter(Boolean));
const existingHumanPool = JSON.parse(await readFile(path.resolve("outputs/development_v0_3/vibebench_development_v0_3_human_expansion_pool.json"), "utf8"));
const [submissions, ...githubPayloads] = await Promise.all([
  fetchJson("https://www.hot100.ai/api/submissions"),
  ...humanQueries.map(async (query) => ({
    query,
    payload: await fetchJson(`https://api.github.com/search/repositories?${new URLSearchParams({ q: query, sort: "stars", order: "desc", per_page: "100" })}`, { accept: "application/vnd.github+json", "user-agent": "VibeBench-v0.5-development" })
  }))
]);

const seenAi = new Set(excludedHosts);
const aiCandidates = [];
for (const project of submissions) {
  const targetUrl = normalizeUrl(project.projectUrl);
  const targetHost = host(targetUrl);
  const tools = (project.builderTool || []).map(String);
  const matching = aiBuckets.find(([, pattern]) => tools.some((tool) => pattern.test(tool)));
  if (!targetUrl || !targetHost || !matching || seenAi.has(targetHost) || !developmentPartition(targetHost) || /github\.com$|(?:play|apps)\.google\.com$|apps\.apple\.com$/i.test(targetHost)) continue;
  seenAi.add(targetHost);
  aiCandidates.push({
    candidate_id: `DEV5-AI-${String(aiCandidates.length + 1).padStart(3, "0")}`,
    label: "AI",
    target_url: targetUrl,
    project_family_id: targetHost,
    project_name: project.projectName,
    builder_bucket: matching[0],
    builder_evidence: tools.filter((tool) => aiBuckets.some(([, pattern]) => pattern.test(tool))),
    provenance_type: "independent_public_approved_submission",
    provenance_url: `https://hot100.ai/project/${project.id}`,
    provenance_summary: `Public approved submission metadata lists: ${tools.join(", ")}.`,
    source_project_id: project.id,
    submitted_at: project.createdAt,
    selection_partition: "development_by_project_family_hash",
    model_score_inspected_during_acquisition: false
  });
}

const seenHuman = new Set([...excludedHosts, ...seenAi]);
const reusableHumans = existingHumanPool.candidates.filter((row) => row.reachability?.ok && !seenHuman.has(row.project_family_id)).map((row) => ({ ...row, candidate_id: `DEV5-HUM-EXISTING-${row.project_family_id}`, selection_partition: "previously_acquired_unused_development_candidate", model_score_inspected_during_acquisition: false }));
for (const row of reusableHumans) seenHuman.add(row.project_family_id);
const githubItems = githubPayloads.flatMap(({ query, payload }) => (payload.items || []).map((repo) => ({ ...repo, query })));
const newHumanCandidates = [];
for (const repo of githubItems.sort((a, b) => b.stargazers_count - a.stargazers_count || a.full_name.localeCompare(b.full_name))) {
  const targetUrl = normalizeUrl(repo.homepage);
  const targetHost = host(targetUrl);
  if (!targetUrl || !targetHost || seenHuman.has(targetHost) || !developmentPartition(targetHost) || Date.parse(repo.created_at) >= Date.parse(cutoff) || /github\.com$|github\.io$|youtube\.com$|medium\.com$|twitter\.com$|x\.com$|(?:play|apps)\.google\.com$|apps\.apple\.com$/i.test(targetHost)) continue;
  seenHuman.add(targetHost);
  newHumanCandidates.push({
    candidate_id: `DEV5-HUM-NEW-${String(newHumanCandidates.length + 1).padStart(3, "0")}`,
    label: "HUMAN",
    target_url: targetUrl,
    project_family_id: targetHost,
    project_name: repo.name,
    repository: repo.full_name,
    repository_created_at: repo.created_at,
    provenance_type: "official_public_source_repository",
    provenance_url: repo.html_url,
    provenance_summary: `Official repository links the target and predates ${cutoff}.`,
    source_stars: repo.stargazers_count,
    source_query: repo.query,
    selection_partition: "development_by_project_family_hash",
    model_score_inspected_during_acquisition: false,
    label_limitation: "Operational Human control; later AI assistance cannot be excluded."
  });
}

const aiToInspect = aiBuckets.flatMap(([bucket]) => aiCandidates.filter((row) => row.builder_bucket === bucket).slice(0, 24));
const inspected = await mapConcurrent([...aiToInspect, ...newHumanCandidates.slice(0, 90)], 12, inspect);
const inspectedAi = inspected.filter((row) => row.label === "AI");
const readyAiByBucket = Object.fromEntries(aiBuckets.map(([bucket]) => [bucket, inspectedAi.filter((row) => row.builder_bucket === bucket && row.reachability.ok)]));
const selectedAi = [];
let aiRound = 0;
while (selectedAi.length < 60) {
  let added = false;
  for (const [bucket] of aiBuckets) {
    const row = readyAiByBucket[bucket][aiRound];
    if (row && selectedAi.length < 60) { selectedAi.push(row); added = true; }
  }
  if (!added) break;
  aiRound += 1;
}
const readyNewHumans = inspected.filter((row) => row.label === "HUMAN" && row.reachability.ok);
const selectedHuman = [...reusableHumans.slice(0, 30), ...readyNewHumans.slice(0, 30)];
if (selectedAi.length !== 60 || selectedHuman.length !== 60) throw new Error(`Need 60/60 Development rows, found ${selectedAi.length}/${selectedHuman.length}.`);

const selected = [...selectedAi, ...selectedHuman].map((row, index) => ({
  sample_id: `DEV5-${String(index + 1).padStart(3, "0")}`,
  target_group: row.label === "AI" ? `AI_${row.builder_bucket}_V05` : "HUMAN_ESTABLISHED_PRODUCT_V05",
  label: row.label,
  builder: row.label === "AI" ? row.builder_bucket : "Human control",
  target_url: row.target_url,
  project_family_id: row.project_family_id,
  project_name: row.project_name,
  provenance_type: row.provenance_type,
  provenance_url: row.provenance_url,
  provenance_summary: row.provenance_summary,
  source_metadata: row.label === "AI"
    ? { project_id: row.source_project_id, submitted_at: row.submitted_at, builder_evidence: row.builder_evidence }
    : { repository: row.repository, created_at: row.repository_created_at, stars: row.source_stars },
  acquisition: { selected_before_any_model_scoring: true, model_score_inspected: false, opened_confirmation_rows_used: false }
}));

const pool = {
  schema_version: "v0.5-development-candidate-pool",
  generated_at: new Date().toISOString(),
  purpose: "Development acquisition with deterministic project-family split; opposite partition reserved for future confirmation.",
  model_scores_inspected: false,
  opened_confirmation_rows_used: false,
  sources: { ai: "Hot100 public approved submissions", human: ["unused pre-acquired Human pool", ...humanQueries] },
  summary: {
    ai_candidates: aiCandidates.length,
    ai_inspected: inspectedAi.length,
    ai_ready: inspectedAi.filter((row) => row.reachability.ok).length,
    human_reusable_ready: reusableHumans.length,
    human_new_candidates: newHumanCandidates.length,
    human_new_ready: readyNewHumans.length,
    selected_ai: selectedAi.length,
    selected_human: selectedHuman.length
  },
  candidates: [...inspected, ...reusableHumans]
};
const manifest = {
  schema_version: "v0.5-development-extension",
  generated_at: new Date().toISOString(),
  status: "DEVELOPMENT_ONLY_READY",
  failed_confirmation_used_for_training: false,
  failed_confirmation_used_for_error_analysis: true,
  selection: "60 reachable AI sites selected round-robin across five builder strata plus 60 reachable Human controls; selected without model scores.",
  summary: { total: 120, ai: 60, human: 60, strata: Object.fromEntries([...new Set(selected.map((row) => row.target_group))].map((group) => [group, selected.filter((row) => row.target_group === group).length])) },
  samples: selected
};
await mkdir(outputDir, { recursive: true });
await Promise.all([
  writeFile(poolPath, `${JSON.stringify(pool, null, 2)}\n`, "utf8"),
  writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
]);
process.stdout.write(`${JSON.stringify({ candidate_pool: path.relative(process.cwd(), poolPath), manifest: path.relative(process.cwd(), manifestPath), pool: pool.summary, selected: manifest.summary }, null, 2)}\n`);
