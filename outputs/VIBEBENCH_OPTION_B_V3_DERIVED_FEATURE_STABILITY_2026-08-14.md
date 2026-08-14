# VibeBench Option B v3 — derived-feature stability

Date: 2026-08-14

Status: **Pilot stability gate passed; predictive usefulness and a larger capture remain unapproved.**

## Result

The feature contract was frozen before derived values were computed and before any label join. Both official pilot captures were then transformed into the same 42 identity-free aggregates.

The contract's initially rounded lock timestamp was later corrected to the file creation time in UTC. This metadata-only correction changed no feature name, formula or tolerance and is recorded inside the machine-readable contract.

- shared successful pages: 5;
- features per page: 42;
- paired drift checks: 210;
- checks inside their preregistered tolerance: 210;
- imputed values: 0;
- label join: not performed;
- production v0.4 changes: none.

The gate therefore reports `DERIVED_FEATURE_STABILITY_GATE_PASSED`.

## Feature surface

The contract covers:

- 7 document/content-density aggregates;
- 3 rendered-region aggregates;
- 8 element-composition aggregates;
- 2 geometry aggregates;
- 2 flex/grid/positioning aggregates;
- 4 typography aggregates;
- 6 spacing/decoration aggregates;
- 5 component/style repetition aggregates;
- 5 public CSS structure aggregates.

Stored signature hashes are used only to count unique and repeated patterns. Hash values are never model inputs. Sample IDs only pair the same page across runs. Labels, targets, cohorts, URLs, hostnames, provenance, builder markers and technical outcomes are excluded from feature construction.

## Observed drift

Two pages had no changed derived features. The other three remained inside every frozen limit:

| Pilot sample | Changed features | Largest fraction of its allowed tolerance |
|---|---:|---:|
| DEV3-032 | 0 | 0.0% |
| DEV3X-074 | 0 | 0.0% |
| DEV3X-076 | 2 | 5.4% |
| OPT-B-AI-069 | 1 | 16.7% |
| OPT-B-HUM-057 | 32 | 80.7% |

The largest absolute drift was `dom_nodes_log` on `OPT-B-HUM-057`: 0.08066 against its pre-registered 0.10 limit. The next largest was `visible_elements_log`: 0.03992 against 0.10. The largest normalized-share drift was `max_dom_depth_scaled`: 0.025 against 0.05.

The earlier raw repeat report covered a deliberately small set of top-level metrics. The derived comparison additionally detected a minor visible-text density change on `DEV3X-076` and a computed-style repetition change on `OPT-B-AI-069`. Recording these differences is expected; they remain below the rules fixed before this evaluation.

## Interpretation boundary

This result supports a narrow statement: the aggregate browser measurements were repeatable on five shared successful pages under the pinned runtime. It does **not** show that the features distinguish AI-assisted development, improve Precision or Recall, support a trustworthy 0–100 Vibe-Footprint, or identify security issues.

Five pages are far too few for usefulness, cohort or category evaluation. A larger label-blind capture must be approved before model research. Labels may only be joined after the larger capture and its technical audit are frozen.

## Reproduction

```bash
npm run research:v0.5-option-b-v3-derived-pilot-build
npm run research:v0.5-option-b-v3-derived-pilot-stability
```

Machine-readable artifacts:

- `outputs/development_v0_5_option_b_v3/option_b_derived_feature_contract_v1.json`
- `outputs/development_v0_5_option_b_v3/option_b_derived_pilot_feature_matrix_v1.json`
- `outputs/development_v0_5_option_b_v3/option_b_derived_pilot_stability_v1.json`

## Next decision

Choose the scope of the next label-blind technical collection. The recommended conservative sequence is a fixed 20-site expansion, technical audit and one repeat subset before authorizing the remaining frozen 81-site Development set. The faster alternative is the full 81-site collection immediately; it is more efficient but gives less opportunity to catch category-specific yield or payload-size problems early.
