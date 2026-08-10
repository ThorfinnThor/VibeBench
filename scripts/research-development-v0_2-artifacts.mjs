import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { extractSameOriginAssets } from "../lib/extract-assets.mjs";

const manifestPath = path.resolve("outputs/development_v0_2/vibebench_development_extension_40_v0_2.json");
const frozenPath = path.resolve("outputs/development_v0_2/vibebench_development_v0_2_frozen_manifest.json");
const outputPath = path.resolve("outputs/development_v0_2/vibebench_development_v0_2_artifact_research.json");
const maxHtmlBytes = 1_500_000;
const maxAssetBytes = 300_000;
const concurrency = 4;

const markerRules = [
  { id: "replit-agent-phrase", classification: "direct-candidate", pattern: /replit[\s_-]+agent/i },
  { id: "generated-by-replit", classification: "direct-candidate", pattern: /generated[\s_-]+by[\s_-]+replit/i },
  { id: "built-with-replit", classification: "direct-candidate", pattern: /built[\s_-]+with[\s_-]+replit/i },
  { id: "replit-cdn", classification: "runtime-context", pattern: /replit-cdn\.com/i },
  { id: "replit-app-host", classification: "hosting-context", pattern: /replit\.app/i },
  { id: "replit-dev-host", classification: "runtime-context", pattern: /replit\.dev/i },
  { id: "repl-co-host", classification: "hosting-context", pattern: /repl\.co/i },
  { id: "replitusercontent", classification: "runtime-context", pattern: /replitusercontent\.com/i },
  { id: "bolt-new", classification: "direct-candidate", pattern: /bolt\.new/i },
  { id: "built-with-bolt", classification: "direct-candidate", pattern: /built[\s_-]+with[\s_-]+bolt/i },
  { id: "made-with-bolt", classification: "direct-candidate", pattern: /made[\s_-]+with[\s_-]+bolt/i },
  { id: "bolt-generated", classification: "direct-candidate", pattern: /bolt[\s_-]+generated/i },
  { id: "stackblitz", classification: "tooling-context", pattern: /stackblitz/i },
  { id: "webcontainer", classification: "tooling-context", pattern: /webcontainer/i }
];

const headerRules = [
  { id: "google-frontend", test: (headers) => /google frontend/i.test(headers.server || "") && /\bgoogle\b/i.test(headers.via || "") },
  { id: "netlify-response", test: (headers) => /netlify/i.test(headers.server || "") || Boolean(headers["x-nf-request-id"]) },
  { id: "vercel-response", test: (headers) => /vercel/i.test(headers.server || "") || Boolean(headers["x-vercel-id"]) },
  { id: "cloudflare-edge", test: (headers) => /cloudflare/i.test(headers.server || "") || Boolean(headers["cf-ray"]) },
  { id: "express-response", test: (headers) => /express/i.test(headers["x-powered-by"] || "") },
  { id: "nextjs-response", test: (headers) => /next\.?js/i.test(headers["x-powered-by"] || "") }
];

function normalizeHost(value) {
  return value.toLowerCase().replace(/^www\./, "");
}

async function readLimited(response, maxBytes) {
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > maxBytes) throw new Error(`Declared body exceeds ${maxBytes} bytes.`);
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

async function fetchMain(initialUrl) {
  let current = new URL(initialUrl);
  for (let redirect = 0; redirect <= 5; redirect += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
      headers: { "user-agent": "VibeBench/0.2-development-research", accept: "text/html,application/xhtml+xml" }
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`Redirect ${response.status} without location.`);
      current = new URL(location, current);
      if (!["http:", "https:"].includes(current.protocol)) throw new Error("Unsupported redirect protocol.");
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { response, html: await readLimited(response, maxHtmlBytes), resolvedUrl: current.toString() };
  }
  throw new Error("Too many redirects.");
}

async function fetchAsset(initialUrl, origin) {
  let current = new URL(initialUrl);
  for (let redirect = 0; redirect <= 3; redirect += 1) {
    if (current.origin !== origin) throw new Error("Cross-origin asset blocked.");
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
      headers: { "user-agent": "VibeBench/0.2-development-research", accept: "text/css,application/javascript,text/javascript,text/plain" }
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Asset redirect without location.");
      current = new URL(location, current);
      continue;
    }
    if (!response.ok) throw new Error(`Asset HTTP ${response.status}`);
    return readLimited(response, maxAssetBytes);
  }
  throw new Error("Too many asset redirects.");
}

function externalHosts(text, targetHost) {
  const hosts = new Set();
  for (const match of text.matchAll(/(?:https?:)?\/\/([a-z0-9.-]+)(?=[:/"'`\s)])/gi)) {
    const hostname = normalizeHost(match[1]);
    if (hostname && hostname.includes(".") && hostname !== targetHost) hosts.add(hostname);
  }
  return [...hosts].sort();
}

function selectedHeaders(headers) {
  const selected = {};
  for (const key of ["server", "x-powered-by", "x-replit-user-id", "x-vercel-id", "x-nf-request-id", "cf-ray", "via"]) {
    const value = headers.get(key);
    if (value) selected[key] = value.slice(0, 240);
  }
  return selected;
}

async function inspect(row) {
  try {
    const { response, html, resolvedUrl } = await fetchMain(row.target_url);
    const resolved = new URL(resolvedUrl);
    const assets = extractSameOriginAssets({ html, baseUrl: resolvedUrl });
    const settled = await Promise.allSettled(assets.map((asset) => fetchAsset(asset.url, resolved.origin)));
    const assetTexts = settled.filter((result) => result.status === "fulfilled").map((result) => result.value);
    const combined = `${html}\n${assetTexts.join("\n")}`;
    const markers = markerRules.filter((rule) => rule.pattern.test(combined)).map(({ id, classification }) => ({ id, classification }));
    const generatorMeta = [...html.matchAll(/<meta\b[^>]*name=["']generator["'][^>]*content=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1].slice(0, 240));
    return {
      sample_id: row.sample_id,
      target_group: row.target_group,
      label: row.label,
      builder: row.builder,
      target_url: row.target_url,
      resolved_url: resolvedUrl,
      ok: true,
      html_bytes: new TextEncoder().encode(html).length,
      assets_requested: assets.length,
      assets_fetched: assetTexts.length,
      asset_fetch_errors: settled.length - assetTexts.length,
      headers: selectedHeaders(response.headers),
      generator_meta: generatorMeta,
      markers,
      external_hosts: externalHosts(combined, normalizeHost(resolved.hostname))
    };
  } catch (error) {
    return {
      sample_id: row.sample_id,
      target_group: row.target_group,
      label: row.label,
      builder: row.builder,
      target_url: row.target_url,
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function mapConcurrent(rows, limit, worker) {
  const results = new Array(rows.length);
  let cursor = 0;
  async function run() {
    while (cursor < rows.length) {
      const index = cursor++;
      results[index] = await worker(rows[index]);
      process.stdout.write(`${index + 1}/${rows.length} ${rows[index].sample_id} ${results[index].ok ? "OK" : "ERROR"}\n`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, rows.length) }, run));
  return results;
}

const [manifest, frozen] = await Promise.all([manifestPath, frozenPath].map((file) => readFile(file, "utf8").then(JSON.parse)));
if (frozen.status !== "FROZEN" || manifest.samples?.length !== 40 || manifest.samples.some((row) => row.status !== "READY")) {
  throw new Error("Artifact research requires the frozen 40-row Development v0.2 corpus.");
}
const results = await mapConcurrent(manifest.samples, concurrency, inspect);
const successful = results.filter((row) => row.ok);
const groups = [...new Set(successful.map((row) => row.target_group))];
const markerPrevalence = Object.fromEntries(markerRules.map((rule) => [rule.id, Object.fromEntries(groups.map((group) => [
  group,
  successful.filter((row) => row.target_group === group && row.markers.some((marker) => marker.id === rule.id)).length
]))]));
const headerPrevalence = Object.fromEntries(headerRules.map((rule) => [rule.id, Object.fromEntries(groups.map((group) => [
  group,
  successful.filter((row) => row.target_group === group && rule.test(row.headers || {})).length
]))]));
const hostCounts = new Map();
for (const row of successful) {
  for (const hostname of row.external_hosts) {
    if (!hostCounts.has(hostname)) hostCounts.set(hostname, Object.fromEntries(groups.map((group) => [group, 0])));
    hostCounts.get(hostname)[row.target_group] += 1;
  }
}
const humanGroups = new Set(["HUMAN_MODERN_SAAS_NEW", "HUMAN_MODERN_APP_NEW"]);
const groupExclusiveExternalHosts = [...hostCounts.entries()]
  .map(([hostname, counts]) => ({ hostname, counts, ai: Object.entries(counts).filter(([group]) => !humanGroups.has(group)).reduce((total, [, count]) => total + count, 0), human: Object.entries(counts).filter(([group]) => humanGroups.has(group)).reduce((total, [, count]) => total + count, 0) }))
  .filter((row) => row.ai > 0 && row.human === 0)
  .sort((a, b) => b.ai - a.ai || a.hostname.localeCompare(b.hostname))
  .slice(0, 100);

const research = {
  schema_version: "v0.2-development-artifact-research",
  generated_at: new Date().toISOString(),
  purpose: "Development-only artifact discovery; candidate prevalence is not a production rule or evaluation result.",
  input: path.relative(process.cwd(), manifestPath),
  holdout_used: false,
  summary: {
    total: results.length,
    successful: successful.length,
    errors: results.length - successful.length,
    groups: Object.fromEntries(groups.map((group) => [group, successful.filter((row) => row.target_group === group).length]))
  },
  marker_prevalence: markerPrevalence,
  header_prevalence: headerPrevalence,
  ai_only_external_host_candidates: groupExclusiveExternalHosts,
  results
};
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(research, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), summary: research.summary, marker_prevalence: markerPrevalence, header_prevalence: headerPrevalence, top_ai_only_external_hosts: groupExclusiveExternalHosts.slice(0, 20) }, null, 2)}\n`);
