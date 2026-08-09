#!/usr/bin/env python3
"""Train the first group-aware VibeBench URL logistic-regression baseline.

This intentionally excludes labels, URLs, hashes, free-text metadata, and the
hand-authored rule_score. It is exploratory pilot diagnostics, not a calibrated
production probability.
"""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

try:
    import numpy as np
    from sklearn.impute import SimpleImputer
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import (
        accuracy_score,
        brier_score_loss,
        confusion_matrix,
        precision_recall_fscore_support,
        roc_auc_score,
    )
    from sklearn.model_selection import GroupShuffleSplit
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler
except Exception as error:
    raise SystemExit(f"Requires scikit-learn and numpy: {error}")


EXCLUDE_PREFIXES = (
    "src_",
    "scan_ok",
    "requested_url",
    "final_url",
    "scan_error",
    "html_sha256",
    "rule_score",
    "rule_score_reasons",
    "tls_subject_cn",
    "tls_issuer_org",
    "tls_not_after",
    "content_type",
    "server_header",
    "x_powered_by",
    "cache_control",
    "meta_generator",
)


def label_from_row(row):
    explicit = (row.get("src_binary_label") or "").upper()
    if explicit == "AI":
        return 1
    if explicit == "HUMAN":
        return 0
    cohort = (row.get("src_cohort") or "").upper()
    if cohort.startswith("AI_"):
        return 1
    if cohort.startswith("HUMAN_"):
        return 0
    target = (row.get("src_label_target") or "").upper()
    if target.startswith("AI_"):
        return 1
    if target == "HUMAN_CONTROL":
        return 0
    return None


def is_float(value):
    try:
        float(value)
        return True
    except Exception:
        return False


def select_numeric(rows):
    numeric = []
    for header in rows[0]:
        if any(header == prefix or header.startswith(prefix) for prefix in EXCLUDE_PREFIXES):
            continue
        nonempty = [row.get(header, "") for row in rows if row.get(header, "") not in ("", None)]
        if nonempty and sum(is_float(value) for value in nonempty) / len(nonempty) >= 0.95:
            numeric.append(header)
    return numeric


def feature_matrix(rows, numeric):
    return np.array(
        [[float(row[header]) if is_float(row.get(header, "")) else np.nan for header in numeric] for row in rows],
        dtype=float,
    )


def make_model():
    return Pipeline(
        [
            ("impute", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
            ("model", LogisticRegression(max_iter=3000, class_weight="balanced", C=0.5)),
        ]
    )


def split_with_both_classes(features, labels, groups, test_size, seed):
    for extra in range(50):
        splitter = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=seed + extra)
        train, test = next(splitter.split(features, labels, groups))
        if len(set(labels[train])) == 2 and len(set(labels[test])) == 2:
            return train, test, seed + extra
    raise RuntimeError("Could not produce a grouped split containing both classes")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("features_csv")
    parser.add_argument("--output-json", required=True)
    parser.add_argument("--test-size", type=float, default=0.30)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    with open(args.features_csv, encoding="utf-8-sig", newline="") as handle:
        raw = list(csv.DictReader(handle))
    rows = [row for row in raw if str(row.get("scan_ok", "")).lower() in ("1", "true")]
    rows = [row for row in rows if label_from_row(row) is not None]
    if len(rows) < 20:
        raise SystemExit(f"Need >=20 successful labeled scans; found {len(rows)}")

    numeric = select_numeric(rows)
    if not numeric:
        raise SystemExit("No eligible numeric technical features found")
    features = feature_matrix(rows, numeric)
    labels = np.array([label_from_row(row) for row in rows], dtype=int)
    groups = np.array(
        [row.get("src_url_group") or row.get("hostname") or f"row-{index}" for index, row in enumerate(rows)]
    )
    train, test, split_seed = split_with_both_classes(features, labels, groups, args.test_size, args.seed)

    pipeline = make_model()
    pipeline.fit(features[train], labels[train])
    probabilities = pipeline.predict_proba(features[test])[:, 1]
    predictions = (probabilities >= 0.5).astype(int)
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels[test], predictions, average="binary", zero_division=0
    )
    coefficients = pipeline.named_steps["model"].coef_[0]
    ranked = sorted(zip(numeric, coefficients), key=lambda pair: pair[1])

    report = {
        "n_successful_labeled": int(len(rows)),
        "class_counts": {
            "ai": int(labels.sum()),
            "human": int((1 - labels).sum()),
        },
        "split": {
            "type": "GroupShuffleSplit",
            "seed": int(split_seed),
            "test_size": args.test_size,
            "n_train": int(len(train)),
            "n_test": int(len(test)),
        },
        "feature_count": len(numeric),
        "metrics": {
            "accuracy": float(accuracy_score(labels[test], predictions)),
            "precision_ai": float(precision),
            "recall_ai": float(recall),
            "f1_ai": float(f1),
            "roc_auc": float(roc_auc_score(labels[test], probabilities)),
            "brier": float(brier_score_loss(labels[test], probabilities)),
            "confusion_matrix": confusion_matrix(labels[test], predictions, labels=[0, 1]).tolist(),
        },
        "top_coefficients": {
            "most_human": [{"feature": name, "coef": float(value)} for name, value in ranked[:12]],
            "most_ai": [{"feature": name, "coef": float(value)} for name, value in ranked[-12:][::-1]],
        },
        "warning": "Pilot diagnostics only; not a calibrated AI probability or production accuracy claim.",
    }
    Path(args.output_json).write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
