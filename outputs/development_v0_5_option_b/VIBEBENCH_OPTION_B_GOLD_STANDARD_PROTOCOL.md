# VibeBench Option B — Gold-standard protocol

Status: preregistered before Option-B model evaluation  
Protocol version: 1.0  
Decision date: 2026-08-11  
Primary task: detect a **strong visible Vibe-Footprint** on a public website

## Why the target changed

The earlier binary label mixed two materially different questions:

1. Was an AI coding assistant used at any point?
2. Does the public website show the strong, builder-first footprint that VibeBench is meant to detect and explain?

Public HTML cannot reliably answer the first question. Option B makes the second question the primary product claim. Assistant usage without documented build intensity remains useful boundary data, but is no longer treated as hard positive ground truth.

## Locked label rules

The rules below are fixed before inspecting any Option-B model score, prediction, error row, or threshold result. Model output, public-surface features, and previous misclassification status are prohibited selection inputs.

### Positive: `STRONG_AI`

A sample is a hard positive only when all conditions pass:

- The provenance maps to the same public target or project family.
- The provenance explicitly names a prompt-first or builder-first system: Replit Agent, Bolt, Lovable, v0, Base44, or an equivalent native AI website/app builder.
- The provenance states that the product/site was built, generated, launched, or substantially created with that system. A tool merely appearing in a stack list is insufficient.
- The target was selected without inspecting VibeBench scores or confirmation errors.

Native-builder target groups already acquired under score-blind rules qualify when their individual provenance record meets these conditions.

### Negative: `STABLE_HUMAN`

A sample is a hard negative only when all conditions pass:

- A public source repository or equally strong first-party project record maps to the same target or project family.
- The public project history began before `2022-11-30T00:00:00Z`.
- The latest commit on the repository's default branch is before `2022-11-30T00:00:00Z`.
- The current public target is reachable and suitable for the existing HTML scanner.
- There is no explicit AI-builder provenance in the collected record.
- The target was selected without inspecting VibeBench scores or confirmation errors.

Repository creation alone does not qualify: post-cutoff maintenance could have changed the visible surface. Fork metadata is recorded; a fork is accepted only if its own public default-branch history meets the same dates and the provenance maps the fork to the target.

### Boundary cohort: `AMBIGUOUS`

A sample is excluded from hard binary Precision/Recall when any of these applies:

- Cursor, Claude Code, Codex, Windsurf, or another assistant is listed, but build intensity is unknown.
- AI use is self-reported without a sufficiently specific mapping to substantial creation of the target.
- A Human-labeled project's latest default-branch commit is on or after the cutoff.
- Repository metadata is missing, inaccessible, contradictory, or does not map confidently to the target.
- The technical scan failed or the target is no longer content-eligible.

The ambiguous cohort is retained for calibration, score-band design, and product-language testing. It must not be silently discarded from research reports.

## Deterministic construction

1. Join all Development acquisition manifests by `sample_id`.
2. Apply the locked provenance rules without loading feature values or model outputs.
3. Query repository metadata only for Human candidates.
4. Deduplicate by `project_family_id`.
5. Keep all qualifying `STRONG_AI` records.
6. Keep all qualifying `STABLE_HUMAN` records for model development; class weighting and grouped folds handle imbalance.
7. Assign all remaining records to `AMBIGUOUS`, with a machine-readable reason.

No class may be balanced by choosing examples according to scores, feature values, or known model difficulty.

## Evaluation gate

Development evaluation uses repeated, group-aware stratified validation. All preprocessing and feature selection must be fitted inside each training fold.

A candidate may advance only when all preregistered repeated assignments satisfy:

- Precision at least 90.0%
- Recall at least 90.0%

The selected threshold must be fixed before the independent holdout is opened. Median performance alone is not a pass.

## Independent confirmation

After a Development candidate passes:

- Acquire a new score-blind Option-B holdout from untouched deterministic source partitions.
- Freeze URLs, provenance, labels, model artifact, feature contract, and threshold before scanning predictions.
- Report technical coverage, confusion matrix, Precision, Recall, F1, and exact binomial confidence intervals.
- Deploy updated public accuracy claims only if independent holdout Precision and Recall are both at least 90.0%.

If the gate fails, keep production v0.4 unchanged and publish the failure in the research log.

## Product semantics

The 0–100 score estimates the strength of a site's publicly visible Vibe-Footprint. It is not proof of authorship, not a plagiarism detector, and not a claim that a specific person used AI. Security recommendations must be tied to observable technical findings and must remain separate from provenance probability.
