import assert from "node:assert/strict";
import test from "node:test";
import { describeEvidenceCoverage } from "../lib/evidence-coverage.mjs";

test("describes broad evidence without turning coverage into score confidence", () => {
  const result = describeEvidenceCoverage({ assetCandidates: 4, fetchedAssets: 3, truncatedAssets: 0, manifestLinked: true, manifestFetched: true });
  assert.equal(result.level, "broad");
  assert.equal(result.affectsScore, false);
  assert.deepEqual(result.scope, { html: "fetched", assetCandidates: 4, assetsFetched: 3, assetErrors: 1, truncatedAssets: 0, manifestLinked: true, manifestFetched: true });
});

test("marks severely incomplete or truncated asset inspection as limited", () => {
  assert.equal(describeEvidenceCoverage({ assetCandidates: 4, fetchedAssets: 1 }).level, "limited");
  assert.equal(describeEvidenceCoverage({ assetCandidates: 2, fetchedAssets: 2, truncatedAssets: 1 }).level, "limited");
});

test("keeps HTML-only and single-asset scans at standard scope", () => {
  assert.equal(describeEvidenceCoverage({ assetCandidates: 0, fetchedAssets: 0 }).level, "standard");
  assert.equal(describeEvidenceCoverage({ assetCandidates: 1, fetchedAssets: 1 }).level, "standard");
});
