import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assessDevelopmentPageQuality } from "../lib/content-quality.mjs";

const outputDir = path.resolve("outputs/development_v0_3");
const candidatePoolPath = path.join(outputDir, "vibebench_development_v0_3_candidate_pool.json");
const initialPath = path.join(outputDir, "vibebench_development_extension_60_v0_3.json");
const confirmationPath = path.resolve("outputs/confirmation_v0_2/vibebench_confirmation_holdout_100_v0_2.json");
const outputPath = path.join(outputDir, "vibebench_development_expansion_88_v0_3.json");
const humanPoolPath = path.join(outputDir, "vibebench_development_v0_3_human_expansion_pool.json");
const cutoff = "2022-11-30T00:00:00Z";
const queries = [
  "topic:webapp created:<2022-11-30 stars:100..500",
  "topic:saas created:<2022-11-30 stars:20..100",
  "topic:productivity created:<2022-11-30 stars:50..500",
  "topic:dashboard created:<2022-11-30 stars:100..1000",
  "topic:react-app created:<2022-11-30 stars:500..5000",
  "topic:nextjs created:<2022-11-30 stars:200..5000",
  "topic:self-hosted topic:webapp created:<2022-11-30 stars:500..5000",
  "topic:developer-tools created:<2022-11-30 stars:500..5000"
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
    const response = await fetch(row.target_url, { redirect: "follow", signal: AbortSignal.timeout(20_000), headers: { "user-agent": "VibeBench/0.3-development-expansion", accept: "text/html,application/xhtml+xml" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (!/html|xhtml/i.test(contentType)) throw new Error(`Unsupported content type: ${contentType}`);
    const html = await readLimited(response);
    const quality = assessDevelopmentPageQuality({ headers: response.headers, html });
    return { ...row, reachability: { ok: quality.eligible, status: response.status, resolved_url: response.url, resolved_host: host(response.url), content_type: contentType, html_bytes_checked: new TextEncoder().encode(html).length, disqualifying_signals: quality.disqualifying_signals } };
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

const [candidatePool, initial, confirmation] = await Promise.all([candidatePoolPath, initialPath, confirmationPath].map((file) => readFile(file, "utf8").then(JSON.parse)));
const used = new Set([...initial.samples, ...confirmation.samples].map((row) => row.project_family_id));
const selectedAi = candidatePool.candidates.filter((row) => row.reachability?.ok && !used.has(row.project_family_id));
if (selectedAi.length !== 44) throw new Error(`Expected the 44 pre-acquired unused AI rows, found ${selectedAi.length}.`);

const githubItems = [];
for (const query of queries) {
  const url = `https://api.github.com/search/repositories?${new URLSearchParams({ q: query, sort: "stars", order: "desc", per_page: "100" })}`;
  const response = await fetch(url, { headers: { accept: "application/vnd.github+json", "user-agent": "VibeBench-v0.3-development-expansion" }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`GitHub search HTTP ${response.status} for ${query}`);
  const payload = await response.json();
  githubItems.push(...(payload.items || []).map((item) => ({ ...item, acquisition_query: query })));
}

const seen = new Set(used);
const repoSeen = new Set();
const candidates = [];
for (const repo of githubItems.sort((a, b) => b.stargazers_count - a.stargazers_count || a.full_name.localeCompare(b.full_name))) {
  const targetUrl = normalizeUrl(repo.homepage);
  const targetHost = host(targetUrl);
  if (!targetUrl || !targetHost || seen.has(targetHost) || repoSeen.has(repo.full_name)) continue;
  if (Date.parse(repo.created_at) >= Date.parse(cutoff)) continue;
  if (/github\.com$|github\.io$|youtube\.com$|youtu\.be$|medium\.com$|twitter\.com$|x\.com$|(?:play|apps)\.google\.com$|apps\.apple\.com$/i.test(targetHost)) continue;
  seen.add(targetHost);
  repoSeen.add(repo.full_name);
  candidates.push({
    candidate_id: `DEV3-HUMX-${String(candidates.length + 1).padStart(3, "0")}`,
    label: "HUMAN",
    target_group: "HUMAN_ESTABLISHED_PRODUCT_EXPANSION",
    builder: "Human control",
    target_url: targetUrl,
    project_family_id: targetHost,
    project_name: repo.name,
    repository: repo.full_name,
    repository_created_at: repo.created_at,
    provenance_type: "official_public_source_repository",
    provenance_url: repo.html_url,
    provenance_summary: `Official public repository links the target and predates ${cutoff}.`,
    source_stars: repo.stargazers_count,
    source_query: repo.acquisition_query,
    label_limitation: "Operational Human control; pre-cutoff project history does not prove that no later contributor used AI assistance.",
    model_score_inspected_during_acquisition: false
  });
  if (candidates.length >= 100) break;
}

const inspectedHuman = await mapConcurrent(candidates, 8, inspect);
const selectedHuman = inspectedHuman.filter((row) => row.reachability.ok).slice(0, 44);
if (selectedHuman.length !== 44) throw new Error(`Need 44 reachable Human expansion rows, found ${selectedHuman.length}.`);
const samples = [...selectedAi, ...selectedHuman].map((row, index) => ({
  sample_id: `DEV3X-${String(index + 1).padStart(3, "0")}`,
  target_group: row.label === "AI" ? `AI_${row.builder}_EXPANSION` : row.target_group,
  label: row.label,
  builder: row.label === "AI" ? row.builder : "Human control",
  target_url: row.target_url,
  project_family_id: row.project_family_id,
  project_name: row.project_name,
  provenance_type: row.provenance_type,
  provenance_url: row.provenance_url,
  provenance_summary: row.provenance_summary,
  acquisition: { model_score_inspected: false, failed_confirmation_result_rows_inspected: false, reachability_checked: true }
}));
const output = {
  schema_version: "v0.3-development-expansion",
  generated_at: new Date().toISOString(),
  status: "DEVELOPMENT_ONLY_READY",
  failed_confirmation_used_for_training: false,
  failed_confirmation_used_for_error_analysis: false,
  model_scores_inspected_during_acquisition: false,
  selection: "All 44 reachable, unused historical-chart AI candidates plus first 44 reachable new pre-cutoff GitHub controls.",
  summary: { total: 88, ai: 44, human: 44, human_candidates_inspected: inspectedHuman.length, human_candidates_reachable: inspectedHuman.filter((row) => row.reachability.ok).length },
  samples
};
const poolOutput = { schema_version: "v0.3-human-expansion-pool", generated_at: new Date().toISOString(), queries, cutoff, model_scores_inspected: false, candidates: inspectedHuman };
await mkdir(outputDir, { recursive: true });
await Promise.all([writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8"), writeFile(humanPoolPath, `${JSON.stringify(poolOutput, null, 2)}\n`, "utf8")]);
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), human_pool: path.relative(process.cwd(), humanPoolPath), summary: output.summary }, null, 2)}\n`);
