import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assessDevelopmentPageQuality } from "../lib/content-quality.mjs";

const outputDir = path.resolve("outputs/confirmation_v0_3");
const candidatePath = path.join(outputDir, "vibebench_confirmation_v0_3_candidate_pool.json");
const manifestPath = path.join(outputDir, "vibebench_confirmation_holdout_100_v0_3.json");
const queuePath = path.join(outputDir, "vibebench_confirmation_holdout_100_v0_3.scan-queue.json");
const weeks = Array.from({ length: 36 }, (_, index) => new Date(Date.UTC(2026, 7, 3 - index * 7)).toISOString().slice(0, 10));
const cutoff = "2022-11-30T00:00:00Z";
const humanQueries = [
  "topic:web-application created:<2022-11-30 stars:50..5000",
  "topic:pwa created:<2022-11-30 stars:100..5000"
];
const bucketRules = [
  ["CURSOR", /\bCursor\b/i], ["CLAUDE_CODE", /Claude Code/i], ["WINDSURF", /Windsurf/i],
  ["CODEX", /(?:OpenAI )?(?:GPT-[\d.]+-)?Codex/i], ["NATIVE_BUILDER", /(?:Replit Agent|Lovable|Bolt|V0 by Vercel)/i]
];
const sha256 = (text) => createHash("sha256").update(text).digest("hex");
function host(value) { try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; } }
function normalizeUrl(value) { try { const url = new URL(String(value || "").trim()); if (!["http:", "https:"].includes(url.protocol)) return ""; url.hash = ""; return url.toString(); } catch { return ""; } }
async function readLimited(response, maxBytes = 500_000) { const reader = response.body?.getReader(); if (!reader) return ""; const chunks = []; let total = 0; while (total < maxBytes) { const { done, value } = await reader.read(); if (done) break; const remaining = maxBytes - total; chunks.push(value.subarray(0, remaining)); total += Math.min(value.byteLength, remaining); if (value.byteLength > remaining) { await reader.cancel(); break; } } const bytes = new Uint8Array(total); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; } return new TextDecoder().decode(bytes); }
async function inspect(row) { try { const response = await fetch(row.target_url, { redirect: "follow", signal: AbortSignal.timeout(20_000), headers: { "user-agent": "VibeBench/0.3-confirmation-acquisition", accept: "text/html,application/xhtml+xml" } }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const contentType = response.headers.get("content-type") || ""; if (!/html|xhtml/i.test(contentType)) throw new Error(`Unsupported content type: ${contentType}`); const html = await readLimited(response); const quality = assessDevelopmentPageQuality({ headers: response.headers, html }); return { ...row, reachability: { ok: quality.eligible, status: response.status, resolved_url: response.url, resolved_host: host(response.url), html_bytes_checked: new TextEncoder().encode(html).length, disqualifying_signals: quality.disqualifying_signals } }; } catch (error) { return { ...row, reachability: { ok: false, error: error instanceof Error ? error.message : String(error) } }; } }
async function mapConcurrent(rows, limit, worker) { const results = new Array(rows.length); let cursor = 0; async function run() { while (cursor < rows.length) { const index = cursor++; results[index] = await worker(rows[index]); process.stdout.write(`${index + 1}/${rows.length} ${rows[index].candidate_id} ${results[index].reachability.ok ? "READY" : "REJECT"}\n`); } } await Promise.all(Array.from({ length: Math.min(limit, rows.length) }, run)); return results; }

const exclusionFiles = [
  "outputs/development_v0_2/vibebench_development_extension_40_v0_2.json",
  "outputs/development_v0_3/vibebench_development_v0_3_candidate_pool.json",
  "outputs/development_v0_3/vibebench_development_v0_3_human_expansion_pool.json",
  "outputs/development_v0_3/vibebench_development_extension_60_v0_3.json",
  "outputs/development_v0_3/vibebench_development_expansion_88_v0_3.json",
  "outputs/holdout_v0_1/vibebench_blind_holdout_100_v0_1.csv",
  "outputs/confirmation_v0_2/vibebench_confirmation_v0_2_candidate_pool.json",
  "outputs/confirmation_v0_2/vibebench_confirmation_holdout_100_v0_2.json"
];
const exclusionTexts = await Promise.all(exclusionFiles.map((file) => readFile(path.resolve(file), "utf8")));
const excluded = new Set(exclusionTexts.flatMap((text) => [...text.matchAll(/https?:\/\/[^\s"',<>]+/gi)].map((match) => host(match[0]))).filter(Boolean));

const historicalPayloads = await Promise.all(weeks.map(async (week) => { const response = await fetch(`https://www.hot100.ai/api/chart/top100?weekOf=${week}`, { signal: AbortSignal.timeout(20_000) }); if (!response.ok) throw new Error(`Hot100 HTTP ${response.status}`); return response.json(); }));
const historical = historicalPayloads.flatMap((payload) => (payload.projects || []).map((project) => ({ ...project, chart_week: payload.chartWeek })));
const seenAi = new Set(excluded);
const aiCandidates = [];
for (const project of historical.sort((a, b) => b.chart_week.localeCompare(a.chart_week) || a.rank - b.rank || a.id - b.id)) {
  const targetUrl = normalizeUrl(project.projectUrl); const targetHost = host(targetUrl); const tools = (project.builtWith || []).map(String);
  if (!targetUrl || !targetHost || seenAi.has(targetHost) || /^(?:play|apps)\.google\.com$|^apps\.apple\.com$/i.test(targetHost)) continue;
  const matching = bucketRules.find(([, pattern]) => tools.some((tool) => pattern.test(tool))); if (!matching) continue;
  seenAi.add(targetHost);
  aiCandidates.push({ candidate_id: `CONF3-AI-${String(aiCandidates.length + 1).padStart(3, "0")}`, label: "AI", target_url: targetUrl, project_family_id: targetHost, project_name: project.projectName, builder_bucket: matching[0], builder_evidence: tools.filter((tool) => bucketRules.some(([, pattern]) => pattern.test(tool))), provenance_type: "independent_reviewed_directory_historical_chart", provenance_url: project.hot100Url || `https://hot100.ai/project/${project.id}`, provenance_summary: `Hot100 chart ${project.chart_week} metadata lists: ${tools.join(", ")}.`, chart_week: project.chart_week, source_rank: project.rank, model_score_inspected_during_acquisition: false });
}

const githubPayloads = await Promise.all(humanQueries.map(async (query) => { const response = await fetch(`https://api.github.com/search/repositories?${new URLSearchParams({ q: query, sort: "stars", order: "desc", per_page: "100" })}`, { headers: { accept: "application/vnd.github+json", "user-agent": "VibeBench-v0.3-confirmation-acquisition" }, signal: AbortSignal.timeout(20_000) }); if (!response.ok) throw new Error(`GitHub search HTTP ${response.status} for ${query}`); return { query, payload: await response.json() }; }));
const githubItems = githubPayloads.flatMap(({ query, payload }) => (payload.items || []).map((repo) => ({ ...repo, query })));
const seenHuman = new Set([...excluded, ...seenAi]);
const humanCandidates = [];
for (const repo of githubItems.sort((a, b) => b.stargazers_count - a.stargazers_count || a.full_name.localeCompare(b.full_name))) {
  const targetUrl = normalizeUrl(repo.homepage); const targetHost = host(targetUrl);
  if (!targetUrl || !targetHost || seenHuman.has(targetHost) || Date.parse(repo.created_at) >= Date.parse(cutoff)) continue;
  if (/github\.com$|github\.io$|youtube\.com$|youtu\.be$|medium\.com$|twitter\.com$|x\.com$|(?:play|apps)\.google\.com$|apps\.apple\.com$/i.test(targetHost)) continue;
  seenHuman.add(targetHost);
  humanCandidates.push({ candidate_id: `CONF3-HUM-${String(humanCandidates.length + 1).padStart(3, "0")}`, label: "HUMAN", target_url: targetUrl, project_family_id: targetHost, project_name: repo.name, repository: repo.full_name, repository_created_at: repo.created_at, provenance_type: "official_public_source_repository", provenance_url: repo.html_url, provenance_summary: `Official repository links the target and predates ${cutoff}.`, source_stars: repo.stargazers_count, source_query: repo.query, model_score_inspected_during_acquisition: false, label_limitation: "Operational Human control; later AI assistance cannot be excluded." });
}

const inspected = await mapConcurrent([...aiCandidates.slice(0, 85), ...humanCandidates.slice(0, 85)], 12, inspect);
const readyAi = inspected.filter((row) => row.label === "AI" && row.reachability.ok);
const readyHuman = inspected.filter((row) => row.label === "HUMAN" && row.reachability.ok);
const nonCursor = readyAi.filter((row) => row.builder_bucket !== "CURSOR");
const selectedAi = [...nonCursor, ...readyAi.filter((row) => row.builder_bucket === "CURSOR")].slice(0, 50);
const selectedHuman = readyHuman.slice(0, 50);
if (selectedAi.length !== 50 || selectedHuman.length !== 50) throw new Error(`Need 50/50 ready rows, found ${selectedAi.length}/${selectedHuman.length}.`);
const samples = [...selectedAi, ...selectedHuman].map((row, index) => ({ sample_id: `CONF3-${String(index + 1).padStart(3, "0")}`, label: row.label, target_url: row.target_url, project_family_id: row.project_family_id, project_name: row.project_name, stratum: row.label === "AI" ? row.builder_bucket : "HUMAN_PRE_CUTOFF_REPO", provenance_type: row.provenance_type, provenance_url: row.provenance_url, provenance_summary: row.provenance_summary, source_metadata: row.label === "AI" ? { chart_week: row.chart_week, rank: row.source_rank, builder_evidence: row.builder_evidence } : { repository: row.repository, created_at: row.repository_created_at, stars: row.source_stars }, model_score_inspected_before_selection: false }));
const candidatePool = { schema_version: "v0.3-confirmation-candidate-pool", generated_at: new Date().toISOString(), purpose: "Independent confirmation acquisition before candidate scoring.", model_scores_inspected: false, previous_holdouts_used_for_tuning: false, sources: { ai: weeks, human: humanQueries }, excluded_hosts: excluded.size, summary: { inspected: inspected.length, ready_ai: readyAi.length, ready_human: readyHuman.length, selected_ai: 50, selected_human: 50 }, candidates: inspected };
const manifest = { schema_version: "v0.3-confirmation-holdout", generated_at: new Date().toISOString(), status: "READY_TO_FREEZE", independent_confirmation: true, model_scores_inspected_before_selection: false, previous_holdouts_used_for_tuning: false, selection_rule: "All reachable non-Cursor strata first, then reachable Cursor by recency/rank; first 50 reachable Human controls by stars. No model scores.", summary: { total: 100, ai: 50, human: 50, strata: Object.fromEntries([...new Set(samples.map((row) => row.stratum))].map((stratum) => [stratum, samples.filter((row) => row.stratum === stratum).length])) }, samples };
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
const queue = { schema_version: "v0.3-confirmation-scan-queue", manifest_sha256: sha256(manifestText), labels_included: false, rows: samples.map(({ sample_id, target_url }) => ({ sample_id, target_url })) };
await mkdir(outputDir, { recursive: true });
await Promise.all([writeFile(candidatePath, `${JSON.stringify(candidatePool, null, 2)}\n`, "utf8"), writeFile(manifestPath, manifestText, "utf8"), writeFile(queuePath, `${JSON.stringify(queue, null, 2)}\n`, "utf8")]);
process.stdout.write(`${JSON.stringify({ candidate_pool: path.relative(process.cwd(), candidatePath), manifest: path.relative(process.cwd(), manifestPath), queue: path.relative(process.cwd(), queuePath), candidate_summary: candidatePool.summary, manifest_summary: manifest.summary }, null, 2)}\n`);
