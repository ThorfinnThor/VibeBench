# VibeBench Option B research checkpoint

Date: 2026-08-11  
Decision: keep production v0.4 unchanged; Option B does not pass the 90/90 Development gate

## Outcome

Option B now targets a **strong visible Vibe-Footprint**, not any unobservable use of an AI coding assistant. The target and label rules were preregistered before Option-B model evaluation.

The frozen technically usable set contains:

- 81 public websites
- 28 `STRONG_AI` positives
- 53 `STABLE_HUMAN` negatives
- 68 rendered public-surface features
- no hostname, URL, provenance, declared-builder, previous-error, or confirmation-result feature

The strongest repeated Development results remain below the release gate:

| Experiment | Precision median | Precision minimum | Recall median | Recall minimum | 90/90 assignments |
| --- | ---: | ---: | ---: | ---: | ---: |
| Full 68-feature logistic | 77.8% | 74.1% | 75.0% | 71.4% | 0/20 |
| Fixed 14-feature Vibe-UI subset | 80.8% | 75.0% | 78.6% | 75.0% | 0/20 |

Random forests, a broader semantic subset, and a version without direct builder markers also failed. No Option-B model or threshold is frozen for production.

## Gold-standard change

The original 366-row Development collection mixed native AI builders, coding assistants with unknown intensity, and active Human projects. Applying the locked Option-B rules before model scoring yielded:

- 12 existing hard positives
- 26 existing hard negatives
- 328 ambiguous records retained outside hard Precision/Recall

Assistant-only records from Cursor, Claude Code, Codex, and Windsurf remain useful calibration data, but no longer count as hard positives. Human repositories updated after 2022-11-30 no longer count as hard negatives.

## Score-blind expansion

The official Bolt/Devpost event required a new public application built primarily with Bolt.new, explicit Bolt-use confirmation, and a public functional deployment. Its public gallery was therefore used as a positive provenance source. Gallery URLs were deterministically partitioned by SHA-256 before any model or feature inspection.

Historical Human candidates came from GitHub searches that required both creation and latest push before 2022-11-30. The official repository homepage supplied the target mapping. Latest commits were independently rechecked through GitHub metadata before scanning.

Candidate acquisition produced:

- 71 score-blind Bolt positive candidates
- 60 score-blind pre-cutoff Human candidates
- 60/60 Human repository histories independently confirmed before the cutoff

Many older public deployments were no longer technically usable. Browser collection and the fixed technical gate left 28 positives and 53 negatives across the existing and expansion cohorts. Per the product decision, acquisition stopped at this checkpoint.

Primary provenance sources:

- [Official Bolt hackathon requirements](https://worldslargesthackathon.devpost.com/)
- [Official public project gallery](https://worldslargesthackathon.devpost.com/project-gallery)
- Individual Devpost and GitHub provenance URLs are stored with every record.

## Validation design

The primary Development evaluation used:

- 20 deterministic class-stratified fold assignments
- five folds per assignment
- all standardization and training inside the training fold
- deterministic training-class balancing
- Development-only threshold and regularization selection
- a gate requiring every assignment to reach at least 90% Precision and 90% Recall

The strongest full-feature configuration was logistic regression with `l2=100` and threshold `0.45`. It passed the gate in 0 of 20 assignments.

Cross-cohort transfer was also weak:

- existing → expansion: 70.0% Precision, 82.4% Recall
- expansion → existing: 66.7% Precision, 72.7% Recall

This indicates genuine source and surface variation, not a threshold-only problem.

## Interpretation

The visible signals move in the expected direction: Vibe-built positives show more Tailwind-like utility classes, responsive variants, gradients, large rounding, shadows, animations, Lucide fingerprints, and Vite bundles. They are not universal, however, and established Human sites can use the same design system.

The current evidence supports a probabilistic Vibe-Footprint score with transparent findings. It does not support a trustworthy public claim of 90% Precision and 90% Recall.

## Product decision

- Keep the deployed v0.4 model and its independent 82.4% Precision / 85.7% Recall result unchanged.
- Do not open or acquire an Option-B independent holdout because Development did not pass.
- Keep Precision/Recall in the methodology section rather than the Hero.
- Continue presenting the 0–100 output as a visible-footprint estimate, not proof of authorship or AI use.
- Keep security findings separate from provenance probability and tie recommendations to observable evidence.

## Reproducible artifacts

- `outputs/development_v0_5_option_b/VIBEBENCH_OPTION_B_GOLD_STANDARD_PROTOCOL.md`
- `outputs/development_v0_5_option_b/option_b_protocol_v1.json`
- `outputs/development_v0_5_option_b/option_b_label_registry_v1.json`
- `outputs/development_v0_5_option_b/option_b_browser_surface_matrix_v1.json`
- `outputs/development_v0_5_option_b/option_b_development_validation_v1.json`
- `outputs/development_v0_5_option_b/option_b_model_research_v1.json`

## Next work without adding more websites

1. Improve observable feature quality: component repetition, layout-template similarity, copy-pattern embeddings that can run locally, asset graph structure, and rendered design-token consistency.
2. Predefine a new feature contract before re-evaluating the frozen 81-site set.
3. Require the same all-assignment 90/90 Development gate.
4. Only after that gate passes, preregister and freeze a separate independent Option-B holdout.
