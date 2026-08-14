# VibeBench Option B v3 — method review after the repeat pilot

Date: 2026-08-14

Decision: **The six-site repeat is technically adequate for a derived-feature stability check. It is not approval for a full batch or a model claim.**

## Evidence reviewed

- The same frozen six-site manifest was used in both runs.
- Browser, Playwright version, operating system, locale, timezone, viewport and collector version were identical.
- The runs were separated by 25.93 hours.
- Five sites succeeded in both runs. `DEV4-030` returned the same `ineligible_empty_or_interstitial` outcome twice.
- Four of five successful pages had no drift in the raw comparison fields.
- `OPT-B-HUM-057` changed from 220 to 229 visible elements (+9; 4.09%). Its viewport, document dimensions, layout-region count and readable stylesheet count did not change.

## Method decision

The isolated 4.09% element-count change is accepted for the limited purpose of testing whether aggregate, normalized features remain stable. The change is consistent with a small amount of dynamic page content, but this is an inference; the privacy-minimal capture intentionally does not retain text, screenshots or URLs that could identify the exact changing component.

The feature names, formulas and tolerances are therefore frozen before computing the derived values. No label, target, cohort, URL, hostname, provenance or builder marker is available to the feature builder. Signature hashes are reduced to frequency aggregates; the hash values themselves are not features.

## Pre-registered stability rule

- Compare only the five samples that succeeded in both runs, at the same desktop viewport.
- Require the same manifest, runtime and technical outcomes.
- Permit no imputation.
- Require every absolute per-feature drift to stay within its frozen tolerance: 0.05 for normalized shares/ratios and 0.10 for log-transformed counts/densities.
- Do not alter tolerances after seeing derived drift.

## What a pass would mean

A pass means only that the 42 aggregate measurements are repeatable on this small technical pilot. It would not show that they distinguish AI-assisted from conventionally developed sites, produce a trustworthy 0–100 score, measure security, or justify deployment. Those questions require a larger label-blind capture followed by a separately governed label join and evaluation.
