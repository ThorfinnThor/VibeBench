import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { scanDevelopmentPage } from "../lib/development-v0_3-page-scan.mjs";

const manifestPath = path.resolve("outputs/development_v0_5/vibebench_development_extension_120_v0_5.json");
const outputPath = path.resolve("outputs/development_v0_5/vibebench_development_v0_5_artifacts.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
if (manifest.samples?.length !== 120 || manifest.failed_confirmation_used_for_training !== false) throw new Error("Invalid v0.5 Development extension.");
const results = new Array(manifest.samples.length);
let cursor = 0;
let completed = 0;
async function worker() {
  while (cursor < manifest.samples.length) {
    const index = cursor++;
    let result = await scanDevelopmentPage(manifest.samples[index]);
    if (!result.ok) result = await scanDevelopmentPage(manifest.samples[index]);
    results[index] = result;
    completed += 1;
    process.stdout.write(`${completed}/120 ${result.sample_id} ${result.ok ? "OK" : "ERROR"}\n`);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
const output = {
  schema_version: "v0.5-development-artifacts",
  generated_at: new Date().toISOString(),
  failed_confirmation_used: false,
  summary: { total: 120, successful: results.filter((row) => row.ok).length, errors: results.filter((row) => !row.ok).length },
  results
};
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), summary: output.summary }, null, 2)}\n`);
if (output.summary.errors) process.exitCode = 1;
