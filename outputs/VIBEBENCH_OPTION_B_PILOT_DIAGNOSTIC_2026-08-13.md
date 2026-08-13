# VibeBench Option-B six-site pilot diagnostic

Date: 2026-08-13
Status: diagnostic completed; official Playwright pilot still blocked by the Codex macOS process sandbox

## Outcome

The six preregistered pilot rows were opened without labels, scores or cohort metadata. The first diagnostic exposed one shared collector defect: `TextEncoder` existed in the browser evaluation environment but was not constructible. No result from that failed attempt is treated as a capture.

Collector version `option-b-v3-minimal-local-pilot-2` replaces that dependency with a deterministic UTF-8 byte counter. The corrected run produced:

- attempted: 6;
- complete captures: 5;
- failed content eligibility: 1 (`DEV4-030`);
- privacy violations: 0;
- unknown outcome codes: 0;
- capture artifact: 2,581,312 bytes;
- attempt audit: 5,076 bytes.

The excluded page rendered only a minimal surface below the frozen 80-visible-character eligibility threshold. The threshold was not changed after observing the result.

## Review gates

Passed:

- artifact identity and attempt integrity;
- output privacy boundary;
- terminal-stage and outcome taxonomy;
- technical yield of at least five complete captures;
- artifact-size and attempt-duration limits.

Not passed:

- approved browser runtime;
- frozen 1440 × 900 viewport.

The Codex in-app browser reported a 1280 × 720 CSS viewport even after a 1440 × 900 override was requested. It also cannot claim the contract's repository-managed Playwright Chromium runtime, fresh anonymous context, or request-routing policy. The review therefore correctly reports `FIRST_RUN_TECHNICAL_REVIEW_FAILED` instead of promoting the diagnostic to an official pilot.

## Persisted artifacts

- `option_b_in_app_pilot_capture_v1.json`: derived geometry, computed-style, repetition and public-asset aggregates only;
- `option_b_in_app_pilot_attempt_audit_v1.json`: stage/outcome metadata only;
- `option_b_in_app_pilot_review_v1.json`: automated gate results.

The artifacts contain no target URLs, raw HTML, page text, screenshots, labels or model scores.

## Official local run

The pinned Chromium browser is already downloaded into the ignored `.playwright-browsers/` directory. From a normal macOS Terminal, run:

```bash
cd /Users/syousef/Documents/Codex/2026-08-07/noch-hier-erg-nzen-und-ein/VibeBench
npm run research:v0.5-option-b-v3-pilot-run
npm run research:v0.5-option-b-v3-pilot-review
```

The second command exits successfully only when every frozen first-run gate passes. A successful first run still does not unlock the 81-site batch: the same six rows and pinned runtime must be repeated after 24–72 hours and reviewed for feature drift and technical-outcome transitions.
