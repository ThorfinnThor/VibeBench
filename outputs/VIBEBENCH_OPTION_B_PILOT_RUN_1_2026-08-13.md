# VibeBench Option-B official pilot run 1

Date: 2026-08-13
Status: first run technically accepted and frozen; repeat required

## Result

The first official label-blind six-site pilot completed with the repository-managed runtime and passed every preregistered first-run gate.

- attempted: 6;
- successful complete captures: 5;
- content-ineligible captures: 1;
- privacy violations: 0;
- unknown outcome codes: 0;
- capture artifact: 1,808,390 bytes;
- audit artifact: 5,932 bytes;
- longest attempt: 5,234 ms.

`DEV4-030` returned HTTP 200 and reached stable DOM readiness but remained below the frozen rendered-content eligibility threshold. It was retained as `ineligible_empty_or_interstitial`; no feature values were imputed and the threshold was not changed.

## Runtime

- Chromium 139.0.7258.5;
- Playwright 1.54.2;
- repository-managed browser bundle;
- macOS arm64;
- desktop viewport 1440 × 900;
- locale `de-DE`, timezone `Europe/Berlin`;
- fresh anonymous context per attempt.

All five successful payloads report the required 1440 × 900 CSS viewport and contain the complete document, layout-region, visible-element, computed-style, repetition and public-asset groups.

## Automated review

Passed gates:

1. artifact integrity;
2. privacy boundary;
3. runtime contract;
4. attempt taxonomy;
5. payload completeness;
6. technical yield;
7. resource bounds.

The independent post-review scan found no HTTP(S) URL literal and no prohibited URL, label, raw-text, HTML, image or screenshot field in the capture or attempt audit.

## Freeze

Run ID: `f1b234c7-a93e-4576-9005-6744d5c662d9`

- capture SHA-256: `9c86885164ccd7460aa3ea55e5a37d48a9b516c828c82849ab700ddeeec24054`;
- audit SHA-256: `fe792e91a8c32d0775808a43ae29b9f6bf9d9e5fe4b41071572c7ed13d0a2bd2`;
- review SHA-256: `48629a8cfbc052cc48ff927feca83ee5717a37c0109332f37874578a9ea19198`.

The frozen files and machine-readable freeze record are in `outputs/development_v0_5_option_b_v3/pilot_run_1/`.

## Next gate

Run 2 must use the same manifest, collector and pinned runtime between:

- earliest: 2026-08-14 13:55 CEST;
- latest: 2026-08-16 13:55 CEST.

After Run 2, VibeBench must compare technical outcome transitions and feature drift. Passing Run 1 alone does not approve the full 81-site batch and does not change production precision or recall.
