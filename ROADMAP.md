# VibeBench roadmap

Updated: 2026-08-13

This roadmap preserves the agreed product direction after dropping a rigid 90/90 Precision/Recall release target. Audit hardening takes precedence; model and product research resumes on the frozen Option-B Development set afterward.

## Current product objective

VibeBench is an outside-in website review tool with three deliberately separate outputs:

1. a qualitative 0–100 index for the strength of a **visible Vibe-Footprint**;
2. observable evidence explaining which public surface patterns influenced the result;
3. security and quality improvements that do not depend on proving how the website was authored.

The index is not a probability of AI use, a percentage of AI-generated code, or proof of authorship. Security findings never change the Vibe-Footprint.

## Next product and research sprint

### 1. Specify score and uncertainty semantics

- Keep qualitative orientation bands; do not call them calibrated probabilities.
- Define evidence completeness and low/medium/high result confidence.
- Define an indeterminate state for sparse or contradictory observable evidence.
- Validate stability under harmless page/build changes before changing public claims.

### 2. Improve observable features on the frozen 81-site Option-B set

No additional website acquisition is planned for this phase.

- component and section repetition;
- layout-template similarity;
- spacing, radius and design-token consistency;
- CTA and generic copy-pattern structure;
- icon and asset-graph consistency;
- placeholder/demo content;
- bundle and production-hygiene signals;
- visible brand differentiation.

Predefine the feature contract before evaluating it. Keep hostname, URL, provenance and builder declarations out of model features.

### 3. Replace the old success target with evidence-based gates

- repeated, leakage-safe Development evaluation;
- score calibration/reliability and per-band uncertainty;
- cohort and website-category stability;
- explanation correctness and useful abstention rate;
- repeat-scan stability;
- human review of whether explanations are understandable and actionable.

Precision and Recall remain reported for the binary benchmark, but there is no arbitrary requirement that both equal 90%.

### 4. Improve the result product

- larger, denser result hierarchy with the three most important findings first;
- explain evidence, confidence, impact and effort for each finding;
- keep Security, Design, Engineering, Accessibility and Content separate;
- add representative low/medium/high example reports;
- keep technical metrics and benchmark details in Methodology rather than the Hero;
- consider local comparison/export only after score and explanation semantics stabilize.

### 5. Independent validation only after Development stabilizes

- preregister a new independent Option-B holdout;
- freeze URLs, labels, feature contract, model and thresholds before opening results;
- never tune on the independent holdout;
- publish technical coverage, uncertainty and known cohort limits.

## Audit follow-up requiring an explicit decision

- Choose a network transport that can pin validated DNS answers and verify peer IPs in the deployed runtime.
- Choose a shared hosting-layer store/provider for caller and target rate limits, caching, in-flight coalescing and global concurrency.
- Decide whether to add a maintained IP-address classification dependency after dependency/security review.
- Choose a browser E2E stack and configure GitHub branch protection to require CI.
- Define privacy, retention and provider policy before external telemetry/alerting.
- Choose licensed bundled fonts or retain the declared external font origin.
- Design v0.5 deterministic asset selection, then retrain and validate before replacing frozen v0.4 behavior.

## Completed audit-hardening checkpoint

See:

- `outputs/VIBEBENCH_AUDIT_REVIEW_2026-08-12.md`
- `outputs/VIBEBENCH_AUDIT_IMPLEMENTATION_2026-08-12.md`

## Completed Option-B visible-feature checkpoint

The score-blind 28-feature v2 contract and its first fixed-protocol Development evaluation are complete. Production v0.4 remains unchanged.

- 81 technically usable of 169 attempted scans (47.9% technical yield);
- median repeated-Development Precision 76.7%, Recall 78.6% and ROC AUC 88.2%;
- fixed 0.38–0.62 indeterminate range abstains on a median 13.6% and raises decided-case Precision to 87.5%;
- material cohort gap remains: 69.2% median Precision on the existing cohort versus 82.4% on the expansion cohort;
- simulated ±5% aggregate-count perturbations are locally stable, but real repeat-scan stability is still unmeasured;
- only coefficient-direction-stable features may be candidates for benchmark explanations.

The product now also reports **Auswertungsbreite** (broad, standard or limited) from the actual public HTML/asset scan scope. It is explicitly separate from model confidence and does not alter the v0.4 score. Desktop and 390 px mobile result layouts were browser-tested with a real public scan.

The historical 169-row acquisition has now been audited separately. Technical yield was label- and cohort-dependent: 33.7% for Strong AI versus 61.6% for Stable Human, and 97.4% for the existing cohort versus 33.6% for the expansion cohort. Of 88 failures, 81 retain only an unresolved historical navigation-timeout reason. See `outputs/VIBEBENCH_OPTION_B_TECHNICAL_YIELD_AUDIT_2026-08-13.md`.

The label-blind v3 capture protocol is preregistered and validated. It fixes desktop/mobile viewports, readiness, terminal failure stages, ephemeral visual extraction, computed-style/layout/repetition payloads and repeat-scan timing. It is intentionally blocked from execution until the browser/worker architecture and privacy/retention policy are selected. See `outputs/development_v0_5_option_b_v3/VIBEBENCH_OPTION_B_CAPTURE_PROTOCOL_V3.md`.

See:

- `outputs/development_v0_5_option_b/VIBEBENCH_OPTION_B_VISIBLE_FEATURE_CONTRACT_V2.md`
- `outputs/VIBEBENCH_OPTION_B_VISIBLE_RESEARCH_2026-08-13.md`

### Recommended next implementation order

1. Define and validate indeterminate semantics separately from the now-shipped evidence-scope presentation; do not infer confidence from scan breadth alone.
2. Select the pinned browser/shared-worker architecture and approve privacy/retention so the preregistered v3 capture can be implemented.
3. Implement the v3 collector and run its contract tests before opening any target URL.
4. Run label-blind capture and real repeat scans, then freeze hashes before joining labels.
5. Freeze a new independent Option-B holdout only after the Development cohort gap is understood.
