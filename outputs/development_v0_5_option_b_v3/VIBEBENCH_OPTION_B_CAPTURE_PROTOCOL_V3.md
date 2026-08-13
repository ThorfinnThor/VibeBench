# VibeBench Option-B capture protocol v3

Locked: 2026-08-13  
Status: preregistered; execution blocked on infrastructure and privacy decisions

## What this fixes

The historical collector retained aggregate DOM counts but not enough detail to measure layout-template similarity, component repetition, spacing/radius consistency or visual differentiation. It also collapsed 81 failures into a generic navigation timeout.

The v3 protocol fixes the **measurement boundary** before another page is opened. It does not define a new model and does not change production v0.4.

## Label-blind collection

The collector receives only `sample_id` and `target_url`. Labels, target groups, cohort membership, provenance, prior outcomes and prior scores remain outside the collector process. Labels are joined only after the capture artifacts and hashes are frozen.

The URL is used for navigation. It, the hostname, origin, hosting provider and origin hash are prohibited model inputs.

## Two fixed viewports

- Desktop: 1440 × 900
- Mobile: 390 × 844

Both viewports must succeed for a technically usable row. Each gets at most two attempts in fresh anonymous contexts. Partial captures remain failures rather than silently receiving zeros.

## What is measured

- normalized page and semantic-region geometry;
- visible-element boxes, roles, depth and deterministic structural signatures;
- a fixed computed-style property vector covering type, spacing, radii, color, borders, shadows and layout;
- structural and computed-style repetition frequencies;
- a 12 × 8 visual grid derived from an ephemeral screenshot;
- palette, edge, occupancy and symmetry summaries;
- capped same-origin stylesheet coverage and CSS token-type summaries.

Raw text, raw HTML, response bodies and screenshots are not persisted by default. Screenshots exist only in memory long enough to derive the fixed visual grid. Any human-review image set needs a separate privacy and retention decision.

## Readiness and failures

Collection waits for DOMContentLoaded, fonts and two stable samples 500 ms apart. Every attempt records its terminal stage. DNS, TCP/TLS, HTTP, DOM readiness, content eligibility, computed-style extraction, visual extraction and serialization have distinct outcomes.

A timeout records its active stage, elapsed time and whether a document or DOM was already observed. This prevents another undifferentiated `navigation_timeout` bucket.

## Repeat scans

Development stability requires two runs with the same pinned runtime, separated by 24–72 hours and using fresh contexts. Failed repeats are not imputed. Reports must include both feature drift and technical-outcome transitions.

## What remains undecided

Execution is intentionally blocked until three decisions are recorded:

1. the pinned browser runtime and shared scan-worker architecture;
2. the privacy/retention policy for derived data and any optional review assets;
3. the exact deployed transport and concurrency controls.

Those choices affect reproducibility, cost, security and whether full browser capture is suitable for the deployment environment. The contract records required behavior without pretending that the infrastructure choice has already been made.

## Sequence after implementation

1. Run capture without labels.
2. Freeze capture and attempt-audit hashes.
3. Join labels only to audit technical yield.
4. Define and freeze a separate derived-feature contract without comparing outcomes.
5. Join labels for Development evaluation.
6. Validate repeat stability and explanation correctness.
7. Only then preregister a new independent holdout.

Machine-readable source of truth: `option_b_capture_contract_v3.json`.
