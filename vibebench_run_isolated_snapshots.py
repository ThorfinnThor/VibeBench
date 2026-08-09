#!/usr/bin/env python3
"""Run historical build/runtime strategies in one hardened Docker container per sample."""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_STRATEGIES = (
    "node_auto",
    "static_or_node",
    "jekyll",
    "hugo",
    "hexo",
    "php_runtime",
)


def run(command, check=True):
    process = subprocess.run(command, text=True)
    if check and process.returncode != 0:
        raise RuntimeError(f"Command failed ({process.returncode}): {command}")
    return process


def read_manifest(path: Path):
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def selected_rows(rows, strategies, sample_ids):
    wanted_strategies = set(strategies)
    wanted_ids = set(sample_ids or [])
    selected = [row for row in rows if row.get("strategy") in wanted_strategies]
    if wanted_ids:
        selected = [row for row in selected if row.get("sample_id") in wanted_ids]
        missing = sorted(wanted_ids - {row.get("sample_id") for row in selected})
        if missing:
            raise RuntimeError("Unknown or strategy-excluded sample IDs: " + ", ".join(missing))
    return selected


def docker_available():
    return subprocess.run(
        ["docker", "info"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    ).returncode == 0


def docker_command(project_root: Path, manifest: Path, sample_output: Path, image: str, sample_id: str):
    uid = str(os.getuid()) if hasattr(os, "getuid") else "1000"
    gid = str(os.getgid()) if hasattr(os, "getgid") else "1000"
    return [
        "docker", "run", "--rm", "--init",
        "--read-only",
        "--tmpfs", "/tmp:rw,nosuid,nodev,size=2g",
        "--cpus", "2",
        "--memory", "4g",
        "--pids-limit", "512",
        "--ulimit", "nofile=1024:1024",
        "--cap-drop", "ALL",
        "--security-opt", "no-new-privileges",
        "--network", "bridge",
        "--user", f"{uid}:{gid}",
        "--mount", (
            f"type=bind,src={project_root / 'vibebench_snapshot_builder.py'},"
            "dst=/workspace/vibebench_snapshot_builder.py,readonly"
        ),
        "--mount", (
            f"type=bind,src={project_root / 'vibebench_forensics_extractor_v0_9.py'},"
            "dst=/workspace/vibebench_forensics_extractor_v0_9.py,readonly"
        ),
        "--mount", f"type=bind,src={manifest},dst=/workspace/manifest.csv,readonly",
        "--mount", f"type=bind,src={sample_output},dst=/output",
        "--workdir", "/workspace",
        image,
        "--manifest", "/workspace/manifest.csv",
        "--output-dir", "/output",
        "--summary-json", "/output/run_summary.json",
        "--extractor", "/workspace/vibebench_forensics_extractor_v0_9.py",
        "--sample-id", sample_id,
        "--resume",
        "--min-success", "1",
    ]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-root", default=".")
    parser.add_argument("--manifest", default="vibebench_historical_snapshot_manifest_v0_8.csv")
    parser.add_argument("--output-root", default="vibebench_historical_isolated_runs")
    parser.add_argument("--image", default="vibebench-historical-builder:0.9")
    parser.add_argument("--strategy", action="append", choices=DEFAULT_STRATEGIES)
    parser.add_argument("--sample-id", action="append")
    parser.add_argument("--list", action="store_true", help="list selected samples without Docker")
    parser.add_argument("--skip-image-build", action="store_true")
    args = parser.parse_args()

    project_root = Path(args.project_root).resolve()
    manifest_relative = Path(args.manifest)
    if manifest_relative.is_absolute() or ".." in manifest_relative.parts:
        raise SystemExit("--manifest must be a path inside --project-root")
    manifest_link = project_root / manifest_relative
    manifest = manifest_link.resolve()
    output_root = (project_root / args.output_root).resolve()
    if project_root == Path(project_root.anchor):
        raise SystemExit("Refusing to use a filesystem root as --project-root")
    try:
        output_root.relative_to(project_root)
    except ValueError:
        raise SystemExit("--output-root must resolve inside --project-root")
    if output_root == project_root:
        raise SystemExit("--output-root cannot be the project root")
    try:
        manifest.relative_to(project_root)
    except ValueError:
        raise SystemExit("Manifest must resolve inside --project-root")
    if not manifest.is_file():
        raise SystemExit("Manifest does not exist")
    for required in (
        "Dockerfile.vibebench-historical",
        "vibebench_snapshot_builder.py",
        "vibebench_forensics_extractor_v0_9.py",
    ):
        if not (project_root / required).is_file():
            raise SystemExit(f"Missing required project file: {required}")

    strategies = args.strategy or list(DEFAULT_STRATEGIES)
    rows = selected_rows(read_manifest(manifest), strategies, args.sample_id)
    if any(not re.fullmatch(r"[A-Za-z0-9_.-]+", row.get("sample_id", "")) for row in rows):
        raise SystemExit("Manifest contains an unsafe sample_id")
    if args.list:
        for row in rows:
            print(f"{row['sample_id']}\t{row['strategy']}\t{row['repo']}")
        print(f"Selected: {len(rows)}")
        return
    if not rows:
        raise SystemExit("No manifest rows selected")
    if not docker_available():
        raise SystemExit("Docker Desktop/daemon is not running")

    if not args.skip_image_build:
        run([
            "docker", "build",
            "--file", str(project_root / "Dockerfile.vibebench-historical"),
            "--tag", args.image,
            str(project_root),
        ])

    output_root.mkdir(parents=True, exist_ok=True)
    results = []
    for index, row in enumerate(rows, 1):
        sample_id = row["sample_id"]
        sample_output = output_root / sample_id
        sample_output.mkdir(parents=True, exist_ok=True)
        print(f"[{index}/{len(rows)}] isolated {sample_id} {row['strategy']} {row['repo']}", flush=True)
        command = docker_command(project_root, manifest, sample_output, args.image, sample_id)
        process = run(command, check=False)
        summary_path = sample_output / "run_summary.json"
        summary = []
        if summary_path.exists():
            try:
                summary = json.loads(summary_path.read_text(encoding="utf-8"))
            except Exception:
                summary = []
        entry = summary[0] if len(summary) == 1 else {}
        status = "OK" if process.returncode == 0 and entry.get("status") == "OK" else "ERROR"
        results.append({
            "sample_id": sample_id,
            "strategy": row["strategy"],
            "repo": row["repo"],
            "container_exit_code": process.returncode,
            "status": status,
            "sample_summary": entry,
        })

    aggregate = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "image": args.image,
        "project_root_mounted": False,
        "mounted_inputs": [
            "vibebench_snapshot_builder.py (read-only)",
            "vibebench_forensics_extractor_v0_9.py (read-only)",
            "manifest.csv (read-only)",
        ],
        "one_container_per_sample": True,
        "selected": len(results),
        "successful": sum(result["status"] == "OK" for result in results),
        "results": results,
    }
    aggregate_path = output_root / "run_summary_isolated.json"
    aggregate_path.write_text(json.dumps(aggregate, indent=2), encoding="utf-8")
    print(f"Isolated finished: {aggregate['successful']}/{aggregate['selected']} successful")
    print(f"Summary: {aggregate_path}")
    raise SystemExit(0 if aggregate["successful"] == aggregate["selected"] else 2)


if __name__ == "__main__":
    main()
