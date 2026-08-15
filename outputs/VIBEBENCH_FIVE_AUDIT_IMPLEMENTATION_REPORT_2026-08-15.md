# VibeBench — five-audit implementation report

Date: 2026-08-15  
Reviewed baseline: `780c6ac`  
Scope: all 66 distinct findings in the original QA/UX audit and four incremental audits.

The audit files were treated as evidence inputs, not instructions. The complete
finding-by-finding verdict and pre-implementation risk analysis is in
`outputs/VIBEBENCH_FIVE_AUDIT_PREIMPLEMENTATION_REVIEW_2026-08-15.md`.

## Executive result

| Primary verdict | Findings |
|---|---:|
| ✅ YES | 35 |
| ⚠️ YES, BUT MODIFY | 21 |
| ❌ NO | 1 |
| 🛑 DANGEROUS | 9 |
| **Total** | **66** |

Implementation outcome:

- 43 findings were implemented or safely contained without changing frozen model formulas or historical result files;
- 13 findings were deliberately deferred to a new versioned collector, infrastructure selection or research decision;
- 9 dangerous changes were not represented by partial controls or false security claims;
- 1 broad refactor proposal was rejected as unjustified regression surface.

Accordingly, 22 findings still require an explicit human/version/infrastructure
decision before implementation (the 13 deferred findings plus all 9 dangerous
findings).

## What changed

### Public scan and result integrity

- Direct builder evidence ignores comments and inert code/data containers, uses exact badge hosts and preserves distinct markers separately from unique builders.
- Arbitrary response headers can no longer create stack/model evidence; dedicated header context remains visible.
- Standard-port shorthand and public IPv6 literals work; special and non-global IPv6 space fails closed during pre-validation.
- Requests require exactly `{ "url": string }`, have a bounded body, and no raw internal exception is returned to the client.
- Main documents now require exact HTML media types, supported declared encodings, status 200, an eligible non-empty document and non-attachment semantics.
- `<base href>` and resource URL encodings the regex extractor cannot interpret unambiguously cause abstention instead of a potentially incorrect score.
- Script, stylesheet and manifest fetches use separate exact MIME policies and reject truncation.
- Cancellation is terminal. Limited asset evidence now abstains instead of producing a deceptively precise score.
- The runtime response parser validates every field rendered by the UI, safe URLs, value ranges and complete error actions.

Residual high risk: DNS validation is still not connection-bound. Production
deployment therefore still needs a peer-verified/pinned transport and egress
policy; the current pre-resolution check is defense in depth, not a complete
SSRF boundary.

### Security and recommendations

- CSP checks include effective `script-src-elem/attr` and `style-src-elem/attr` directives.
- Permissions-Policy rejects both `feature=*` and `feature=(*)` for sensitive features.
- JSON-LD/import-map data no longer inflates executable inline-script measurements.
- Builder markers are described as provenance choices, not defects to remove for a better score.
- Source-string external-host dependency advice and the silent ten-item recommendation cap were removed.

### Client and UX

- Synchronous request identity, abort and stale-completion guards prevent overlapping scans from corrupting state.
- Retained results show their hostname while a replacement is pending or fails.
- Credential, HTTP 408/425, encoding, ineligible-document and insufficient-evidence outcomes have explicit actions.
- Skip-link focus is real, result focus is managed, and reduced-motion preferences disable smooth scrolling.
- The Hero says Research Beta; universal “strong” driver labels were removed; technical hints and byte values are localized.
- Precision/Recall remain in Methodology and Wilson intervals come from `release/v0.4.json`.
- Asset scope distinguishes discovered, selected and fetched resources; the UI no longer says asset coverage does not affect the score.

### Confirmation and research integrity

- A new integrity reconstruction verifies artifact hashes, exact/unique ID sets, labels, 50/50 balance, probabilities, stored predictions, the frozen threshold and technical totals.
- The reconstructed performance remains Precision 82.35%, Recall 85.71%, but all 99 successful legacy rows lack explicit stream-completeness evidence. The new status is therefore `LEGACY_CAPTURE_COMPLETENESS_UNVERIFIABLE`, not a promoted validation claim.
- The original frozen result files were not edited. New evidence is stored separately in the two `integrity_reconstruction` artifacts.
- Prospective confirmation checkpoints use serialized atomic writes, cumulative attempt history and terminal failures that are not retried after restart.
- The frozen v0.4 manifest builder now refuses overwrite. A future version uses opaque HMAC IDs, label-independent order and explicit `UNVERIFIED_NEGATIVE_PRE_CUTOFF_ORIGIN_PROXY` language.
- The prospective scanner rejects cross-domain sample-identity changes and truncated main/asset bodies.
- Option-B derived ingestion now validates relational payload invariants before the unchanged frozen formula builder runs.
- Option-B v3 artifacts remain immutable. The 20/81 expansion is blocked until a corrected v4 collector and isolated repeat pilot exist.

### Historical builds and CI

- Historical `sample_id` values have a strict allowlist and every work/snapshot/lock path is checked for root containment before deletion or writing.
- The historical Docker image defaults to UID/GID 10001. This reduces impact but does not replace a rootless disposable sandbox, mount/capability limits or egress policy.
- GitHub Actions are pinned to the verified full commits for checkout v4.2.2 and setup-node v4.4.0; Dependabot watches GitHub Actions weekly.

Official commit verification:

- https://github.com/actions/checkout/commit/11bd71901bbe5b1630ceea73d27597364c9af683
- https://github.com/actions/setup-node/commit/49933ea5288caeca8642d1e84afbd3f7d6820020

## Regression verification

- `npm test`: **103/103 passed**.
- `npm run lint`: passed.
- `npm run build`: passed with Next.js production compilation, TypeScript and static generation.
- `git diff --check`: passed.
- Real browser, desktop: initial semantics and Methodology metadata rendered correctly.
- Real browser, error flow: credential URL returned the specific 400 outcome, focused the result region, retained the Request ID and exposed no raw detail.
- Real browser, mobile 390×844: no horizontal overflow; input and result content remained usable.
- Real browser, successful flow: `example.com` produced a complete score result, displayed the analyzed hostname, focused results and had no mobile overflow.

Expected non-pass audit command:

- `npm run confirmation:v0.4-evaluate` exits 1 after writing the reconstruction because 99 legacy successes cannot prove body-stream completeness. This is the intended integrity gate, not a code regression.

## Per-finding implemented disposition

The table below accounts for every implemented or safely contained finding. All
test references mean the final 103-test suite plus the more specific check
shown; no frozen model/result artifact was rewritten.

| Finding | Changes made and why | Exact primary files | Verification |
|---|---|---|---|
| VB-P1-01 | Removed the false claim that asset scope cannot affect the score; exposed discovered/selected/fetched scope and abstained when selected evidence is materially incomplete. | `app/page.tsx`, `lib/evidence-coverage.mjs`, `app/api/scan/route.js` | Coverage contract tests; successful browser scan. |
| VB-P1-02 | Excluded comments and inert code/data containers from direct DOM evidence while retaining structured visible markers. | `lib/analyze-html.mjs`, `tests/analyze-html.test.mjs` | Inert-markup negative regressions. |
| VB-P1-03 | Evaluated effective CSP element/attribute directives and both Permissions-Policy wildcard syntaxes. | `lib/production-v0_4-features.mjs`, `tests/production-v0_4-features.test.mjs` | Explicit no-false-pass tests. |
| VB-P2-01 | Added synchronous request sequence, abort and stale-completion guards. | `app/page.tsx` | TypeScript/build; browser error/success flows. |
| VB-P2-02 | Retained prior result hostname and labeled replacement/failure state. | `app/page.tsx`, `app/globals.css` | Browser result/focus inspection; mobile check. |
| VB-P2-03 | Added a specific non-retryable credential URL outcome. | `lib/result-presentation.mjs`, `tests/result-presentation.test.mjs` | Unit test and real browser/API 400 flow. |
| VB-P2-04 | Required complete renderable error fields. | `lib/scan-contract.mjs`, `tests/audit-hardening.test.mjs` | Complete/partial contract fixtures. |
| VB-P2-05 | Failed closed on `<base href>` for frozen v0.4 instead of silently changing its asset semantics. | `lib/scan-response-policy.mjs`, `app/api/scan/route.js`, `tests/audit-hardening.test.mjs` | Base-URL rejection regression. |
| VB-P2-06 | Accepted declared UTF-8/ASCII and abstained on unsupported declared encodings. | `lib/scan-response-policy.mjs`, `app/api/scan/route.js`, `tests/audit-hardening.test.mjs` | Charset regressions. |
| VB-P2-08 | Recast builder markers as low-priority provenance decisions, not score-gaming advice. | `lib/production-v0_4-features.mjs`, `tests/production-v0_4-features.test.mjs` | Recommendation semantics regression. |
| VB-P3-01 | Bounded the request, enforced exact `{url}` shape and removed raw client error detail. | `app/api/scan/route.js`, `lib/scan-response-policy.mjs`, `app/page.tsx` | Request-shape tests; browser confirms no raw detail. |
| VB-P3-04 | Made skip target focusable and honored reduced-motion preference. | `app/page.tsx`, `app/globals.css` | Build and browser focus inspection. |
| VB-P3-05 | Clarified that v0.4 is the frozen model/release line behind a public adapter. | `README.md`, `ROADMAP.md` | Documentation cross-check. |
| VB2-P1-01 | Removed arbitrary header values from stack matching; kept dedicated header context. | `lib/analyze-html.mjs`, `tests/analyze-html.test.mjs` | Header-poisoning regression. |
| VB2-P1-03 | Required exact HTML MIME, 200, non-attachment and meaningful non-interstitial content before scoring. | `lib/scan-response-policy.mjs`, `lib/content-quality.mjs`, `app/api/scan/route.js` | Document/interstitial tests. |
| VB2-P2-02 | Validated safe URLs, ranges, arrays and every success field rendered by the UI. | `lib/scan-contract.mjs`, `tests/audit-hardening.test.mjs` | Full success fixture plus missing-field rejection. |
| VB2-P2-03 | Allowed correctly decoded lowercase `&amp;` and abstained on unsupported numeric/named resource entities. | `lib/scan-response-policy.mjs`, `lib/extract-assets.mjs`, `tests/audit-hardening.test.mjs` | Positive/negative entity regressions. |
| VB2-P2-04 | Counted only executable inline scripts and removed source-text external-host advice. | `lib/portable-page-metrics.mjs`, `lib/production-v0_4-features.mjs`, `tests/audit-integrity-regressions.test.mjs` | JSON-LD/import-map and recommendation tests. |
| VB2-P2-06 | Removed silent ten-item recommendation truncation. | `lib/production-v0_4-features.mjs`, `tests/production-v0_4-features.test.mjs` | More-than-ten finding regression. |
| VB2-P2-07 | Replaced the validation Hero claim with precise Research-Beta wording. | `app/page.tsx` | Browser DOM inspection. |
| VB2-P3-01 | Recognized host shorthand with ports 80/443 before scheme detection. | `lib/public-url-policy.mjs`, `tests/audit-hardening.test.mjs` | Both standard-port regressions. |
| VB2-P3-02 | Removed universal “strong” badges from score drivers. | `app/page.tsx` | Browser DOM and production build. |
| VB2-P3-03 | Read Wilson intervals from the release manifest. | `app/page.tsx` | Browser confirms 69.7–90.4 and 73.3–92.9. |
| VB2-P3-04 | Localized structural hints, formatted bytes and removed a nonexistent support instruction. | `app/page.tsx` | Browser DOM and mobile result inspection. |
| VB3-P1-01 | Resolved badges as URLs and enforced exact/allowed-subdomain hosts without credentials. | `lib/analyze-html.mjs`, `tests/analyze-html.test.mjs` | Deceptive host/userinfo/query regressions. |
| VB3-P1-02 | Default-denied non-global IPv6 and blocked current special prefixes. | `lib/public-url-policy.mjs`, `tests/audit-hardening.test.mjs` | Special/global IPv6 matrix. |
| VB3-P2-01 | Rechecked the combined abort signal after main and asset phases. | `app/api/scan/route.js` | Build and browser cancellation-compatible flow. |
| VB3-P2-02 | Separated discovered, selected, ignored and fetched assets through API and UI. | `lib/extract-assets.mjs`, `lib/evidence-coverage.mjs`, `app/api/scan/route.js`, `app/page.tsx` | 30-discovered/6-selected regression. |
| VB3-P2-03 | Applied distinct exact MIME policies to scripts, stylesheets and manifests, rejecting truncation. | `app/api/scan/route.js`, `lib/scan-response-policy.mjs` | Policy tests and successful public scan. |
| VB3-P2-04 | Classified IP literals directly instead of sending bracketed IPv6 through DNS lookup. | `app/api/scan/route.js`, `lib/public-url-policy.mjs` | IPv6 policy tests; production build. |
| VB3-P2-05 | Serialized atomic checkpoints and preserved terminal attempt history prospectively. | `scripts/run-confirmation-v0_4.mjs` | Syntax check; frozen final-result guard remains active. |
| VB3-P2-06 | Required exact unique IDs, valid labels/balance, recomputed predictions and consistent totals. | `lib/confirmation-v0_4-integrity.mjs`, `scripts/evaluate-confirmation-v0_4.mjs` | Integrity inconsistency tests and 100-row reconstruction. |
| VB3-P2-07 | Kept v3 immutable and blocked expansion until a corrected v4 collector repeats the pilot. | `ROADMAP.md`, `outputs/development_v0_5_option_b_v3/VIBEBENCH_OPTION_B_CAPTURE_PROTOCOL_V3.md` | Protocol/artifact cross-check. |
| VB3-P3-01 | Preserved distinct marker records and exposed unique builder count separately. | `lib/analyze-html.mjs`, `app/page.tsx`, `tests/analyze-html.test.mjs` | Four-markers/one-builder regression. |
| VB3-P3-02 | Classified HTTP 408/425 as retryable temporary target states. | `lib/result-presentation.mjs`, `tests/result-presentation.test.mjs` | Status-specific regressions. |
| VB4-P1-02 | Made prospective main/asset reads explicitly bounded and generated a separate legacy completeness audit. | `lib/development-v0_3-page-scan.mjs`, `scripts/evaluate-confirmation-v0_4.mjs`, the two `integrity_reconstruction` outputs | Syntax/tests; expected legacy gate exit 1. |
| VB4-P2-01 | Recomputed classifications from probability and frozen threshold and rejected disagreement. | `lib/confirmation-v0_4-integrity.mjs`, `tests/audit-integrity-regressions.test.mjs` | Stored-classification tamper test. |
| VB4-P2-07 | Added positive relational validation at official derived-matrix ingestion without modifying the frozen formula file. | `lib/option-b-v3-derived-payload-validation-v1.mjs`, `scripts/build-development-v0_5-option-b-v3-derived-pilot-features.mjs` | Real five-row validation and three corruption tests. |
| VB5-P1-03 | Renamed the future negative stratum as an unverified origin proxy and recorded the estimand/label limitation. | `scripts/build-confirmation-v0_4-manifest.mjs`, `ROADMAP.md` | Syntax check; frozen v0.4 overwrite guard. |
| VB5-P1-05 | Rejected cross-domain redirects prospectively, allowing only canonical `www` alias normalization. | `lib/development-v0_3-page-scan.mjs` | Syntax/test suite and immutable old results. |
| VB5-P1-06 | Added opaque HMAC IDs and label-independent ordering to the future manifest contract. | `scripts/build-confirmation-v0_4-manifest.mjs` | Syntax check; immutable package guard. |
| VB5-P2-01 | Validated sample IDs and resolved containment before work/snapshot/lock deletion or write. | `vibebench_snapshot_builder.py`, `tests/audit-integrity-regressions.test.mjs` | Python compile and traversal regressions. |
| VB5-P2-02 | Pinned official actions to full verified SHAs and enabled weekly action updates. | `.github/workflows/ci.yml`, `.github/dependabot.yml`, `tests/audit-integrity-regressions.test.mjs` | Full-SHA invariant test. |

## Explicitly deferred findings requiring a human/version decision

| Findings | Decision and recommended direction |
|---|---|
| VB-P2-07 | Route/contract coverage and manual browser E2E exist; choose the deterministic browser fixture/runner, then require it in branch protection. |
| VB-P3-03 | Confirm font license/privacy preference before self-hosting; retaining the disclosed external origin is safer than copying an unverified asset. |
| VB3-P3-03 | Define focusability/disabled semantics in Option-B v4 and repeat the pilot. |
| VB4-P2-02 through VB4-P2-06 | Freeze one new v4 capture surface covering readiness, roles/names, visibility, active-font semantics and positive privacy schema. |
| VB4-P3-01 through VB4-P3-03 | Implement linear sibling aggregation, correct CSS units and top-level cleanup only in that new collector version. |
| VB5-P1-04 | Approve a matched dataset and preregistered estimand; do not tune the existing result post hoc. |
| VB5-P2-03 | Choose the isolated historical-build runtime first, then pin base-image digest and toolchain/lockfile provenance inside that boundary. |

## Rejected and dangerous findings

- **Rejected — VB-P3-02:** the broad module refactor does not fix a current defect and would increase regression surface across UI and model plumbing.
- **Dangerous — VB-P1-04:** DNS/connection TOCTOU; requires peer-bound transport and egress controls.
- **Dangerous — VB-P1-05:** distributed abuse controls; requires a shared provider, privacy/retention policy and explicit failure mode.
- **Dangerous — VB-P2-09:** nonce/hash CSP migration can break Next.js hydration and requires deployed browser testing.
- **Dangerous — VB2-P1-02:** source/OOD feature clipping or removal requires preregistration, retraining and independent validation.
- **Dangerous — VB2-P2-01:** removing hosting features changes the frozen model and its performance claims.
- **Dangerous — VB2-P2-05:** changing mixed API units is a breaking v2 contract decision.
- **Dangerous — VB4-P1-01:** browser flags are not a sandbox; an operator must choose a disposable/rootless runtime and egress firewall.
- **Dangerous — VB5-P1-01:** research fetchers need the same peer-bound transport/egress boundary; another DNS precheck would overstate security.
- **Dangerous — VB5-P1-02:** non-root Docker is only defense in depth; untrusted historical builds still require disposable isolation, restricted mounts/capabilities and resource/network budgets.

## Changed-file groups

- App/API: `app/api/scan/route.js`, `app/page.tsx`, `app/globals.css`.
- Public scanner libraries: `lib/analyze-html.mjs`, `lib/content-quality.mjs`, `lib/evidence-coverage.mjs`, `lib/extract-assets.mjs`, `lib/portable-page-metrics.mjs`, `lib/production-v0_4-features.mjs`, `lib/public-url-policy.mjs`, `lib/result-presentation.mjs`, `lib/scan-contract.mjs`, `lib/scan-response-policy.mjs`.
- Research integrity: `lib/confirmation-v0_4-integrity.mjs`, `lib/development-v0_3-page-scan.mjs`, `lib/option-b-v3-derived-payload-validation-v1.mjs`, the three confirmation scripts and the Option-B derived builder script.
- Historical/CI: `vibebench_snapshot_builder.py`, `Dockerfile.vibebench-historical`, `.github/workflows/ci.yml`, `.github/dependabot.yml`.
- Governance: `README.md`, `ROADMAP.md`, Option-B v3 protocol and the two five-audit reports.
- Regression coverage: seven existing test files plus `tests/audit-integrity-regressions.test.mjs`.

## Human decisions still required

1. Select a production transport that pins validated DNS answers and verifies the connected peer, plus deployment egress controls.
2. Select a shared rate-limit/cache/coalescing/concurrency store and approve privacy/retention behavior.
3. Decide whether and how to migrate the Next.js application to a nonce/hash CSP after deployed browser validation.
4. Select a disposable/rootless browser and historical-build sandbox with mounts, capabilities, CPU/memory/time limits and egress policy.
5. Decide whether the legacy independent confirmation must be rerun before continuing to cite its Precision/Recall as a primary claim.
6. Approve a new matched/preregistered dataset and estimand if `HUMAN` is meant to describe verified current authorship rather than an origin proxy.
7. Choose a licensed bundled font or retain the disclosed external font origin.
8. Design an API v2 compatibility period before changing units or breaking the v1 contract.

## Remaining implementation order

1. Freeze the Option-B v4 collector contract only after decision 4.
2. Implement its corrected capture surface, positive privacy schema and linear aggregation, then run a new two-run six-site pilot.
3. Add deterministic browser E2E to CI and make it a required branch-protection check.
4. Implement the peer-bound public/research transport and shared abuse controls after decisions 1 and 2.
5. Resolve the confirmation-rerun and dataset/estimand decisions before any new performance claim.
6. Only then consider a frozen 20-site Option-B expansion; do not jump directly to the 81-site batch.
