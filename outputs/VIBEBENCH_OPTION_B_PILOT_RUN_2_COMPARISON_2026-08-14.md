# VibeBench Option-B pilot run 2 and repeat comparison

Date: 2026-08-14
Status: repeat technically stable; method review required before any label join or full batch

## Run 2 result

Run 2 used the same six-row manifest, collector version, repository-managed Chromium and Playwright runtime as Run 1.

- attempted: 6;
- successful complete captures: 5;
- content-ineligible captures: 1;
- all seven first-run gates: passed;
- capture artifact: 1,823,811 bytes;
- audit artifact: 5,932 bytes.

The same sample remained content-ineligible in both runs. No failed row was imputed and no threshold was changed.

## Repeat checks

- separation: 25.93 hours;
- manifest hash: identical;
- runtime: identical;
- sample set: identical;
- technical outcome transitions: 0 of 6 changed;
- viewport match for every repeated successful capture: yes;
- document width/height, layout-region count and stylesheet-fetch count: unchanged for every repeated successful capture.

Four of the five successful captures were identical on the reported drift metrics. `OPT-B-HUM-057` changed from 220 to 229 visible elements, a relative change of 4.09%; its document dimensions, region count and stylesheet-fetch count remained unchanged. This is recorded as observed drift, not silently rounded away.

The machine-readable comparison is `outputs/development_v0_5_option_b_v3/option_b_local_pilot_repeat_comparison_v1.json`.

## Interpretation

The repeat demonstrates technical stability of the collector and no outcome instability across the six rows. The 4.09% element-count drift is small enough to proceed to explicit method review, but the comparison does not create an automatic model-quality claim or unlock the full 81-site batch.

## Next gates

1. Review whether the observed 4.09% drift is acceptable for the derived feature contract.
2. Freeze the derived feature definition without using labels or scores.
3. Only then join labels for Development evaluation.
4. Evaluate whether the new rendered-surface features add independent value.
5. Preregister a separate larger scan only after that evaluation.

Production v0.4, the live Vercel application and the existing precision/recall figures remain unchanged.
