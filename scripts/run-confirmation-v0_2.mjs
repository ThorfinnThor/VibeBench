import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { analyzeHtml } from "../lib/analyze-html.mjs";
import { buildPortableFeatureMap, scoreCandidate } from "../lib/development-v0_2-candidate.mjs";
import { extractSameOriginAssets } from "../lib/extract-assets.mjs";
import { collectPortablePageMetrics } from "../lib/portable-page-metrics.mjs";

const queuePath = path.resolve("outputs/confirmation_v0_2/vibebench_confirmation_holdout_100_v0_2.scan-queue.json");
const modelPath = path.resolve("outputs/development_v0_2/vibebench_development_v0_2_candidate_model.json");
const freezePath = path.resolve("outputs/confirmation_v0_2/vibebench_confirmation_holdout_100_v0_2.freeze.json");
const outputDir = path.resolve("outputs/confirmation_v0_2/blind_run_v0_2");
const checkpointPath = path.join(outputDir, "checkpoint.json");
const rawPath = path.join(outputDir, "vibebench_confirmation_raw_results_v0_2.json");
const maxHtmlBytes = 1_500_000;
const maxAssetBytes = 300_000;
const concurrency = 4;
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

async function verifyFreeze(frozen) {
  if (frozen.status !== "FROZEN_UNOPENED") throw new Error("Confirmation holdout is not frozen and unopened.");
  for (const [file, metadata] of Object.entries(frozen.files)) {
    const text = await readFile(path.resolve(file), "utf8");
    if (sha256(text) !== metadata.sha256) throw new Error(`Frozen file drift: ${file}`);
  }
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
    if (value.byteLength > remaining) { await reader.cancel(); break; }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

async function fetchMain(initialUrl) {
  let current = new URL(initialUrl);
  for (let redirect = 0; redirect <= 5; redirect += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
      headers: { "user-agent": "VibeBench/0.2-confirmation", accept: "text/html,application/xhtml+xml" }
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`Redirect ${response.status} without location.`);
      current = new URL(location, current);
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (!/html|xhtml/i.test(contentType)) throw new Error(`Unsupported content type: ${contentType}`);
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
      signal: AbortSignal.timeout(10_000),
      headers: { "user-agent": "VibeBench/0.2-confirmation", accept: "text/css,application/javascript,text/javascript,text/plain" }
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

async function scan(row, model, attempt) {
  const started = Date.now();
  try {
    const { response, html, resolvedUrl } = await fetchMain(row.target_url);
    const resolved = new URL(resolvedUrl);
    const assets = extractSameOriginAssets({ html, baseUrl: resolvedUrl });
    const settled = await Promise.allSettled(assets.map(async (asset) => ({ ...asset, text: await fetchAsset(asset.url, resolved.origin) })));
    const fetchedAssets = settled.filter((result) => result.status === "fulfilled").map((result) => result.value);
    const assetText = fetchedAssets.map((asset) => asset.text).join("\n");
    const headers = Object.fromEntries(response.headers.entries());
    const analysis = analyzeHtml({ html, url: resolvedUrl, headers, assetText });
    const pageMetrics = collectPortablePageMetrics({ html, assets, fetchedAssets });
    const features = buildPortableFeatureMap({ stackSignals: analysis.stackSignals, pageMetrics });
    const probability = scoreCandidate(model, features);
    return {
      sample_id: row.sample_id,
      requested_url: row.target_url,
      resolved_url: resolvedUrl,
      ok: true,
      attempt,
      duration_ms: Date.now() - started,
      stack_signals: analysis.stackSignals,
      page_metrics: pageMetrics,
      features,
      probability,
      predicted_positive: probability >= model.training.threshold,
      asset_scan: { requested: assets.length, fetched: fetchedAssets.length, errors: settled.length - fetchedAssets.length }
    };
  } catch (error) {
    return { sample_id: row.sample_id, requested_url: row.target_url, ok: false, attempt, duration_ms: Date.now() - started, error: error instanceof Error ? error.message : String(error) };
  }
}

await mkdir(outputDir, { recursive: true });
try { await readFile(rawPath, "utf8"); throw new Error("Final raw results already exist; confirmation scan cannot run twice."); } catch (error) { if (error.code !== "ENOENT") throw error; }
const [queueText, modelText, freezeText] = await Promise.all([queuePath, modelPath, freezePath].map((file) => readFile(file, "utf8")));
const queue = JSON.parse(queueText);
const model = JSON.parse(modelText);
const frozen = JSON.parse(freezeText);
await verifyFreeze(frozen);
if (queue.rows?.length !== 100 || model.status !== "FROZEN_CANDIDATE_NOT_FOR_PRODUCTION") throw new Error("Invalid queue or candidate model.");
const queueHash = sha256(queueText);
let checkpoint = { schema_version: "v0.2-confirmation-checkpoint", queue_sha256: queueHash, started_at: new Date().toISOString(), results: {} };
try {
  const existing = JSON.parse(await readFile(checkpointPath, "utf8"));
  if (existing.queue_sha256 !== queueHash) throw new Error("Checkpoint belongs to a different queue.");
  checkpoint = existing;
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const pending = queue.rows.filter((row) => !checkpoint.results[row.sample_id]?.ok);
let cursor = 0;
async function worker() {
  while (cursor < pending.length) {
    const index = cursor++;
    const row = pending[index];
    let result = await scan(row, model, 1);
    if (!result.ok) result = await scan(row, model, 2);
    checkpoint.results[row.sample_id] = result;
    await writeFile(checkpointPath, `${JSON.stringify(checkpoint, null, 2)}\n`, "utf8");
    process.stdout.write(`${Object.keys(checkpoint.results).length}/100 ${row.sample_id} ${result.ok ? result.probability.toFixed(4) : "ERROR"}\n`);
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));
const results = queue.rows.map((row) => checkpoint.results[row.sample_id]);
if (results.some((row) => !row)) throw new Error("Incomplete checkpoint after scan.");
const raw = {
  schema_version: "v0.2-confirmation-raw-results",
  completed_at: new Date().toISOString(),
  labels_used_by_runner: false,
  queue_sha256: queueHash,
  model_sha256: sha256(modelText),
  total: results.length,
  successful: results.filter((row) => row.ok).length,
  technical_errors: results.filter((row) => !row.ok).length,
  results
};
await writeFile(rawPath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), rawPath), total: raw.total, successful: raw.successful, technical_errors: raw.technical_errors }, null, 2)}\n`);
