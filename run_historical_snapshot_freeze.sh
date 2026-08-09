#!/usr/bin/env bash
set -euo pipefail

PYTHON_BIN="${PYTHON_BIN:-python3}"

# Safe default: only copy already-static repositories. Strategies that run Node,
# Ruby/Jekyll, Hugo, Hexo, or PHP belong in an isolated container without secrets.
"$PYTHON_BIN" vibebench_snapshot_builder.py \
  --manifest vibebench_historical_snapshot_manifest_v0_8.csv \
  --output-dir vibebench_historical_snapshots \
  --extractor vibebench_forensics_extractor_v0_9.py \
  --strategy static_auto \
  --resume \
  --min-success 30

echo
echo "Frozen snapshots: vibebench_historical_snapshots/snapshots/"
echo "Commit/hash locks: vibebench_historical_snapshots/locks/"
echo "Run summary: vibebench_historical_snapshots/run_summary.json"
