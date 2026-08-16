import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { compareOptionBV5DevelopmentRuns } from "../lib/option-b-v5-development-repeat.mjs";

const argument = (name, fallback) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; };
const roots = [path.resolve(argument("--run-a", "development-artifacts-run-1")), path.resolve(argument("--run-b", "development-artifacts-run-2"))];
const outputPath = path.resolve(argument("--output", "outputs/development_v0_6_option_b_v5/option_b_v5_development_repeat_comparison_v1.json"));
const files = ["primary.capture.json", "primary.attempt-audit.json", "reserve.capture.json", "reserve.attempt-audit.json"];
const loaded = await Promise.all(roots.map(async (root) => {
  const inputs = await Promise.all(files.map(async (name) => {
    const file = path.join(root, name);
    const text = await readFile(file, "utf8");
    return { file, text, value: JSON.parse(text), sha256: createHash("sha256").update(text).digest("hex") };
  }));
  return {
    primaryCapture: inputs[0].value,
    primaryAudit: inputs[1].value,
    reserveCapture: inputs[2].value,
    reserveAudit: inputs[3].value,
    inputs
  };
}));
const compared = compareOptionBV5DevelopmentRuns(loaded[0], loaded[1]);
const output = {
  schema_version: "vibebench.option_b.v5_development_repeat_comparison.v1",
  generated_at: new Date().toISOString(),
  purpose: "Collector gate over two frozen Development runs; model performance is not compared or tuned here.",
  inputs: loaded.map((run, index) => ({ run: index + 1, files: Object.fromEntries(run.inputs.map(({ file, sha256, value }) => [path.basename(file), { sha256, schema_version: value.schema_version }])) })),
  ...compared,
  model_performance_inspected: false
};
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, { flag: "wx", mode: 0o600 });
process.stdout.write(`${JSON.stringify({ output: path.relative(process.cwd(), outputPath), status: output.status, gates: output.gates, runs: output.runs, aggregate_terminal_rates: output.aggregate_terminal_rates }, null, 2)}\n`);
if (output.status !== "MULTI_RUN_COLLECTOR_GATE_PASSED") process.exitCode = 1;
