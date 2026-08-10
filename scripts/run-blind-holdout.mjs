import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const outputDir = path.resolve("outputs/holdout_v0_1/blind_run_v0_1_2026-08-10");
const manifestPath = path.resolve("outputs/holdout_v0_1/vibebench_blind_holdout_100_v0_1.csv");
const lockPath = path.resolve("outputs/holdout_v0_1/vibebench_blind_holdout_100_v0_1.csv.freeze.json");
const protocolPath = path.resolve("outputs/holdout_v0_1/VIBEBENCH_BLIND_RUN_PROTOCOL_V0_1.md");
const checkpointPath = path.join(outputDir, "blind-run-checkpoint.json");
const finalJsonPath = path.join(outputDir, "vibebench_blind_holdout_raw_results_v0_1.json");
const finalCsvPath = path.join(outputDir, "vibebench_blind_holdout_raw_results_v0_1.csv");
const endpoint = process.env.VIBEBENCH_API_URL || "https://vibe-bench-cyan.vercel.app/api/scan";
const requestTimeoutMs = 30_000;
const requestSpacingMs = 300;
const retryMinimumAgeMs = 10_000;
const validVerdicts = new Set(["direct", "indicative", "indeterminate"]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  const [headers, ...records] = rows;
  return records.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function csvCell(value) {
  const text = Array.isArray(value) ? value.join(" || ") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function finalAttempt(result) {
  return result.attempts[result.attempts.length - 1];
}

async function persist(state) {
  state.updatedAt = new Date().toISOString();
  await writeFile(checkpointPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function scanAttempt(sample, attemptNumber) {
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();
  let responseStatus = null;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: sample.target_url }),
      signal: AbortSignal.timeout(requestTimeoutMs)
    });
    responseStatus = response.status;
    const bodyText = await response.text();
    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      throw new Error(`Endpoint returned non-JSON content (HTTP ${response.status}).`);
    }
    const verdict = payload?.verdict?.level || null;
    const apiOk = response.ok && payload?.ok === true && validVerdicts.has(verdict);
    const error = apiOk
      ? null
      : payload?.error || (!response.ok ? `Endpoint returned HTTP ${response.status}.` : `Missing or unknown verdict: ${verdict || "none"}.`);
    return {
      attemptNumber,
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedMs,
      responseStatus,
      apiOk,
      error,
      payload
    };
  } catch (error) {
    return {
      attemptNumber,
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedMs,
      responseStatus,
      apiOk: false,
      error: error instanceof Error ? error.message : String(error),
      payload: null
    };
  }
}

function flattenResult(result) {
  const attempt = finalAttempt(result);
  const payload = attempt.payload || {};
  return {
    sample_id: result.sample.sample_id,
    label: result.sample.label,
    target_group: result.sample.target_group,
    builder: result.sample.builder,
    website_type: result.sample.website_type,
    target_url: result.sample.target_url,
    provenance_type: result.sample.provenance_type,
    technical_success: attempt.apiOk,
    attempts: result.attempts.length,
    final_response_status: attempt.responseStatus,
    total_duration_ms: result.attempts.reduce((total, item) => total + item.durationMs, 0),
    requested_url: payload.requestedUrl || "",
    resolved_url: payload.resolvedUrl || "",
    target_http_status: payload.httpStatus || "",
    analyzed_at: payload.analyzedAt || "",
    verdict: attempt.apiOk ? payload.verdict.level : "error",
    verdict_title: payload.verdict?.title || "",
    direct_evidence: (payload.directEvidence || []).map((item) => item.label || item),
    context_evidence: (payload.contextEvidence || []).map((item) => item.label || item),
    header_evidence: (payload.headerEvidence || []).map((item) => item.label || item),
    manifest_evidence: (payload.manifestEvidence || []).map((item) => item.label || item),
    stack_signals: payload.stackSignals || [],
    structural_hints: payload.structuralHints || [],
    page_metrics_json: JSON.stringify(payload.metrics || {}),
    asset_scan_json: JSON.stringify(payload.assetScan || {}),
    manifest_scan_json: JSON.stringify(payload.manifestScan || {}),
    error: attempt.error || "",
    first_attempt_started_at: result.attempts[0].startedAt,
    final_attempt_finished_at: attempt.finishedAt
  };
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const [manifestText, lockText, protocolText] = await Promise.all([
    readFile(manifestPath, "utf8"),
    readFile(lockPath, "utf8"),
    readFile(protocolPath, "utf8")
  ]);
  const lock = JSON.parse(lockText);
  const samples = parseCsv(manifestText);
  const manifestSha256 = sha256(manifestText);
  if (manifestSha256 !== lock.manifestSha256) throw new Error("Frozen manifest hash mismatch; refusing to scan.");
  if (samples.length !== 100) throw new Error(`Expected 100 samples, found ${samples.length}; refusing to scan.`);
  const aiCount = samples.filter((row) => row.label === "AI").length;
  const humanCount = samples.filter((row) => row.label === "HUMAN").length;
  if (aiCount !== 50 || humanCount !== 50) throw new Error(`Expected 50 AI and 50 HUMAN rows, found ${aiCount}/${humanCount}.`);
  const scannerDiff = git("diff", "--name-only", lock.scannerCommit, "--", "app", "lib");
  if (scannerDiff) throw new Error(`Scanner source differs from frozen commit:\n${scannerDiff}`);
  try {
    await readFile(finalJsonPath, "utf8");
    throw new Error(`Final raw results already exist at ${finalJsonPath}; refusing a second run.`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  let state;
  try {
    state = JSON.parse(await readFile(checkpointPath, "utf8"));
    if (state.manifestSha256 !== manifestSha256 || state.endpoint !== endpoint) {
      throw new Error("Checkpoint does not match the frozen manifest and endpoint.");
    }
    process.stdout.write(`Resuming checkpoint with ${state.results.length} captured samples.\n`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    state = {
      schemaVersion: "v0.1",
      runId: "blind_run_v0_1_2026-08-10",
      status: "running",
      startedAt: new Date().toISOString(),
      updatedAt: null,
      completedAt: null,
      endpoint,
      manifest: path.relative(root, manifestPath),
      manifestSha256,
      freezeLock: path.relative(root, lockPath),
      freezeLockSha256: sha256(lockText),
      protocol: path.relative(root, protocolPath),
      protocolSha256: sha256(protocolText),
      scannerCommit: lock.scannerCommit,
      runnerCommit: git("rev-parse", "HEAD"),
      requestTimeoutMs,
      requestSpacingMs,
      retryMinimumAgeMs,
      maxAttempts: 2,
      runtime: { node: process.version, platform: process.platform, arch: process.arch },
      results: []
    };
    await persist(state);
  }

  for (const [index, sample] of samples.entries()) {
    if (state.results.some((result) => result.sample.sample_id === sample.sample_id)) continue;
    process.stdout.write(`[initial ${index + 1}/100] ${sample.sample_id} ${sample.target_url}\n`);
    const attempt = await scanAttempt(sample, 1);
    state.results.push({ sample, attempts: [attempt] });
    await persist(state);
    if (index < samples.length - 1) await wait(requestSpacingMs);
  }

  const failures = state.results.filter((result) => !finalAttempt(result).apiOk && result.attempts.length === 1);
  for (const [index, result] of failures.entries()) {
    const failedAt = Date.parse(finalAttempt(result).finishedAt);
    const remainingWait = Math.max(0, retryMinimumAgeMs - (Date.now() - failedAt));
    if (remainingWait) await wait(remainingWait);
    process.stdout.write(`[retry ${index + 1}/${failures.length}] ${result.sample.sample_id} ${result.sample.target_url}\n`);
    result.attempts.push(await scanAttempt(result.sample, 2));
    await persist(state);
    if (index < failures.length - 1) await wait(requestSpacingMs);
  }

  if (state.results.length !== samples.length) throw new Error(`Incomplete run: ${state.results.length}/${samples.length} samples.`);
  const invalid = state.results.filter((result) => !finalAttempt(result).apiOk && result.attempts.length !== 2);
  if (invalid.length) throw new Error(`Retry policy incomplete for ${invalid.length} technical failures.`);

  state.status = "completed";
  state.completedAt = new Date().toISOString();
  await persist(state);
  const flattened = state.results.map(flattenResult);
  const columns = Object.keys(flattened[0]);
  const csv = [columns.map(csvCell).join(","), ...flattened.map((row) => columns.map((column) => csvCell(row[column])).join(","))].join("\n");
  const final = {
    ...state,
    summary: {
      total: flattened.length,
      technicalSuccess: flattened.filter((row) => row.technical_success).length,
      technicalErrors: flattened.filter((row) => !row.technical_success).length,
      retries: flattened.filter((row) => row.attempts === 2).length
    },
    flattenedResults: flattened
  };
  await writeFile(finalJsonPath, `${JSON.stringify(final, null, 2)}\n`, "utf8");
  await writeFile(finalCsvPath, `${csv}\n`, "utf8");
  process.stdout.write(`Completed ${final.summary.technicalSuccess}/100 technical scans; ${final.summary.technicalErrors} final errors; ${final.summary.retries} retries.\n`);
  process.stdout.write(`Wrote ${path.relative(root, finalJsonPath)}\nWrote ${path.relative(root, finalCsvPath)}\n`);
}

await main();
