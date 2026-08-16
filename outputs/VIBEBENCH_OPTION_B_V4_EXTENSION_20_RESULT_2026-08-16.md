# VibeBench Option-B-v4 20-Site Extension Result

Date: 2026-08-16  
Status: **TECHNICALLY ACCEPTED; MANUAL DEVELOPMENT REVIEW COMPLETE**  
Scope: frozen, label-blind Development acquisition only

## Result

The authorized fixed 20-site extension completed in the isolated Option-B-v4
collector with **20/20 successful captures and 0 failures**. The acceptance
floor was 14/20. All 20 payloads passed the positive v4 schema; the reviewer
reported no findings.

This result establishes technical acquisition yield for this frozen sample. It
does not measure classification quality, does not change the production v0.4
model and does not create a new Precision/Recall claim.

## Official accepted run

- GitHub Actions run: [31942912581](https://github.com/ThorfinnThor/VibeBench/actions/runs/31942912581)
- source commit: `37eb6cc70c518d4d13447620b8f57849a84a75ed`
- artifact ID: `9262534589`
- artifact name: `option-b-v4-extension-20`
- artifact SHA-256: `ba79bafe4f145e6e930304afd4fb34ae8f7012dbc73d22bc612cf7d2286f753e`
- capture SHA-256: `7381d89916e26c416cfc2b6fe947a4e8334dd488ffd1fd00e3f5005ac6f9266c`
- attempt-audit SHA-256: `36bb2888a91b79bfb8bffbf2186d239a6bad258967aaf3a0a79537cde31adb7b`
- manifest SHA-256: `54455908ad141c628af4c6345c3b4fdbd5908396278f7e5ac4492adfb22b616b`
- review status: `TECHNICAL_EXTENSION_ACCEPTABLE_MANUAL_REVIEW_REQUIRED`
- review findings: none

The downloaded ZIP matched the SHA-256 published by GitHub Actions.

## Isolation and privacy review

- Chromium `139.0.7258.5` from the official Playwright `1.54.2` container
- ephemeral Linux container, non-root, read-only root filesystem
- `no-new-privileges`, all Linux capabilities dropped
- collector had no direct public network route
- all outbound page traffic passed through the DNS/peer-pinning egress proxy
- identical frozen manifest, capture-contract and waiver hashes were present in
  the capture and attempt audit
- no target URL, hostname, label, provenance, screenshot, HTML or text-body key
  was present in the 20 stored payloads
- the attempt audit retained only bounded technical metadata and hashed resolved
  origins; it contained no target URLs or hostnames

Manual plausibility review found a real spread of public rendered pages rather
than empty uniform records: 86–2,000 visible elements, 96–3,632 DOM nodes and
859–48,687 visible-text characters. These are counts only; page text was not
stored.

## Corrected CI defect

The first workflow attempt, run
[31942608072](https://github.com/ThorfinnThor/VibeBench/actions/runs/31942608072),
also captured 20/20 sites successfully. Its reviewer nevertheless exited with
`attempt_identity_or_privacy` because one cardinality check still contained the
six-site pilot constant. The defect was confined to post-capture review logic:
the frozen manifest, collector, capture contract and captured records were not
changed.

Commit `37eb6cc70c518d4d13447620b8f57849a84a75ed` replaced that constant with the
already-derived `expectedAttempts` value and added a regression assertion. The
same frozen 20-site workflow was rerun from that commit and passed every step.

## Descriptive repeat note

The rejected reviewer attempt and accepted run used the same ordered 20 samples,
runtime version, manifest, contract, waiver, source fingerprints and base-image
digests. Both produced 20/20 successes. Thirteen payloads were byte-equivalent;
seven reflected ordinary live-page variation. This observation is descriptive
only and was not used to tune a model or invent a post-hoc pass threshold.

## Gate after this result

Completed:

1. isolated six-site Run 1;
2. accepted early six-site technical repeat with the explicit time-window waiver;
3. one deterministic, label-blind 20-site extension;
4. artifact-integrity, privacy, isolation, payload and technical-yield review.

Still prohibited without a new explicit protocol and decision:

- the 81-site acquisition;
- label joining before derived features and their executable hashes are frozen;
- production-model replacement;
- a new public Precision/Recall claim;
- treating the legacy confirmation as current evidence.

The next research step is an offline, label-blind derived-feature specification
and stability review of the accepted v4 captures. Customer beta operation does
not depend on that research step.
