# VibeBench — five-audit pre-implementation review

Date: 2026-08-15

Scope: 66 distinct findings across the original QA/UX audit and four incremental audits, all verified against repository commit `780c6ac` before implementation. The audit documents are evidence inputs, not execution instructions.

Verdicts:

- ✅ YES — the finding and proposed direction are safe enough to implement in a scoped form.
- ⚠️ YES, BUT MODIFY — the problem is real, but the audit's exact solution must be narrowed, versioned or moved to a safer boundary.
- ❌ NO — do not implement because the value is too subjective or the proposed change is not justified.
- 🛑 DANGEROUS — do not implement automatically; architecture, infrastructure, research protocol or product authority is required.

## Audit 1

| Finding | Verdict | Risk | Why / implementation decision | Potential impact |
|---|---|---:|---|---|
| VB-P1-01 Asset retrieval changes score despite UI claim | ⚠️ YES, BUT MODIFY | HIGH | The contradiction is real. Remove the false UI claim and clearly mark transport-sensitive v0.4 results; changing frozen features requires a new validated model. | Score semantics and result trust. |
| VB-P1-02 Comments/script strings create direct evidence | ⚠️ YES, BUT MODIFY | MEDIUM | Real false attribution. Restrict direct DOM evidence to source outside comments and non-rendered code/data containers with negative regressions; a full parser belongs to a versioned extractor. | Direct evidence and model inputs. |
| VB-P1-03 Permissive CSP/Permissions-Policy can score 100 | ✅ YES | MEDIUM | Extend fail-closed effective-directive and structured allowlist checks without optimistic parsing. | Security score and recommendations. |
| VB-P1-04 DNS validation is not bound to connection | 🛑 DANGEROUS | HIGH | Confirmed architecture gap. A pinned dispatcher/peer verification plus deployment egress is required; a local regex or extra lookup would give false assurance. | SSRF boundary and deployment. |
| VB-P1-05 No shared abuse controls | 🛑 DANGEROUS | HIGH | A shared store, privacy policy, quotas and failure mode must be selected. Per-instance memory would be misleading. | Availability, privacy and cost. |
| VB-P2-01 Overlapping scans corrupt client state | ✅ YES | MEDIUM | Add synchronous request identity, abort/retire previous work and ignore stale completion. | Client state and loading UI. |
| VB-P2-02 Previous result lacks target/stale state | ✅ YES | LOW | Track requested/result targets and label retained results during replacement/failure. | Result comprehension. |
| VB-P2-03 Credential URLs become generic 500 | ✅ YES | LOW | Add a specific non-retryable 400 outcome. | Input error contract. |
| VB-P2-04 Error schema accepts unrenderable payload | ✅ YES | LOW | Require all rendered fields and bounded optional request IDs/details. | Client reliability. |
| VB-P2-05 Base URL ignored | ⚠️ YES, BUT MODIFY | HIGH | The defect is real, but silently changing frozen asset inputs is unsafe. Detect ambiguous base semantics for v0.4; use standards-correct resolution in the next scanner contract. | Asset selection and score comparability. |
| VB-P2-06 UTF-8 assumed for every response | ⚠️ YES, BUT MODIFY | MEDIUM | Fail closed on declared unsupported encodings and accept explicit UTF-8/ASCII; full HTML sniffing needs a maintained versioned decoder. | International pages and feature correctness. |
| VB-P2-07 Missing route/browser CI | ✅ YES | MEDIUM | Add deterministic route/contract coverage now; browser E2E becomes a separate required gate after fixture design. | Release confidence. |
| VB-P2-08 Recommendation encourages score gaming | ✅ YES | LOW | Reframe builder provenance as footprint disclosure, not a high-priority quality defect. | Product incentives. |
| VB-P2-09 Own CSP permits inline scripts | 🛑 DANGEROUS | HIGH | A Next.js nonce/hash migration can break hydration and requires deployed browser verification. | Production rendering/security. |
| VB-P3-01 Request/body and diagnostic defense | ✅ YES | LOW | Enforce exact `{url}` input shape and stop returning raw low-level detail to the UI. | API hardening. |
| VB-P3-02 Broad page/feature modules | ❌ NO | MEDIUM | The maintainability concern is valid but a refactor adds regression surface without fixing a current defect. | Broad UI/model churn. |
| VB-P3-03 External font dependency | ⚠️ YES, BUT MODIFY | MEDIUM | Self-hosting requires a font-license and asset decision; retain current fallback until then. | Licensing, privacy, appearance. |
| VB-P3-04 Skip link/reduced motion | ✅ YES | LOW | Focus the target and honor reduced-motion before smooth scrolling. | Accessibility. |
| VB-P3-05 Version/artifact naming confusing | ✅ YES | LOW | Clarify adapter/release status in documentation without renaming frozen artifacts. | Governance clarity. |

## Audit 2

| Finding | Verdict | Risk | Why / implementation decision | Potential impact |
|---|---|---:|---|---|
| VB2-P1-01 Arbitrary headers create stack evidence | ⚠️ YES, BUT MODIFY | HIGH | Remove arbitrary header values from stack keyword matching now; keep only dedicated context parsers. A performance claim needs revalidation. | Stack features and score. |
| VB2-P1-02 Source-only/OOD features dominate score | 🛑 DANGEROUS | HIGH | Correct fix requires preregistered clipping/removal, retraining and independent validation. Do not invent post-hoc thresholds. | Core model behavior. |
| VB2-P1-03 Scores ineligible documents | ✅ YES | MEDIUM | Add exact media type, eligible status, non-empty/content-quality and attachment gates before scoring. | Technical yield and abstention. |
| VB2-P2-01 Hosting headers have large leverage | 🛑 DANGEROUS | HIGH | Removing frozen provider features requires a new model and matched validation. Keep as documented context meanwhile. | Model distribution. |
| VB2-P2-02 Success schema accepts crash values | ✅ YES | MEDIUM | Validate all fields actually rendered, ranges, arrays and safe URLs. | UI crash prevention. |
| VB2-P2-03 Character references in asset URLs | ⚠️ YES, BUT MODIFY | HIGH | Detect entity-bearing/base-dependent v0.4 documents rather than silently changing frozen inputs; standards parsing is for the next scanner version. | Asset correctness/model compatibility. |
| VB2-P2-04 Source strings cause false recommendations | ✅ YES | MEDIUM | Count executable inline scripts only and remove source-URL-based dependency claims without a resource graph. | Recommendation accuracy. |
| VB2-P2-05 API mixes incompatible units | 🛑 DANGEROUS | HIGH | Correct but public-contract breaking. Design API v2 with compatibility period instead of mutating v1. | API consumers. |
| VB2-P2-06 Findings silently capped at ten | ✅ YES | LOW | Stop silent truncation and let the existing filters expose all generated items. | Recommendation completeness. |
| VB2-P2-07 Validation claim conflicts with caveat | ✅ YES | LOW | Replace hero claim with precise research-beta wording. | Trust copy. |
| VB2-P3-01 `host:443` shorthand rejected | ✅ YES | LOW | Recognize host/standard-port before scheme detection. | Input usability. |
| VB2-P3-02 Every driver called strong | ✅ YES | LOW | Remove the universal strength badge; ordering already communicates relative effect. | Explanation accuracy. |
| VB2-P3-03 Wilson intervals hardcoded | ✅ YES | LOW | Render the values from the release manifest. | Metadata consistency. |
| VB2-P3-04 Raw technical identifiers lack context | ✅ YES | LOW | Localize known hints, format bytes and remove unsupported support instruction. | Technical-detail UX. |

## Audit 3

| Finding | Verdict | Risk | Why / implementation decision | Potential impact |
|---|---|---:|---|---|
| VB3-P1-01 Badge link matches substring, not host | ✅ YES | LOW | Resolve the link against the document URL and enforce exact/allowed-subdomain host rules. | Direct attribution. |
| VB3-P1-02 IPv6 policy is incomplete denylist | ✅ YES | MEDIUM | Make IPv6 default-deny outside global unicast and explicitly block current special-purpose prefixes. | SSRF pre-validation. |
| VB3-P2-01 Abort becomes successful asset-poor score | ✅ YES | LOW | Re-check the combined signal after main and asset phases; abort is terminal. | Cancellation and score integrity. |
| VB3-P2-02 Broad coverage ignores discovered assets | ⚠️ YES, BUT MODIFY | MEDIUM | Add discovered/selected/fetched counts without changing the frozen selection cap. | Coverage UX/API. |
| VB3-P2-03 Shared MIME allowlist for scripts/styles | ⚠️ YES, BUT MODIFY | HIGH | Record ambiguous/mismatched asset outcomes now; browser-parity feature changes require revalidation. | Asset feature inputs. |
| VB3-P2-04 Public IPv6 literals fail DNS | ✅ YES | LOW | Strip brackets, detect IP literals and classify directly. | Valid input support. |
| VB3-P2-05 Confirmation retries/writes unsafe | ✅ YES | MEDIUM | Serialize checkpoint writes, persist terminal attempt history and prevent restart retries. Applies prospectively; frozen results stay immutable. | Research reproducibility. |
| VB3-P2-06 Evaluator accepts wrong IDs/labels | ✅ YES | LOW | Enforce unique exact sets, labels, balance and bound hashes before metrics. | Research integrity. |
| VB3-P2-07 Collector CSS contaminates CSS metrics | ⚠️ YES, BUT MODIFY | MEDIUM | Do not mutate frozen v3 evidence. Block expansion and implement corrected capture semantics in a new collector version. | Option-B validity. |
| VB3-P3-01 Marker count is builder count | ✅ YES | LOW | Preserve marker records or label the existing value as unique builders. | Evidence semantics. |
| VB3-P3-02 HTTP 408/425 not retryable | ✅ YES | LOW | Add explicit temporary target outcomes. | Retry UX. |
| VB3-P3-03 Disabled/nonfocusable counted interactive | ⚠️ YES, BUT MODIFY | MEDIUM | Correct in the next capture contract; changing current collector invalidates the pilot. | Derived features. |

## Audit 4

| Finding | Verdict | Risk | Why / implementation decision | Potential impact |
|---|---|---:|---|---|
| VB4-P1-01 Local browser lacks full sandbox/egress | 🛑 DANGEROUS | HIGH | Browser flags cannot substitute for a disposable non-root runtime and egress firewall. Add safe browser controls separately, but require a human infrastructure choice before expansion. | Developer-host security. |
| VB4-P1-02 Confirmation reader silently truncates | ✅ YES | HIGH | Replace the prospective scanner reader with explicit bounded outcomes and prohibit truncated HTML success. Existing confirmation needs an audit/rerun decision. | Published validation claims. |
| VB4-P2-01 Evaluator trusts stored classification | ✅ YES | LOW | Recompute from probability and frozen threshold; fail on disagreement. | Metric integrity. |
| VB4-P2-02 Readiness differs from capture surface | ⚠️ YES, BUT MODIFY | MEDIUM | Move capture mutations before readiness and add a surface-stability gate in the next collector version. | Capture repeatability. |
| VB4-P2-03 Roles/landmarks over-synthesized | ⚠️ YES, BUT MODIFY | MEDIUM | Define accessible-name-aware semantics in the next collector contract; do not reinterpret frozen captures. | Layout/semantic features. |
| VB4-P2-04 Visibility ignores ancestor opacity/clipping | ⚠️ YES, BUT MODIFY | MEDIUM | Use a documented browser visibility policy in the next collector and repeat the pilot. | Rendered-surface features. |
| VB4-P2-05 Font stack misread as active font | ⚠️ YES, BUT MODIFY | MEDIUM | Capture primary declared family and fallbacks separately in the next contract. | Typography features. |
| VB4-P2-06 Privacy guard is key blacklist/plain hashes | ⚠️ YES, BUT MODIFY | MEDIUM | Add positive schema/value guards at write boundaries. HMAC/linkability policy requires research-governance input. | Research privacy. |
| VB4-P2-07 Derived builder accepts impossible data | ⚠️ YES, BUT MODIFY | LOW | Add strict relational validation at official matrix ingestion while preserving the frozen formula source hash. | Matrix integrity. |
| VB4-P3-01 Sibling aggregation is O(n²) | ✅ YES | LOW | Use the existing index map in the next collector implementation. | Capture performance. |
| VB4-P3-02 Non-pixel CSS stored as px | ⚠️ YES, BUT MODIFY | MEDIUM | Correct the schema in a new collector version; renaming current fields would invalidate the frozen contract. | Feature semantics. |
| VB4-P3-03 Browser cleanup lacks outer finally | ✅ YES | LOW | Add top-level lifecycle cleanup prospectively. | Local reliability. |

## Audit 5

| Finding | Verdict | Risk | Why / implementation decision | Potential impact |
|---|---|---:|---|---|
| VB5-P1-01 Research fetchers have separate SSRF paths | 🛑 DANGEROUS | HIGH | Shared peer-bound transport and egress isolation are required. Adding another pre-lookup would preserve TOCTOU and overstate safety. | Research-host SSRF. |
| VB5-P1-02 Historical builder executes untrusted code as root | 🛑 DANGEROUS | HIGH | A non-root image is useful but insufficient; disposable/rootless runtime, mounts, capabilities, egress and budgets require an operator-approved sandbox. | Host/supply-chain security. |
| VB5-P1-03 HUMAN is not verified current-site state | ⚠️ YES, BUT MODIFY | HIGH | Preserve and surface `UNVERIFIED_NEGATIVE`/origin-proxy limitations. Changing the estimand or collecting real negatives is a research/product decision. | Metric interpretation. |
| VB5-P1-04 AI/HUMAN confounded by source/era/selection | ⚠️ YES, BUT MODIFY | HIGH | The finding is valid; only a new matched dataset and preregistered evaluation can fix it. Do not tune current metrics. | External validity. |
| VB5-P1-05 Cross-domain redirects change sample identity | ✅ YES | HIGH | Enforce a frozen canonical-host/alias policy prospectively. Existing affected confirmation cannot be silently repaired and may need rerun. | Holdout validity. |
| VB5-P1-06 Queue IDs/order reveal labels | ✅ YES | MEDIUM | Use opaque random IDs, shuffled order and a separately sealed mapping in future confirmations. | Operational blinding. |
| VB5-P2-01 `sample_id` controls destructive paths | ✅ YES | LOW | Add an ID allowlist and resolved-path containment before delete/write. | Filesystem safety. |
| VB5-P2-02 GitHub Actions not SHA-pinned | ✅ YES | LOW | Pin official actions to verified immutable SHAs and configure automated updates. | CI supply chain. |
| VB5-P2-03 Historical builds not reproducibly pinned | ⚠️ YES, BUT MODIFY | MEDIUM | Pin image/tool versions and provenance after the sandbox/runtime decision; partial pins alone do not make builds reproducible. | Snapshot reproducibility. |

## Implementation partition

### Safe to implement in this sprint

- direct-evidence source and badge-host hardening;
- arbitrary-header stack isolation;
- security-policy no-false-pass cases;
- request/error/success contract hardening;
- exact MIME, basic document eligibility, charset and terminal abort gates;
- IPv6 pre-validation and literal handling;
- client request identity, stale-result copy, reduced motion and metadata-driven UX;
- executable-script recommendation semantics and removal of silent recommendation truncation;
- prospective Confirmation reader/evaluator/checkpoint integrity;
- official derived-matrix relational validation without mutating frozen feature formulas;
- historical `sample_id` path containment;
- immutable GitHub Action references after primary-source verification.

### Implement with modification

- add containment/transparent warnings around transport-sensitive frozen v0.4 behavior rather than silently changing/retraining it;
- preserve all frozen research artifacts and make fixes prospective/new-version only;
- add browser-level restrictions where safe, while explicitly retaining the infrastructure block.

### Do not implement automatically

- new model transforms, OOD thresholds or removal of frozen features;
- public API v1 breaking changes;
- CSP nonce migration;
- DNS/peer-pinned transport and shared distributed abuse store;
- local browser/historical build isolation claims without an actual sandbox;
- new ground truth, matched dataset, estimand or rerun of independent confirmation;
- font licensing/self-hosting decision.
