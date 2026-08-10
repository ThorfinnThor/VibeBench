import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
const root = new URL("../", import.meta.url);
test("independent v0.4 confirmation passes 80/80 and is immutable", async () => { const lock = JSON.parse(await readFile(new URL("outputs/confirmation_v0_4/blind_run_v0_4/vibebench_confirmation_result_files_v0_4.json", root), "utf8")); assert.equal(lock.status, "PASSED_LOCKED"); assert.equal(lock.independent_confirmation, true); assert.equal(lock.gate.passed, true); assert.ok(lock.primary.precision >= 0.8); assert.ok(lock.primary.recall >= 0.8); assert.deepEqual(lock.confusion, { tp: 42, fp: 9, tn: 41, fn: 7 }); assert.equal(lock.technical.successful, 99); for (const artifact of lock.artifacts) { const bytes = await readFile(new URL(artifact.path, root)); assert.equal(bytes.byteLength, artifact.bytes, artifact.path); assert.equal(createHash("sha256").update(bytes).digest("hex"), artifact.sha256, artifact.path); } });
