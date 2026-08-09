#!/usr/bin/env python3
import csv
import hashlib
import importlib.util
import json
import py_compile
import sys
import tempfile
from collections import Counter
from pathlib import Path

root = Path(__file__).resolve().parent

copied_unmodified = {
    "vibebench_feature_schema_v0_9.csv": "95fc1a586a8bdba4216594c2844fb2343224cafffee531cc8df6af59d3c673fc",
    "vibebench_url_evaluation_methodology_v0_9.md": "f0c5b10e84b87d8b59a695e637613feab87da1676e9dfec3423b816366626a0a",
    "vibebench_ai_live_url_expansion_v0_9.xlsx": "3e5751f75fc520d7c34aa2db4407567c53c7cf427b3d3c037fdce282da1b7e67",
    "vibebench_url_scan_queue_63_v0_9.csv": "77e11f790156a5cd947867d74b75bb698fdb05199022fa99885b4b48a22ac617",
    "vibebench_master_2000_v0_9.xlsx": "f837693724654141728a580f316f9763134905e728ea5237093e86e730968007",
    "vibebench_ai_native_500_v0_9.csv": "0615cbd8e5f1c18d0457626b06541a0f7d187f5b6a05def4c8fbf1682ef9e147",
    "website_design_reference_master_750.csv": "ebce3110931d6d2565ef93e4a1bccf21be8769d71bb1893aa76f2acf7c367b68",
}

for name, expected_hash in copied_unmodified.items():
    local = root / name
    assert local.is_file(), f"missing copied file: {name}"
    actual_hash = hashlib.sha256(local.read_bytes()).hexdigest()
    assert actual_hash == expected_hash, f"copy differs: {name}"

# The extractor was intentionally extended after recovery with bounded parallel
# fetches and resumable batch checkpoints; it is therefore no longer byte-identical
# to the original v0.9 attachment.
extractor_text = (root / "vibebench_forensics_extractor_v0_9.py").read_text(encoding="utf-8")
for marker in ("ThreadPoolExecutor", "def _write_batch_csv", '"--workers"', '"--resume"'):
    assert marker in extractor_text, f"missing extractor runtime enhancement: {marker}"

runner_text = (root / "run_vibebench_url_training_pipeline_v0_9.sh").read_text(encoding="utf-8")
for marker in ("--workers", "--resume", "--strategy static_auto", "--min-success 30", "--repeats 50"):
    assert marker in runner_text, f"missing safe/resumable runner enhancement: {marker}"

with tempfile.TemporaryDirectory(prefix="vibebench-verify-") as tmp:
    pycache = Path(tmp)
    for name in (
        "vibebench_evaluate_url_models_v0_9.py",
        "vibebench_forensics_extractor_v0_9.py",
        "vibebench_snapshot_builder.py",
        "vibebench_merge_url_features.py",
        "vibebench_train_baseline.py",
        "vibebench_run_isolated_snapshots.py",
    ):
        py_compile.compile(str(root / name), cfile=str(pycache / f"{name}.pyc"), doraise=True)

name = "vibebench_forensics_extractor_v0_9.py"
spec = importlib.util.spec_from_file_location(name.replace(".", "_"), root / name)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)

with (root / "vibebench_url_scan_queue_63_v0_9.csv").open(encoding="utf-8-sig", newline="") as handle:
    queue = list(csv.DictReader(handle))
assert len(queue) == 63
assert Counter(row["binary_label"] for row in queue) == {"AI": 46, "HUMAN": 17}
assert all(row["training_gate"] == "USE_ONLY_IF_SCAN_OK_1" for row in queue)

with (root / "vibebench_feature_schema_v0_9.csv").open(encoding="utf-8-sig", newline="") as handle:
    schema = list(csv.DictReader(handle))
assert len(schema) == 78

handover = root / "outputs" / "VIBEBENCH_HANDOVER_V0_9.md"
assert handover.is_file()
text = handover.read_text(encoding="utf-8")
for marker in ("Was bisher gemacht wurde", "Wiederherstellung aus dem Share-Chat", "Empfohlene Fortsetzung", "Definition of Done"):
    assert marker in text
readme = (root / "README.md").read_text(encoding="utf-8")
assert "öffentlich erreichbare Website" in readme
assert "Evidenz-Einschätzung" in readme
assert "noch keine kalibrierte Wahrscheinlichkeit" in readme

production_smoke = json.loads((root / "outputs" / "vibebench_production_smoke_2026-08-09.json").read_text())
assert production_smoke["summary"]["total"] == 20
assert production_smoke["summary"]["apiSuccessful"] == 20
assert production_smoke["summary"]["ai"]["direct"] == 5
assert production_smoke["summary"]["human"]["direct"] == 0
asset_update = root / "outputs" / "VIBEBENCH_ASSET_EVIDENCE_UPDATE_2026-08-09.md"
assert asset_update.is_file()
assert "Same-Origin" in asset_update.read_text(encoding="utf-8")

retry_report = root / "outputs" / "VIBEBENCH_LIVE_RETRY_REPORT_2026-08-09.md"
isolated_readme = root / "outputs" / "VIBEBENCH_ISOLATED_RUNNER_README.md"
assert retry_report.is_file() and "Nächste To-dos" in retry_report.read_text(encoding="utf-8")
assert isolated_readme.is_file() and "ein Container pro Sample" in isolated_readme.read_text(encoding="utf-8")
retry_audit = json.loads((root / "outputs" / "vibebench_live_retry_audit_2026-08-09.json").read_text())
assert retry_audit["summary"]["retried"] == 11
assert retry_audit["summary"]["recovered"] == 0
assert len(retry_audit["entries"]) == 11

runner_dependencies = [
    "vibebench_snapshot_builder.py",
    "vibebench_historical_snapshot_manifest_v0_8.csv",
    "vibebench_merge_url_features.py",
    "vibebench_train_baseline.py",
]
assert all(name in runner_text and (root / name).exists() for name in runner_dependencies)

isolated_runner = (root / "vibebench_run_isolated_snapshots.py").read_text(encoding="utf-8")
for marker in ("one_container_per_sample", "--cap-drop", "no-new-privileges", "project_root_mounted"):
    assert marker in isolated_runner, f"missing isolated-runner control: {marker}"
dockerfile = (root / "Dockerfile.vibebench-historical").read_text(encoding="utf-8")
for tool in ("nodejs", "jekyll", "hugo", "php-cli"):
    assert tool in dockerfile, f"missing container toolchain: {tool}"
assert (root / ".dockerignore").read_text(encoding="utf-8").startswith("**")

with (root / "vibebench_historical_snapshot_manifest_v0_8.csv").open(encoding="utf-8-sig", newline="") as handle:
    manifest = list(csv.DictReader(handle))
assert len(manifest) == 50
assert Counter(row["strategy"] for row in manifest) == {
    "static_auto": 35,
    "node_auto": 4,
    "jekyll": 3,
    "hugo": 2,
    "hexo": 1,
    "php_runtime": 4,
    "static_or_node": 1,
}

method_hash = hashlib.sha256((root / "vibebench_url_evaluation_methodology_v0_9.md").read_bytes()).hexdigest()
assert method_hash == "f0c5b10e84b87d8b59a695e637613feab87da1676e9dfec3423b816366626a0a"

print("verification: ok")
print("hash-locked source files:", len(copied_unmodified))
print("queue: 63 rows (46 AI / 17 Human)")
print("feature schema: 78 rows")
print("manifest: 50 rows with expected strategy distribution")
print("runner dependencies present:", ", ".join(runner_dependencies))
