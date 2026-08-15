#!/usr/bin/env python3
"""Freeze, build, hash, and locally scan historical Human website repositories.

Supported strategies: static_auto, static_or_node, node_auto, jekyll, hugo,
hexo, and php_runtime. Public repositories require outbound Git access; no API
token is required.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import shutil
import socket
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

SAMPLE_ID_PATTERN = re.compile(r"^[A-Z0-9][A-Z0-9_-]{0,63}$")


def validate_sample_id(value: str) -> str:
    """Return a manifest sample ID only when it is safe as a path component."""
    if not isinstance(value, str) or not SAMPLE_ID_PATTERN.fullmatch(value):
        raise ValueError(
            "sample_id must match ^[A-Z0-9][A-Z0-9_-]{0,63}$; "
            f"received {value!r}"
        )
    return value


def contained_path(root: Path, *parts: str) -> Path:
    """Resolve a child path and fail closed if it escapes the expected root."""
    resolved_root = root.resolve()
    candidate = resolved_root.joinpath(*parts).resolve()
    try:
        candidate.relative_to(resolved_root)
    except ValueError:
        raise ValueError(f"Path escapes configured root: {candidate}")
    return candidate


def run(cmd, cwd=None, check=True, env=None):
    process = subprocess.run(
        cmd,
        cwd=cwd,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=isinstance(cmd, str),
    )
    if check and process.returncode != 0:
        raise RuntimeError(f"Command failed ({process.returncode}): {cmd}\n{process.stdout[-8000:]}")
    return process


def tree_hash(root: Path) -> str:
    digest = hashlib.sha256()
    files = sorted(path for path in root.rglob("*") if path.is_file() and ".git" not in path.parts)
    for file_path in files:
        relative = file_path.relative_to(root).as_posix().encode()
        digest.update(len(relative).to_bytes(4, "big"))
        digest.update(relative)
        with file_path.open("rb") as handle:
            while True:
                block = handle.read(1024 * 1024)
                if not block:
                    break
                digest.update(block)
    return digest.hexdigest()


def find_web_root(source: Path):
    candidates = [source, source / "docs", source / "public", source / "dist", source / "build", source / "site", source / "www"]
    for candidate in candidates:
        if (candidate / "index.html").exists():
            return candidate
    direct_matches = list(source.glob("*/index.html"))
    if len(direct_matches) == 1:
        return direct_matches[0].parent
    matches = list(source.rglob("index.html"))
    if matches:
        matches.sort(key=lambda path: len(path.relative_to(source).parts))
        return matches[0].parent
    return None


def npm_has_script(source: Path, script: str) -> bool:
    package = source / "package.json"
    if not package.exists():
        return False
    try:
        data = json.loads(package.read_text(encoding="utf-8"))
        return script in (data.get("scripts") or {})
    except Exception:
        return False


def npm_install(source: Path):
    if (source / "package-lock.json").exists():
        process = run(["npm", "ci"], cwd=source, check=False)
        if process.returncode == 0:
            return
    run(["npm", "install"], cwd=source)


def build_snapshot(source: Path, output: Path, strategy: str):
    output.mkdir(parents=True, exist_ok=True)
    if strategy == "php_runtime":
        shutil.copytree(
            source,
            output / "source",
            dirs_exist_ok=True,
            ignore=shutil.ignore_patterns(".git", "node_modules"),
        )
        return {"serve_root": "source", "runtime": "php"}

    if strategy == "jekyll":
        if (source / "Gemfile").exists():
            run(["bundle", "install"], cwd=source)
            run(["bundle", "exec", "jekyll", "build", "-d", str(output / "site")], cwd=source)
        else:
            run(["jekyll", "build", "-d", str(output / "site")], cwd=source)
        return {"serve_root": "site", "runtime": "static"}

    if strategy == "hugo":
        run(["hugo", "--destination", str(output / "site")], cwd=source)
        return {"serve_root": "site", "runtime": "static"}

    if strategy == "hexo":
        npm_install(source)
        if npm_has_script(source, "generate"):
            run(["npm", "run", "generate"], cwd=source)
        else:
            run(["npx", "hexo", "generate"], cwd=source)
        if not (source / "public").exists():
            raise RuntimeError("Hexo build produced no public/ directory")
        shutil.copytree(source / "public", output / "site", dirs_exist_ok=True)
        return {"serve_root": "site", "runtime": "static"}

    if strategy in ("node_auto", "static_or_node"):
        if (source / "package.json").exists() and npm_has_script(source, "build"):
            npm_install(source)
            run(["npm", "run", "build"], cwd=source)
            for name in ("dist", "build", "public", "out", "_site"):
                candidate = source / name
                if (candidate / "index.html").exists():
                    shutil.copytree(candidate, output / "site", dirs_exist_ok=True)
                    return {"serve_root": "site", "runtime": "static"}

    web_root = find_web_root(source)
    if not web_root:
        raise RuntimeError("Could not identify a web root containing index.html")
    shutil.copytree(
        web_root,
        output / "site",
        dirs_exist_ok=True,
        ignore=shutil.ignore_patterns(".git", "node_modules"),
    )
    return {"serve_root": "site", "runtime": "static"}


def commit_date(repository: Path, sha: str) -> str:
    return run(["git", "show", "-s", "--format=%cI", sha], cwd=repository).stdout.strip()


def parse_datetime(value: str):
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    return datetime.fromisoformat(value).astimezone(timezone.utc)


def clone_freeze(repo_url: str, destination: Path, pinned_sha: str | None, cutoff: str):
    local_source = Path(repo_url)
    if local_source.exists():
        # Local-path support keeps the smoke test independent of Git transport
        # helpers while preserving the complete .git history.
        shutil.copytree(local_source, destination)
    else:
        # LFS pointer files are sufficient for source/snapshot provenance and keep
        # the freezer independent of a host-level git-lfs installation.
        run([
            "git",
            "-c", "filter.lfs.smudge=",
            "-c", "filter.lfs.process=",
            "-c", "filter.lfs.required=false",
            "clone", "--filter=blob:none", "--no-tags", repo_url, str(destination),
        ])
        run(["git", "config", "filter.lfs.smudge", ""], cwd=destination)
        run(["git", "config", "filter.lfs.process", ""], cwd=destination)
        run(["git", "config", "filter.lfs.required", "false"], cwd=destination)
    if pinned_sha:
        run(["git", "checkout", "--detach", pinned_sha], cwd=destination)
        sha = pinned_sha
    else:
        # Freeze the most recent reachable commit at or before the historical
        # cutoff instead of merely accepting today's HEAD when it happens to be old.
        sha = run(
            ["git", "rev-list", "-1", f"--before={cutoff}", "HEAD"],
            cwd=destination,
        ).stdout.strip()
        if not sha:
            raise RuntimeError(f"Repository has no reachable commit at or before cutoff {cutoff}")
        run(["git", "checkout", "--detach", sha], cwd=destination)
    date = commit_date(destination, sha)
    if parse_datetime(date) > parse_datetime(cutoff):
        raise RuntimeError(f"Commit {sha} has date {date}, after cutoff {cutoff}")
    return sha, date


def parse_extractor_json(raw: str):
    starts = [match.start() for match in re.finditer(r"(?m)^\s*\{", raw or "")]
    for start in reversed(starts):
        candidate = raw[start:].strip()
        try:
            return json.loads(candidate)
        except Exception:
            continue
    raise RuntimeError("Extractor returned no parseable JSON object. Raw tail:\n" + (raw or "")[-4000:])


def scan_local(snapshot_dir: Path, runtime: str, extractor: Path, result_json: Path):
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    if runtime == "php":
        process = subprocess.Popen(
            ["php", "-S", f"127.0.0.1:{port}", "-t", str(snapshot_dir)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    else:
        process = subprocess.Popen(
            [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", str(snapshot_dir)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    try:
        time.sleep(0.7)
        scan = run(
            [sys.executable, str(extractor), f"http://127.0.0.1:{port}/", "--allow-private"],
            check=False,
        )
        parsed = parse_extractor_json(scan.stdout or "")
        if not parsed.get("scan_ok"):
            raise RuntimeError(f"Local extractor scan failed: {parsed.get('scan_error', 'unknown error')}")
        result_json.write_text(json.dumps(parsed, indent=2, ensure_ascii=False), encoding="utf-8")
        return scan.returncode
    finally:
        process.terminate()
        try:
            process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            process.kill()


def process_sample(row, output_root: Path, lock_directory: Path, extractor: Path | None):
    sample_id = validate_sample_id(row["sample_id"])
    repository = row["repo"]
    repo_url = row["repo_url"]
    strategy = row["strategy"]
    cutoff = row["cutoff"]
    working = contained_path(output_root, "_work", sample_id)
    frozen = contained_path(output_root, "snapshots", sample_id)
    lock_file = contained_path(lock_directory, f"{sample_id}.json")
    pinned = None
    if lock_file.exists():
        try:
            pinned = json.loads(lock_file.read_text(encoding="utf-8"))["commit_sha"]
        except Exception:
            pinned = None

    if working.exists():
        shutil.rmtree(working)
    working.parent.mkdir(parents=True, exist_ok=True)
    sha, date = clone_freeze(repo_url, working, pinned, cutoff)

    source_hash = tree_hash(working)
    if frozen.exists():
        shutil.rmtree(frozen)
    result = build_snapshot(working, frozen, strategy)
    serve_root = frozen / result["serve_root"]
    output_hash = tree_hash(serve_root)
    index_exists = (serve_root / "index.html").exists() or result["runtime"] == "php"

    lock = {
        "sample_id": sample_id,
        "repo": repository,
        "repo_url": repo_url,
        "commit_sha": sha,
        "commit_date": date,
        "cutoff": cutoff,
        "strategy": strategy,
        "source_sha256": source_hash,
        "snapshot_sha256": output_hash,
        "serve_root": str(serve_root),
        "runtime": result["runtime"],
        "index_exists": index_exists,
        "frozen_at_utc": datetime.now(timezone.utc).isoformat(),
    }
    lock_directory.mkdir(parents=True, exist_ok=True)
    lock_file.write_text(json.dumps(lock, indent=2), encoding="utf-8")

    if extractor and extractor.exists():
        scan_path = frozen / "vibebench_scan.json"
        return_code = scan_local(serve_root, result["runtime"], extractor, scan_path)
        lock["scan_exit_code"] = return_code
        lock["scan_result"] = str(scan_path)
        lock_file.write_text(json.dumps(lock, indent=2), encoding="utf-8")
    return lock


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--output-dir", default="vibebench_historical_snapshots")
    parser.add_argument("--summary-json", help="optional run-summary path; defaults inside output-dir")
    parser.add_argument("--extractor", help="path to vibebench_forensics_extractor.py")
    parser.add_argument("--sample-id", action="append", help="limit to one or more sample IDs")
    parser.add_argument("--strategy", action="append", help="limit to one or more build strategies")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--resume", action="store_true", help="reuse complete snapshots with valid locks")
    parser.add_argument(
        "--min-success",
        type=int,
        help="exit successfully when at least this many selected samples succeed",
    )
    args = parser.parse_args()

    output_root = Path(args.output_dir).resolve()
    lock_directory = output_root / "locks"
    extractor = Path(args.extractor).resolve() if args.extractor else None
    wanted = set(args.sample_id or [])
    wanted_strategies = set(args.strategy or [])
    with open(args.manifest, encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    for row in rows:
        validate_sample_id(row.get("sample_id"))
    if wanted:
        rows = [row for row in rows if row["sample_id"] in wanted]
    if wanted_strategies:
        rows = [row for row in rows if row["strategy"] in wanted_strategies]
    if args.limit:
        rows = rows[: args.limit]

    results = []
    for index, row in enumerate(rows, 1):
        sample_id = validate_sample_id(row["sample_id"])
        print(f"[{index}/{len(rows)}] {sample_id} {row['repo']}", flush=True)
        lock_file = contained_path(lock_directory, f"{sample_id}.json")
        if args.resume and lock_file.exists():
            try:
                lock = json.loads(lock_file.read_text(encoding="utf-8"))
                serve_root = Path(lock["serve_root"])
                scan_complete = not extractor or Path(lock.get("scan_result", "")).exists()
                if serve_root.exists() and scan_complete:
                    results.append({"sample_id": sample_id, "status": "OK", "resumed": True, **lock})
                    print(f"  RESUME {lock['commit_sha'][:12]} {lock['snapshot_sha256'][:12]}")
                    continue
            except Exception:
                pass
        try:
            lock = process_sample(row, output_root, lock_directory, extractor)
            results.append({"sample_id": sample_id, "status": "OK", **lock})
            print(f"  OK {lock['commit_sha'][:12]} {lock['snapshot_sha256'][:12]}")
        except Exception as error:
            results.append({"sample_id": sample_id, "status": "ERROR", "error": str(error)})
            print(f"  ERROR: {error}", file=sys.stderr)

    output_root.mkdir(parents=True, exist_ok=True)
    summary_path = Path(args.summary_json).resolve() if args.summary_json else output_root / "run_summary.json"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    successful = sum(result["status"] == "OK" for result in results)
    print(f"Finished: {successful}/{len(results)} successful")
    required = len(results) if args.min_success is None else args.min_success
    if required < 0 or required > len(results):
        raise SystemExit(f"--min-success must be between 0 and {len(results)}")
    print(f"Success gate: {successful}/{required} required")
    sys.exit(0 if successful >= required else 2)


if __name__ == "__main__":
    main()
