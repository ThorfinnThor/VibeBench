import assert from "node:assert/strict";
import test from "node:test";
import { describeEvidenceCoverage } from "../lib/evidence-coverage.mjs";

test("describes broad evidence without turning coverage into score confidence", () => {
  const result = describeEvidenceCoverage({ assetCandidates: 4, fetchedAssets: 3, truncatedAssets: 0, manifestLinked: true, manifestFetched: true });
  assert.equal(result.level, "broad");
  assert.equal(result.affectsScore, false);
  assert.deepEqual(result.scope, { html: "fetched", assetsDiscovered: 4, assetsSelected: 4, assetCandidates: 4, assetsFetched: 3, assetErrors: 1, truncatedAssets: 0, manifestLinked: true, manifestFetched: true });
});

test("discloses when the bounded scanner selected only part of the discovered assets", () => {
  const result = describeEvidenceCoverage({ assetCandidates: 6, discoveredAssets: 20, fetchedAssets: 6 });
  assert.equal(result.level, "broad");
  assert.equal(result.scope.assetsDiscovered, 20);
  assert.equal(result.scope.assetsSelected, 6);
  assert.match(result.summary, /6 von 6 ausgewählten.*20 passende Assets/);
});

test("marks severely incomplete or truncated asset inspection as limited", () => {
  assert.equal(describeEvidenceCoverage({ assetCandidates: 4, fetchedAssets: 1 }).level, "limited");
  assert.equal(describeEvidenceCoverage({ assetCandidates: 2, fetchedAssets: 2, truncatedAssets: 1 }).level, "limited");
});

test("keeps HTML-only and single-asset scans at standard scope", () => {
  assert.equal(describeEvidenceCoverage({ assetCandidates: 0, fetchedAssets: 0 }).level, "standard");
  assert.equal(describeEvidenceCoverage({ assetCandidates: 1, fetchedAssets: 1 }).level, "standard");
});
