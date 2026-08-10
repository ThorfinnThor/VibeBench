import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { scanDevelopmentPage } from "../lib/development-v0_3-page-scan.mjs";

const manifestPath = path.resolve("outputs/development_v0_3/vibebench_development_extension_60_v0_3.json");
const outputPath = path.resolve("outputs/development_v0_3/vibebench_development_v0_3_artifact_research.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
if (manifest.status !== "DEVELOPMENT_ONLY_READY" || manifest.samples?.length !== 60 || manifest.failed_confirmation_used_for_training !== false) {
  throw new Error("v0.3 artifact research requires the leakage-safe 60-row Development extension.");
}

const results = new Array(manifest.samples.length);
let cursor = 0;
async function worker() {
  while (cursor < manifest.samples.length) {
    const index = cursor++;
    let result = await scanDevelopmentPage(manifest.samples[index]);
    if (!result.ok) result = await scanDevelopmentPage(manifest.samples[index]);
    results[index] = result;
    process.stdout.write(`${index + 1}/60 ${result.sample_id} ${result.ok ? "OK" : "ERROR"}\n`);
  }
}
await Promise.all(Array.from({ length: 4 }, worker));

const research = {
  schema_version: "v0.3-development-artifact-research",
  generated_at: new Date().toISOString(),
  purpose: "Development-only feature research on preselected rows; not an independent evaluation result.",
  failed_confirmation_used_for_training: false,
  failed_confirmation_used_for_error_analysis: false,
  summary: {
    total: results.length,
    successful: results.filter((row) => row.ok).length,
    errors: results.filter((row) => !row.ok).length,
    groups: Object.fromEntries([...new Set(results.map((row) => row.target_group))].map((group) => [group, results.filter((row) => row.target_group === group && row.ok).length]))
  },
  results
};
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(research, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), summary: research.summary }, null, 2)}\n`);
if (research.summary.errors) process.exitCode = 1;
