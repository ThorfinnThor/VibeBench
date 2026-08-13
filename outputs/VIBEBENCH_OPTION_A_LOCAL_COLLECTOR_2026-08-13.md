# VibeBench Option A local collector

Date: 2026-08-13  
Status: implementation complete; browser binary setup pending; public pilot not yet opened

## Decision implemented

Option A keeps the live Vercel product and frozen v0.4 model unchanged. A separate local Playwright collector exists only for Option-B Development research.

The earlier maximal v3 proposal was reduced before collection:

- one desktop viewport at 1440 × 900;
- rendered DOM and computed styles;
- layout regions and normalized element geometry;
- component/structural repetition;
- typography, spacing, gap, radius, border and shadow consistency;
- no screenshot creation;
- no color/image analysis;
- no mobile/desktop comparison;
- no raw HTML, page text, response bodies or target URLs in capture outputs.

## Runtime

Playwright is pinned to `1.54.2`. The repository-managed Chromium build is installed locally into the ignored `.playwright-browsers/` directory:

```bash
npm run research:v0.5-option-b-v3-browser-setup
```

The collector refuses to silently select a changing system browser. An explicit `VIBEBENCH_CHROME_PATH` remains available for diagnosis, but the full batch requires the repository-managed build.

In the current restricted Codex execution environment, the Chromium CDN could not be resolved and macOS terminated the installed system Chrome when launched headlessly. Therefore no public pilot result is claimed. The code, manifest, contract and privacy boundary are complete and tested; the first actual collection waits for the one-time browser setup from a normal networked terminal.

## Label-blind pilot

The pilot manifest contains six deterministic rows selected from the 81 prior technical successes by the lowest SHA-256 of `sample_id + NUL + target_url`. Selection code never reads label, cohort, score or feature values.

The collector process receives exactly:

- `sample_id`
- `target_url`

Capture and attempt-audit outputs do not persist the target URL. Labels are not joined during the technical pilot.

## Safety and privacy

- DNS is checked for every requested HTTP(S) host, including subresources.
- Private, reserved and special IP addresses are blocked.
- Fresh anonymous context per page; cookies and service workers are not reused.
- Every attempt records its terminal stage and typed outcome.
- A recursive output guard rejects URL, label, cohort, raw text, HTML, image and screenshot fields before files are written.
- Structural signatures, computed-style signatures and CSS custom-property names are SHA-256 hashed.

## Commands

```bash
npm run research:v0.5-option-b-v3-pilot-build
npm run research:v0.5-option-b-v3-browser-setup
npm run research:v0.5-option-b-v3-pilot-run
```

The full 81-site run remains disabled by protocol until the six-site technical pilot is reviewed.

## Pilot review gates

Before expanding beyond six sites:

1. at least five of six targets must produce complete structural captures;
2. no output may violate the automated privacy boundary;
3. terminal failures must retain a specific stage and outcome;
4. no successful capture may silently omit the required payload groups;
5. payload size and collection duration must be acceptable for a local research run;
6. a second run 24–72 hours later must be compared before any label-based usefulness analysis.

Only after capture hashes are frozen may labels be joined to ask whether these extra features improve the visible Vibe-Footprint.
