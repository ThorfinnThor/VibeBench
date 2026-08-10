import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { scanDevelopmentPage } from "../lib/development-v0_3-page-scan.mjs";

const manifestPath = path.resolve("outputs/development_v0_2/vibebench_development_extension_40_v0_2.json");
const outputPath = path.resolve("outputs/development_v0_3/vibebench_development_v0_2_base_rescan_for_v0_3.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
if (manifest.samples?.length !== 40) throw new Error("Expected the 40-row leakage-safe v0.2 Development base.");
const results = new Array(40);
let cursor = 0;
async function worker() {
  while (cursor < manifest.samples.length) {
    const index = cursor++;
    let result = await scanDevelopmentPage(manifest.samples[index]);
    if (!result.ok) result = await scanDevelopmentPage(manifest.samples[index]);
    results[index] = result;
    process.stdout.write(`${index + 1}/40 ${result.sample_id} ${result.ok ? "OK" : "ERROR"}\n`);
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
const output = {
  schema_version: "v0.3-development-base-rescan",
  generated_at: new Date().toISOString(),
  purpose: "Development-only consistent feature extraction; no holdout rows included.",
  failed_confirmation_used: false,
  summary: { total: 40, successful: results.filter((row) => row.ok).length, errors: results.filter((row) => !row.ok).length },
  results
};
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), summary: output.summary }, null, 2)}\n`);
if (output.summary.errors) process.exitCode = 1;
