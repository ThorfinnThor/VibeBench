# VibeBench blind holdout evaluation v0.1

Stand: 2026-08-10  
Run: `blind_run_v0_1_2026-08-10`  
Scanner: `6338a3a377ab58eb3f49b8cae4df45f4eb60abc0`  
Endpoint: https://vibe-bench-cyan.vercel.app/api/scan

## Executive result

The preregistered rule (**direct or indicative = positive**) produced 30 true positives, 9 false positives, 40 true negatives, and 19 false negatives on 98 technically successful scans. Accuracy was 71.4 %, precision 76.9 %, recall 61.2 %, specificity 81.6 %, and F1 68.2 %.

Technical completion was 98/100 (98.0 % (95.0 %–100.0 %)). The two final failures are reported separately and are not converted into classification errors.

The strongest product finding is the separation between evidence levels: no Human control had a direct verdict, while 9 Human controls were called indicative. Direct evidence alone therefore had 100.0 % precision and 100.0 % specificity on this holdout, but this is a **post-hoc diagnostic**, not the preregistered primary result and not an independently validated replacement threshold.

## Technical execution

| Measure | Result |
|---|---:|
| Successful scans | 98 / 100 |
| Final technical errors | 2 |
| Retried exactly once | 2 |
| AI technical success | 49 / 50 (98.0 %) |
| Human technical success | 49 / 50 (98.0 %) |
| Median total request time | 433 ms |
| P95 total request time | 1535 ms |

| Failed sample | Label | URL | Final error | Attempts |
|---|---|---|---|---:|
| HO-AI-REPLIT-AGENT-06 | AI | https://scorecastr.co/ | Website antwortet mit HTTP 403. | 2 |
| HO-HUM-SAAS-01 | HUMAN | https://cal.com/ | Die HTML-Antwort ist für den sicheren Schnellscan zu groß. | 2 |

## Primary classification result

Positive means `direct` or `indicative`; negative means `indeterminate`. Technical errors are excluded.

| Ground truth / prediction | Positive | Negative |
|---|---:|---:|
| AI | TP 30 | FN 19 |
| Human | FP 9 | TN 40 |

| Metric | Point estimate (95% stratified-bootstrap interval) |
|---|---:|
| Accuracy | 71.4 % (62.2 %–79.6 %) |
| Precision | 76.9 % (65.7 %–88.4 %) |
| Recall / sensitivity | 61.2 % (46.9 %–75.5 %) |
| Specificity | 81.6 % (69.4 %–91.8 %) |
| False-positive rate | 18.4 % (8.2 %–30.6 %) |
| F1 | 68.2 % (56.5 %–78.3 %) |

Bootstrap: 10,000 deterministic stratified replicates, seed 20260810. AI and Human successful rows were sampled separately with replacement.

## Verdict distribution by stratum

| Stratum | Technical | Direct | Indicative | Indeterminate | Error | Primary positive rate |
|---|---:|---:|---:|---:|---:|---:|
| AI_LOVABLE | 10/10 | 8 | 0 | 2 | 0 | 80.0 % |
| AI_BOLT | 10/10 | 3 | 1 | 6 | 0 | 40.0 % |
| AI_REPLIT_AGENT | 9/10 | 0 | 0 | 9 | 1 | 0.0 % |
| AI_V0 | 10/10 | 7 | 1 | 2 | 0 | 80.0 % |
| AI_OTHER_AGENTIC | 10/10 | 10 | 0 | 0 | 0 | 100.0 % |
| HUMAN_MODERN_APP | 10/10 | 0 | 1 | 9 | 0 | 10.0 % |
| HUMAN_SAAS | 9/10 | 0 | 6 | 3 | 1 | 66.7 % |
| HUMAN_PORTFOLIO_AGENCY | 10/10 | 0 | 1 | 9 | 0 | 10.0 % |
| HUMAN_CONTENT_DOCS | 10/10 | 0 | 1 | 9 | 0 | 10.0 % |
| HUMAN_PRE_AI_SNAPSHOT | 10/10 | 0 | 0 | 10 | 0 | 0.0 % |

## Human indicative false positives

No Human control received direct builder evidence. All 9 primary false positives came from the general multi-signal `indicative` route.

| Sample | URL | Stack signals | Structural hints |
|---|---|---|---|
| HO-HUM-MODERN-APP-07 | https://jsoncrack.com/ | Next.js,React | high-data-attribute-density,script-heavy-static-shell |
| HO-HUM-SAAS-03 | https://umami.is/ | Next.js,React,Tailwind CSS,Lucide | dense-modern-stack,script-heavy-static-shell |
| HO-HUM-SAAS-05 | https://formbricks.com/ | Next.js,React,Tailwind CSS,Lucide | dense-modern-stack,high-data-attribute-density,script-heavy-static-shell |
| HO-HUM-SAAS-07 | https://twenty.com/ | Next.js,React | high-data-attribute-density,script-heavy-static-shell |
| HO-HUM-SAAS-08 | https://dub.co/ | Next.js,React,Tailwind CSS,Radix UI,Lucide,Supabase | dense-modern-stack,high-data-attribute-density,script-heavy-static-shell |
| HO-HUM-SAAS-09 | https://www.papermark.com/ | Next.js,React,Tailwind CSS,Radix UI,Lucide | dense-modern-stack,high-data-attribute-density,script-heavy-static-shell |
| HO-HUM-SAAS-10 | https://plane.so/ | Next.js,Lucide | high-data-attribute-density,script-heavy-static-shell |
| HO-HUM-PORTFOLIO-AGENCY-04 | https://paco.me/ | Next.js,React,Radix UI | high-data-attribute-density,script-heavy-static-shell |
| HO-HUM-CONTENT-DOCS-07 | https://tailwindcss.com/docs | Next.js,React,Tailwind CSS | high-data-attribute-density,script-heavy-static-shell |

## Exploratory strict operating point

If only `direct` is considered positive, the same opened holdout gives TP 28, FP 0, TN 49, FN 21; accuracy 78.6 %, precision 100.0 %, recall 57.1 %, specificity 100.0 %, and F1 72.7 %. Because this comparison was selected after seeing the results, it is evidence for designing v0.2, not a new validated claim.

## Interpretation

- Direct deployment artifacts behave as high-precision evidence on this set.
- The generic indicative route is not sufficiently specific to be presented as equivalent to direct builder evidence: 9/49 technically successful Human controls were indicative.
- Here, blind means that the scanner source, thresholds, manifest and retry policy were frozen before holdout requests. Labels remained in the audit manifest, but the endpoint received only each target URL.
- AI coverage remains builder-dependent. Replit Agent had no positive result among its nine technically successful sites; Lovable, v0, and Base44-derived sites were much more visible.
- An `indeterminate` result does not mean a page was Human-made. It means the frozen public-page scanner did not see enough evidence.
- Group sizes are ten sites and provide directional diagnostics, not precise builder-wide estimates.
- These results apply to the frozen curated holdout and are not a calibrated AI-authorship probability.

## Next actions

1. Keep direct evidence as the only high-confidence user-facing attribution in the current product language.
2. Rename or demote indicative output to an explicitly non-attributive structural signal before changing any classifier rule.
3. Develop a v0.2 rule on Development data only; do not tune against these 100 labels.
4. Create a fresh second holdout before validating a v0.2 threshold or probability score.
5. Add a distinct technical outcome for blocked pages and size-limit failures so they cannot be confused with indeterminate classifications.
