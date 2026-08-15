# VibeBench roadmap

Updated: 2026-08-15

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

### 2. Prepare a corrected Option-B v4 collector before expanding

No additional website acquisition is planned for this phase.

The v3 two-run pilot remains a useful repeatability artifact, but the fifth audit
identified capture-surface, semantic and runtime-isolation gaps. Neither a
20-site nor an 81-site capture is approved with the v3 collector. A v4 contract
must be frozen and re-piloted first, without rewriting the v3 artifacts.

- isolate the browser in a disposable non-root runtime with an explicit egress policy;
- apply capture mutations before readiness and verify the same surface remains stable;
- define visibility, accessible role/name and active-font semantics precisely;
- exclude collector-injected CSS from page measurements;
- correct non-pixel CSS units and interactive-state rules;
- use linear-time repetition aggregation and positive payload validation.

Only after a new six-site repeat pilot passes may a fixed 20-site label-blind
technical expansion be considered. Keep hostname, URL, provenance and builder
declarations out of model features.

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

Option A is selected and implemented as a local minimal Playwright collector. The reduced pilot uses one desktop viewport, rendered DOM, computed typography/spacing/radius/layout styles and repetition signatures. It creates no screenshots and performs no color or mobile comparison. Two official label-blind runs completed 25.93 hours apart with the same pinned Chromium/runtime and the same five successes plus one content-ineligible page.

The 42-feature aggregate contract was frozen before derived evaluation and before any label join. All 210 paired stability checks passed their preregistered tolerances. This establishes pilot repeatability only; predictive usefulness, Precision/Recall improvement and the public score remain untested and production v0.4 remains unchanged. See `outputs/VIBEBENCH_OPTION_B_V3_DERIVED_FEATURE_STABILITY_2026-08-14.md`.

See:

- `outputs/development_v0_5_option_b/VIBEBENCH_OPTION_B_VISIBLE_FEATURE_CONTRACT_V2.md`
- `outputs/VIBEBENCH_OPTION_B_VISIBLE_RESEARCH_2026-08-13.md`

### Recommended next implementation order

1. **Completed:** use an ephemeral non-root Docker runtime on GitHub-hosted runners, with an internal-only collector network and a separate DNS/peer-pinning egress proxy.
2. **Completed:** freeze the Option-B v4 capture contract and corrected positive-schema collector. The local environment must not fall back to a non-isolated run when Docker is unavailable.
3. **Next:** run the six-site label-blind pilot as `run-1`, then repeat the same manifest, source fingerprints and base-image digests 24–72 hours later as `run-2`.
4. If the technical, privacy and stability gates pass, freeze a conservative 20-site expansion manifest; do not jump directly to 81.
5. Only after freezing capture and derived-feature hashes, join Development labels and test incremental usefulness, stability and cohort gaps.
6. Define and validate indeterminate semantics separately from scan breadth, then freeze a new independent Option-B holdout only after Development stabilizes.

The existing 82.4% Precision / 85.7% Recall confirmation is now explicitly a
`LEGACY_CAPTURE_COMPLETENESS_UNVERIFIABLE` result, not a current performance
claim. A fresh independent confirmation is deferred until the v4 Development
collector and derived features are stable. See
`outputs/VIBEBENCH_OPTION_B_V4_ISOLATION_DECISION_2026-08-15.md`.
