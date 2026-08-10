import { writeFile } from "node:fs/promises";
import path from "node:path";
import { holdoutSamples } from "../data/holdout-samples-v0_1.mjs";

const outputArgument = process.argv.indexOf("--output");
const outputPath = path.resolve(outputArgument >= 0 && process.argv[outputArgument + 1]
  ? process.argv[outputArgument + 1]
  : "outputs/holdout_v0_1/vibebench_holdout_reachability_audit_2026-08-10.json");
const timeoutMs = 15_000;
const groupCounts = new Map();
function sampleIdFor(sample) {
  const index = (groupCounts.get(sample.group) || 0) + 1;
  groupCounts.set(sample.group, index);
  const label = sample.group.startsWith("AI_") ? "AI" : "HUM";
  const groupName = sample.group.replace(/^AI_|^HUMAN_/, "").replaceAll("_", "-");
  return `HO-${label}-${groupName}-${String(index).padStart(2, "0")}`;
}
const work = holdoutSamples.flatMap((sample) => [
  { sample, sampleId: sampleIdFor(sample) }
]).flatMap(({ sample, sampleId }) => [
  { sampleId, group: sample.group, kind: "target", url: sample.target_url },
  { sampleId, group: sample.group, kind: "provenance", url: sample.provenance_url }
]);
const results = [];
let cursor = 0;

async function verify() {
  while (cursor < work.length) {
    const item = work[cursor++];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(item.url, {
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "Mozilla/5.0 VibeBenchHoldoutAudit/0.1" }
      });
      results.push({ ...item, ok: response.ok, status: response.status, finalUrl: response.url });
    } catch (error) {
      results.push({ ...item, ok: false, status: 0, error: `${error.name}: ${error.message}` });
    } finally {
      clearTimeout(timer);
    }
  }
}

await Promise.all(Array.from({ length: 12 }, verify));
results.sort((left, right) => left.group.localeCompare(right.group)
  || left.sampleId.localeCompare(right.sampleId) || left.kind.localeCompare(right.kind));
const failures = results.filter((result) => !result.ok);
const report = {
  schemaVersion: "v0.1",
  checkedAt: new Date().toISOString(),
  method: "Independent HTTPS retrieval only; the VibeBench scanner was not invoked.",
  timeoutMs,
  samples: holdoutSamples.length,
  requests: results.length,
  successfulRequests: results.length - failures.length,
  targetSuccesses: results.filter((result) => result.kind === "target" && result.ok).length,
  provenanceSuccesses: results.filter((result) => result.kind === "provenance" && result.ok).length,
  failures: failures.length,
  results
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ outputPath, samples: report.samples, requests: report.requests, successfulRequests: report.successfulRequests, failures: report.failures }, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
