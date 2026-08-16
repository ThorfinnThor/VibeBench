# VibeBench Option-B v4 — 81-site technical extension

Date: 2026-08-16  
Workflow run: [31946987045](https://github.com/ThorfinnThor/VibeBench/actions/runs/31946987045)  
Artifact: `option-b-v4-extension-81` (`9263643942`)

## Decision

The fixed 81-site, label-blind Option-B v4 extension completed in the approved
isolated browser runtime. It is accepted as a technical capture and feature
research input. It does **not** change the production v0.4 model and it does
not create a new independent Precision/Recall claim.

## Technical result

- 81 attempts; 61 successful captures; 20 technical/non-eligible outcomes.
- Technical floor: 57 successful captures; **passed** (61/81 = 75.3%).
- No labels, builder declarations, URLs or page text were available to the
  collector during capture.
- The 20 failures remain non-classification outcomes: empty/interstitial pages,
  HTTP denial/error responses, one computed-style extraction failure and two
  unknown technical errors.
- Runtime: Chromium 139.0.7258.5, Playwright 1.54.2, ephemeral Linux,
  read-only root, non-root, `no-new-privileges`, all capabilities dropped,
  internal collector network and peer-pinning egress proxy.

## Artifact integrity and privacy

The downloaded artifact matched GitHub's reported digest:

```text
sha256:3b4f3832fc6e7105da21ee2ab219120a1a81b980e09ad90b643c1484dc549250
```

Capture hashes recorded by the reviewer:

```text
capture: 7d17270f736ec772667b3da7e5d46e1eac9fcc76747ecde9cb7f7cec0dee6681
audit:   c0f60b5b879a13c06bac8d2398cd0836d76e6b9c236b23d78ac5f92d8575ed4c
manifest: 570727dc060167bee834e403090df03cf9d325404fda50b4982b777285563b2d
```

The payload stores aggregate document/layout/style/repetition values only:
`urls_persisted=false`, `raw_html_persisted=false`, `text_persisted=false` and
`screenshots_created=false`.

## Derived feature research

After capture freeze, the 61 successful payloads were joined to the pre-existing
Development labels. The join is recorded in
`outputs/development_v0_5_option_b_v4/option_b_v4_derived_feature_matrix_v1.json`:

- 25 `STRONG_AI`, 36 `STABLE_HUMAN`;
- 38 fixed, finite, identity-free derived features;
- URLs, hostnames, titles, provenance, builder fields and page text are excluded.

The development-only cross-validation result is in
`outputs/development_v0_5_option_b_v4/option_b_v4_model_research_v1.json`.
The best of the preregistered development configurations was a logistic model
with threshold 0.52. Across 20 group-stratified five-fold assignments its
median Precision/Recall were 80.0%/80.0%; the 10th-percentile values were
76.0%/72.0%, and only 10/20 assignments met both 80% gates. No assignment met
both 90% gates. These are development estimates, not independent validation.

## What is final for customers

The live Research Beta remains on the previously frozen v0.4 production model
and its safety controls. The v4 collector and derived features are now a
reproducible research path, but are not silently promoted into production.
Promotion requires a separately frozen, untouched independent confirmation (or
an explicit decision to retain the prior result as legacy only).
