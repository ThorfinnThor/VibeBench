# VibeBench Option-B visible feature contract v2

Locked: 2026-08-13, before running the v2 outcome evaluation.

## Purpose

This contract defines a development-only, outside-in representation of the **visible Vibe-Footprint**. It transforms the already frozen 81 technically usable browser-surface scans into normalized structure, styling, content, quality, asset and delivery features.

It is not evidence of authorship, not a percentage of AI-generated code and not a security score. The 81 sites remain Development data; results produced from them are not independent validation.

## Information boundary

- Uses only aggregate values already captured from the rendered public page.
- Does not use hostname, URL, provenance, repository identity or project-family identity as a feature.
- Does not use direct Lovable, Bolt, Replit or v0 markers.
- Does not use framework/library markers such as React, Next.js, Vite, Tailwind, shadcn, Radix, Lucide or Framer.
- Restores count-like source values with `expm1` because the source matrix stores them as `log1p(count)`.
- Uses labels only after this contract and its formulas are frozen.

## Feature groups

The 28 fixed features cover:

- style-system reuse, density, responsive/interactive/effect shares and pattern breadth;
- semantic structure, section/div balance, data and ARIA density;
- content density, list depth, CTA and generic marketing-pattern shares;
- form-label coverage and public metadata/SEO completeness;
- vector/media balance and script/stylesheet delivery balance.

Exact formulas and source fields are executable in `lib/option-b-visible-feature-contract-v2.mjs` and serialized into `option_b_visible_feature_matrix_v2.json`.

## Known limitation

The frozen scans contain aggregate DOM counts rather than screenshots, computed styles, component trees or page-region embeddings. Therefore this version can test consistency and density **proxies**, but it cannot honestly measure pixel-level layout-template similarity, exact spacing/radius token consistency, component repetition or visual brand differentiation. Those require a future, preregistered rescan contract.

## Evaluation protocol fixed for the next step

- 20 deterministic, class-stratified five-fold Development assignments.
- Fold-local standardization and model fitting.
- One fixed logistic configuration (`l2 = 10`, learning rate `0.05`, 1,200 iterations); no model-family or feature-subset search.
- Binary benchmark reported at a fixed `0.50` orientation threshold; Precision and Recall remain descriptive Development metrics.
- Brier score, log loss and reliability bins reported with the explicit caveat that class-balanced logistic outputs are orientation scores, not calibrated probabilities.
- Indeterminate analysis fixed at score range `0.38–0.62`; report coverage and selective metrics rather than hiding abstentions.
- Deterministic ±5% count perturbation stress test; report score drift and qualitative-band changes. This is a simulation, not a substitute for repeat scans.
- No production promotion and no change to frozen v0.4 from this evaluation.
