import assert from "node:assert/strict";
import test from "node:test";
import {
  clearLocalScanHost,
  compareLocalScans,
  parseLocalScanHistory,
  previousLocalScan,
  recordLocalScan,
  toLocalScanSnapshot
} from "../lib/local-scan-history.mjs";

function result({ id, analyzedAt, footprint, security, issues = 0, host = "example.com", breadth = "standard" }) {
  return {
    ok: true,
    requestId: id,
    resolvedUrl: `https://${host}/page`,
    analyzedAt,
    vibeScore: { score: footprint },
    security: { score: security },
    evidenceCoverage: { level: breadth },
    categoryOverview: [
      { id: "security", issueCount: issues }, { id: "design", issueCount: 0 }, { id: "engineering", issueCount: 0 }, { id: "accessibility", issueCount: 0 }, { id: "content", issueCount: 0 }
    ]
  };
}

test("local scan history stores only minimized public summary data", () => {
  const snapshot = toLocalScanSnapshot(result({ id: "scan-1", analyzedAt: "2026-08-19T10:00:00.000Z", footprint: 61, security: 72, issues: 2 }));
  assert.deepEqual(Object.keys(snapshot).sort(), ["analyzedAt", "categories", "evidenceBreadth", "footprint", "host", "id", "security"]);
  assert.equal(JSON.stringify(snapshot).includes("recommendation"), false);
  assert.equal(JSON.stringify(snapshot).includes("evidence"), true);
});

test("history keeps at most three scans per host and finds the previous scan", () => {
  let history = [];
  for (let index = 1; index <= 4; index += 1) {
    history = recordLocalScan(history, toLocalScanSnapshot(result({ id: `scan-${index}`, analyzedAt: `2026-08-19T1${index}:00:00.000Z`, footprint: 40 + index, security: 70 + index })));
  }
  assert.deepEqual(history.map((entry) => entry.id), ["scan-4", "scan-3", "scan-2"]);
  assert.equal(previousLocalScan(history, history[0]).id, "scan-3");
});

test("comparison is descriptive and preserves evidence-breadth context", () => {
  const previous = toLocalScanSnapshot(result({ id: "old", analyzedAt: "2026-08-19T10:00:00.000Z", footprint: 55, security: 60, issues: 4 }));
  const current = toLocalScanSnapshot(result({ id: "new", analyzedAt: "2026-08-19T11:00:00.000Z", footprint: 49, security: 75, issues: 2, breadth: "broad" }));
  assert.deepEqual(compareLocalScans(current, previous), { footprintChange: -6, securityChange: 15, observedIssueChange: -2, previousAnalyzedAt: previous.analyzedAt, sameEvidenceBreadth: false });
});

test("history parsing fails closed and clearing is host scoped", () => {
  assert.deepEqual(parseLocalScanHistory("not json"), []);
  const first = toLocalScanSnapshot(result({ id: "one", analyzedAt: "2026-08-19T10:00:00.000Z", footprint: 55, security: 60 }));
  const second = toLocalScanSnapshot(result({ id: "two", analyzedAt: "2026-08-19T11:00:00.000Z", footprint: 50, security: 70, host: "other.example" }));
  const history = parseLocalScanHistory(JSON.stringify([first, second]));
  assert.deepEqual(clearLocalScanHost(history, "example.com").map((entry) => entry.id), ["two"]);
});
