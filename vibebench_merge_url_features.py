#!/usr/bin/env python3
"""Merge live URL features with frozen historical snapshot scan JSON files."""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


def read_csv(path):
    with open(path, encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--live-features", required=True)
    parser.add_argument(
        "--snapshot-root",
        required=True,
        action="append",
        help="snapshot directory; repeat for static and per-sample isolated roots",
    )
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--output-csv", required=True)
    args = parser.parse_args()

    live = read_csv(args.live_features)
    manifest = {row["sample_id"]: row for row in read_csv(args.manifest)}
    roots = [Path(value) for value in args.snapshot_root]
    historical = []

    for sample_id in manifest:
        candidates = []
        for root in roots:
            candidates.append((
                root / "locks" / f"{sample_id}.json",
                root / "snapshots" / sample_id / "vibebench_scan.json",
            ))
            candidates.append((
                root / sample_id / "locks" / f"{sample_id}.json",
                root / sample_id / "snapshots" / sample_id / "vibebench_scan.json",
            ))
        available = [(lock, scan) for lock, scan in candidates if lock.exists() and scan.exists()]
        if not available:
            continue
        if len(available) > 1:
            raise RuntimeError(f"Multiple snapshot sources found for {sample_id}; deduplicate roots first")
        lock_path, scan_path = available[0]
        lock = json.loads(lock_path.read_text(encoding="utf-8"))
        features = json.loads(scan_path.read_text(encoding="utf-8"))
        if not features.get("scan_ok"):
            continue
        row = {
            "src_sample_id": sample_id,
            "src_cohort": "HUMAN_HISTORICAL",
            "src_label_target": "HUMAN_CONTROL",
            "src_tool_or_builder": "",
            "src_evidence_level": "HUMAN_HIST_HEAD_PRE_AI_STRONG",
            "src_url_group": f"snapshot:{sample_id}",
            "src_binary_label": "HUMAN",
            "src_snapshot_commit_sha": lock.get("commit_sha", ""),
            "src_snapshot_commit_date": lock.get("commit_date", ""),
            "src_snapshot_sha256": lock.get("snapshot_sha256", ""),
            "src_feature_source": "frozen_historical_snapshot",
        }
        row.update(features)
        historical.append(row)

    for row in live:
        if "src_binary_label" not in row:
            label = (row.get("src_label_target") or "").upper()
            cohort = (row.get("src_cohort") or "").upper()
            row["src_binary_label"] = "HUMAN" if "HUMAN" in cohort or "HUMAN" in label else "AI"
        row.setdefault("src_feature_source", "live_url")
        row.setdefault("src_snapshot_commit_sha", "")
        row.setdefault("src_snapshot_commit_date", "")
        row.setdefault("src_snapshot_sha256", "")

    # A historical sample can also appear in the live queue. Never keep both
    # representations: their different group IDs would allow the same underlying
    # website to leak across train/test splits. Prefer the frozen, hashed snapshot.
    historical_ids = {row["src_sample_id"] for row in historical}
    duplicate_live_ids = sorted({
        row.get("src_sample_id", "") for row in live
        if row.get("src_sample_id", "") in historical_ids
    })
    deduplicated_live = [
        row for row in live if row.get("src_sample_id", "") not in historical_ids
    ]

    combined = deduplicated_live + historical
    keys = []
    seen = set()
    for row in combined:
        for key in row:
            if key not in seen:
                seen.add(key)
                keys.append(key)

    with open(args.output_csv, "w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=keys)
        writer.writeheader()
        writer.writerows(combined)

    print(
        f"live_input={len(live)} live_after_dedup={len(deduplicated_live)} "
        f"historical_snapshots={len(historical)} combined={len(combined)}"
    )
    if duplicate_live_ids:
        print("historical snapshots replaced duplicate live rows:", ", ".join(duplicate_live_ids))
    if historical:
        print("historical snapshot IDs:", ", ".join(row["src_sample_id"] for row in historical[:10]))


if __name__ == "__main__":
    main()
