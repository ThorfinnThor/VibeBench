#!/usr/bin/env bash
set -euo pipefail

PYTHON_BIN="${PYTHON_BIN:-python3}"
VIBEBENCH_URL_WORKERS="${VIBEBENCH_URL_WORKERS:-3}"
mkdir -p outputs

"$PYTHON_BIN" vibebench_forensics_extractor_v0_9.py \
  --input-csv vibebench_url_scan_queue_63_v0_9.csv \
  --output-csv outputs/vibebench_live_features_v0_9.csv \
  --carry sample_id,cohort,label_target,binary_label,tool_or_builder,evidence_level,deployment_check_status,training_gate \
  --timeout 8 \
  --workers "$VIBEBENCH_URL_WORKERS" \
  --resume

# Safe default: static_auto only. Other strategies execute third-party build/runtime
# code and must be handled by a dedicated isolated container workflow.
"$PYTHON_BIN" vibebench_snapshot_builder.py \
  --manifest vibebench_historical_snapshot_manifest_v0_8.csv \
  --output-dir vibebench_historical_snapshots \
  --extractor vibebench_forensics_extractor_v0_9.py \
  --strategy static_auto \
  --resume \
  --min-success 30

"$PYTHON_BIN" vibebench_merge_url_features.py \
  --live-features outputs/vibebench_live_features_v0_9.csv \
  --snapshot-root vibebench_historical_snapshots \
  --manifest vibebench_historical_snapshot_manifest_v0_8.csv \
  --output-csv outputs/vibebench_url_training_features_v0_9.csv

"$PYTHON_BIN" vibebench_train_baseline.py \
  outputs/vibebench_url_training_features_v0_9.csv \
  --output-json outputs/vibebench_url_baseline_metrics_v0_9.json

"$PYTHON_BIN" vibebench_evaluate_url_models_v0_9.py \
  outputs/vibebench_url_training_features_v0_9.csv \
  --output-json outputs/vibebench_url_model_diagnostics_v0_9.json \
  --repeats 50

"$PYTHON_BIN" vibebench_evaluate_url_models_v0_9.py \
  outputs/vibebench_live_features_v0_9.csv \
  --output-json outputs/vibebench_live_only_model_diagnostics_v0_9.json \
  --repeats 50
