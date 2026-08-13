# VibeBench Option-B visible-feature research

Date: 2026-08-13  
Status: Development research only; no production promotion

## Outcome

The score-blind v2 feature contract was frozen before the accepted label-based evaluation. It uses 28 normalized public-surface features and deliberately excludes URL, hostname, provenance, direct builder markers and framework/library markers.

The result is useful but not strong enough to replace production v0.4 or support an authorship claim. At the fixed 0.50 orientation threshold, the median repeated-Development result is:

| Measure | Median | P10–P90 |
| --- | ---: | ---: |
| Precision | 76.7% | 71.0–81.5% |
| Recall | 78.6% | 78.6–82.1% |
| F1 | 78.6% | 74.6–80.7% |
| Specificity | 86.8% | 83.0–90.6% |
| ROC AUC | 88.2% | 87.2–90.0% |
| Average Precision | 87.4% | 86.0–88.8% |

These are 20 deterministic, class-stratified five-fold assignments on the same Development set. They are not independent test metrics.

## Why only 81 websites are evaluated

The frozen browser-surface acquisition attempted 169 labelled candidates. Only 81 produced technically usable scans; 88 failed during collection. The technical yield is therefore 47.9%. The evaluated 81 consist of 28 Strong-AI and 53 Stable-Human sites.

This technical attrition is a material selection-bias risk. A larger original candidate list does not become a larger valid benchmark merely because URLs exist. Failed scans must not be silently counted as correct negatives or positives.

## Indeterminate result

The preregistered indeterminate range was 0.38–0.62. Across repeated assignments:

| Measure | Median |
| --- | ---: |
| Result coverage | 85.2% |
| Abstention rate | 13.6% |
| Precision among decided cases | 87.5% |
| Recall among decided positive cases | 80.8% |
| Positive recall when abstentions remain unresolved | 75.0% |

Ten of the 81 websites are indeterminate by their mean out-of-fold score. Abstention improves trust in the results that remain, but it does not create missing recall: unresolved positive sites remain unresolved.

## Calibration and score semantics

Median Brier score is 0.120, median log loss 0.389 and median five-bin expected calibration error 9.4 percentage points. Because training folds are class-balanced and the set is small, these outputs remain **orientation scores**, not calibrated probabilities of AI use.

The product must continue to describe 0–100 as a qualitative similarity index. It must not say that a score of 80 means an 80% probability of Vibecoding or 80% AI-generated code.

## Stability

The deterministic ±5% aggregate-count perturbation simulation produced:

- median absolute score drift: 0.32 points on the 0–100 scale;
- P90 absolute score drift: 1.12 points;
- binary threshold flips: 0.52%;
- qualitative band changes: 1.91%.

This is encouraging local numerical stability, but it is only a simulation. It does not replace repeat scans of real pages.

Train/test assignment sensitivity is materially larger: the median per-website score standard deviation is 4.62 points and the median score range across 20 assignments is 18.36 points. This is another reason not to publish v2 as a new production model.

## Cohort stability

Performance differs between the two acquisition cohorts:

| Cohort | Rows | Median Precision | Median Recall |
| --- | ---: | ---: | ---: |
| Existing | 37 | 69.2% | 72.7% |
| Expansion | 44 | 82.4% | 82.4% |

The gap is a generalization warning. A single aggregate Precision/Recall pair would hide it.

## Explanation stability

Nineteen of 28 features retain the same coefficient direction between P10 and P90 across the 100 fold-local models. Stable directions include section density, style-effect breadth, Tailwind-token share, module-script share, ARIA density and visible-text share.

This supports careful statements such as “this observable pattern raised/lowered similarity to the Development benchmark.” It does not support causal claims, proof of authorship or generic advice to remove accessible/semantic markup. Security and quality recommendations must remain separate from score drivers.

## Decision

- Keep frozen production v0.4 unchanged.
- Do not revive an arbitrary 90/90 tuning target.
- Retain v2 as a documented research baseline.
- Do not turn unstable features into user-facing explanations.
- Address technical scan yield and the cohort gap before independent Option-B validation.

## Next safe work

1. Add an evidence-completeness/confidence presentation to the product without replacing the v0.4 model.
2. Preregister a richer capture contract for the same benchmark sites: computed styles, repeated components/sections, layout regions, design-token distributions and screenshot-derived visual structure.
3. Run real repeat scans only after that contract is fixed; separate unreachable, blocked and extractor-failure outcomes.
4. After Development stabilizes, freeze one new independent Option-B holdout and open it once.

## Reproduction

```bash
npm run research:v0.5-option-b-visible-features
npm run research:v0.5-option-b-visible-evaluate
npm test
```

Primary artifacts:

- `outputs/development_v0_5_option_b/VIBEBENCH_OPTION_B_VISIBLE_FEATURE_CONTRACT_V2.md`
- `outputs/development_v0_5_option_b/option_b_visible_feature_matrix_v2.json`
- `outputs/development_v0_5_option_b/option_b_visible_evaluation_v2.json`
