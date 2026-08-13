# VibeBench Option-B capture protocol v3

Locked: 2026-08-13  
Status: local minimal pilot approved (Option A); full batch blocked until pilot review

## What this fixes

The historical collector retained aggregate DOM counts but not enough detail to measure layout-template similarity, component repetition, spacing/radius consistency or visual differentiation. It also collapsed 81 failures into a generic navigation timeout.

The v3 protocol fixes the **measurement boundary** before another page is opened. It does not define a new model and does not change production v0.4.

## Label-blind collection

The collector receives only `sample_id` and `target_url`. Labels, target groups, cohort membership, provenance, prior outcomes and prior scores remain outside the collector process. Labels are joined only after the capture artifacts and hashes are frozen.

The URL is used for navigation. It, the hostname, origin, hosting provider and origin hash are prohibited model inputs.

## One fixed pilot viewport

- Desktop: 1440 × 900

The minimal pilot deliberately excludes mobile comparison. Each pilot row gets one attempt in a fresh anonymous context. Partial captures remain failures rather than silently receiving zeros.

## What is measured

- normalized page and semantic-region geometry;
- visible-element boxes, roles, depth and deterministic structural signatures;
- a fixed computed-style property vector covering type, spacing, radii, borders, shadows and layout;
- structural and computed-style repetition frequencies;
- capped same-origin stylesheet coverage and CSS token-type summaries.

Raw text, raw HTML, response bodies and screenshots are not persisted. The minimal collector does not create screenshots or perform color/image analysis.

## Readiness and failures

Collection waits for DOMContentLoaded, fonts and two stable samples 500 ms apart. Every attempt records its terminal stage. DNS, TCP/TLS, HTTP, DOM readiness, content eligibility, computed-style extraction, structural aggregation and serialization have distinct outcomes.

A timeout records its active stage, elapsed time and whether a document or DOM was already observed. This prevents another undifferentiated `navigation_timeout` bucket.

## Repeat scans

Development stability requires two runs with the same pinned runtime, separated by 24–72 hours and using fresh contexts. Failed repeats are not imputed. Reports must include both feature drift and technical-outcome transitions.

## Option A decision

The pilot runs locally through Playwright and a locally installed Chromium-compatible browser. Its exact browser version is written into every run. The live Vercel product and v0.4 model are not involved.

The repository-managed Chromium build is installed with `npm run research:v0.5-option-b-v3-browser-setup`. An explicit `VIBEBENCH_CHROME_PATH` is accepted for pilot diagnosis, but the full batch requires the repository-managed build. The exact runtime version is written into each output.

The full batch remains blocked until the pilot demonstrates that the additional structural/style measurements are technically stable and useful.

No cloud browser worker is required for this research phase.

## Sequence after implementation

1. Run capture without labels.
2. Freeze capture and attempt-audit hashes.
3. Join labels only to audit technical yield.
4. Define and freeze a separate derived-feature contract without comparing outcomes.
5. Join labels for Development evaluation.
6. Validate repeat stability and explanation correctness.
7. Only then preregister a new independent holdout.

Machine-readable source of truth: `option_b_capture_contract_v3.json`.
