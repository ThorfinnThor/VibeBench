import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(repoRoot, "outputs/holdout_v0_1/vibebench_blind_holdout_100_v0_1.csv");
const validatorPath = path.join(repoRoot, "scripts/validate-holdout.mjs");

function runValidator(args) {
  return spawnSync(process.execPath, [validatorPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function replaceCsvCell(line, columnIndex, value) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quoted && character === '"' && line[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell);
  cells[columnIndex] = value;
  return cells.map((entry) => `"${entry.replaceAll('"', '""')}"`).join(",");
}

test("completed 100-slot manifest is structurally valid", () => {
  const result = runValidator([manifestPath]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.rows, 100);
  assert.equal(summary.ai, 50);
  assert.equal(summary.human, 50);
  assert.equal(summary.ready, 100);
  assert.deepEqual(summary.errors, []);
});

test("freeze succeeds only for the complete manifest and writes an auditable lock", async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "vibebench-holdout-test-"));
  const temporaryManifest = path.join(temporaryDirectory, "holdout.csv");
  await writeFile(temporaryManifest, await readFile(manifestPath, "utf8"), "utf8");

  const result = runValidator([temporaryManifest, "--freeze", "--scanner-commit", "a".repeat(40)]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const lock = JSON.parse(await readFile(`${temporaryManifest}.freeze.json`, "utf8"));
  assert.equal(lock.sampleCount, 100);
  assert.equal(lock.scannerCommit, "a".repeat(40));
  assert.match(lock.manifestSha256, /^[0-9a-f]{64}$/);
});

test("freeze is blocked when one of the 100 rows is no longer ready", async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "vibebench-holdout-test-"));
  const temporaryManifest = path.join(temporaryDirectory, "holdout.csv");
  const lines = (await readFile(manifestPath, "utf8")).trimEnd().split("\n");
  lines[1] = replaceCsvCell(lines[1], 12, "FAILED");
  lines[1] = replaceCsvCell(lines[1], 19, "PENDING");
  await writeFile(temporaryManifest, `${lines.join("\n")}\n`, "utf8");

  const result = runValidator([temporaryManifest, "--freeze", "--scanner-commit", "a".repeat(40)]);
  assert.equal(result.status, 1);
  const summary = JSON.parse(result.stdout);
  assert.ok(summary.errors.includes("Freeze requires 100 ready rows, found 99"));
});

test("development overlap catches apex and www variants", async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "vibebench-holdout-test-"));
  const temporaryManifest = path.join(temporaryDirectory, "holdout.csv");
  const lines = (await readFile(manifestPath, "utf8")).trimEnd().split("\n");
  lines[1] = replaceCsvCell(lines[1], 5, "https://elora-health.com/");
  lines[1] = replaceCsvCell(lines[1], 6, "https://lovable.dev/blog/2025-01-30-from-idea-to-full-blown-product-in-a-month");
  await writeFile(temporaryManifest, `${lines.join("\n")}\n`, "utf8");

  const result = runValidator([temporaryManifest]);
  assert.equal(result.status, 1);
  const summary = JSON.parse(result.stdout);
  assert.ok(summary.errors.some((error) => error.includes("target_url overlaps the Development set")));
});

test("development overlap catches a different path on an existing host", async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "vibebench-holdout-test-"));
  const temporaryManifest = path.join(temporaryDirectory, "holdout.csv");
  const lines = (await readFile(manifestPath, "utf8")).trimEnd().split("\n");
  lines[1] = replaceCsvCell(lines[1], 5, "https://elora-health.com/private-preview");
  await writeFile(temporaryManifest, `${lines.join("\n")}\n`, "utf8");

  const result = runValidator([temporaryManifest]);
  assert.equal(result.status, 1);
  const summary = JSON.parse(result.stdout);
  assert.ok(summary.errors.some((error) => error.includes("target host overlaps the Development set")));
});

test("provenance must be hosted independently from the target", async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "vibebench-holdout-test-"));
  const temporaryManifest = path.join(temporaryDirectory, "holdout.csv");
  const lines = (await readFile(manifestPath, "utf8")).trimEnd().split("\n");
  lines[1] = replaceCsvCell(lines[1], 5, "https://audit-example.test/app");
  lines[1] = replaceCsvCell(lines[1], 6, "https://audit-example.test/evidence");
  await writeFile(temporaryManifest, `${lines.join("\n")}\n`, "utf8");

  const result = runValidator([temporaryManifest]);
  assert.equal(result.status, 1);
  const summary = JSON.parse(result.stdout);
  assert.ok(summary.errors.some((error) => error.includes("target_url and provenance_url must use different hosts")));
});

test("freeze_status cannot drift from the computed gate", async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "vibebench-holdout-test-"));
  const temporaryManifest = path.join(temporaryDirectory, "holdout.csv");
  const lines = (await readFile(manifestPath, "utf8")).trimEnd().split("\n");
  lines[1] = replaceCsvCell(lines[1], 19, "PENDING");
  await writeFile(temporaryManifest, `${lines.join("\n")}\n`, "utf8");

  const result = runValidator([temporaryManifest]);
  assert.equal(result.status, 1);
  const summary = JSON.parse(result.stdout);
  assert.ok(summary.errors.some((error) => error.includes("freeze_status must be READY")));
});
