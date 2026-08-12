# VibeBench audit review and implementation checklist

Date: 2026-08-12
Reviewed audit: `VibeBench_QA_UX_GitHub_Audit_2026-08-11.md`
Baseline: commit `163e6cf`, 52/52 tests, lint and production build passing

The audit was treated as a set of hypotheses. This checklist records the decision made before implementation. VibeBench has one public Next.js API route, no database, authentication, authorization, payments, persistent state, or third-party application integration. The highest blast radius is therefore the public outbound-fetch boundary and the frozen v0.4 model semantics.

## Audit review

### P1-01 — Unstructured text creates direct builder evidence

**Verdict:** ✅ YES — Makes Sense
**Risk:** MEDIUM
**Why:** The requested URL, response headers, visible prose and HTML are mixed before broad regular-expression matching. This is reproducible and contaminates model artifact features.
**Audit recommendation:** Restrict direct evidence to approved structured contexts and retain provenance.
**Implementation decision:** Remove URL/header/prose matching; accept exact DOM attributes, generator metadata, structured builder badges and specific same-origin asset markers. Add poisoning regression tests.
**Potential impact:** Direct verdicts and direct-artifact model features become stricter. Generic stack/context detection remains unchanged.

### P1-02 — Presence-only security grading

**Verdict:** ✅ YES — Makes Sense
**Risk:** MEDIUM
**Why:** Non-empty but disabling values currently receive full credit.
**Audit recommendation:** Parse policy values and grade their effectiveness.
**Implementation decision:** Add conservative CSP, HSTS, framing, nosniff, referrer and permissions-policy semantics with strong/weak/invalid tests. Keep the section explicitly limited to public response headers.
**Potential impact:** Scores will decrease for ineffective headers; recommendation ordering may change.

### P1-03 — DNS rebinding and special-address gaps

**Verdict:** ⚠️ YES, BUT MODIFY
**Risk:** HIGH
**Why:** Mapped and non-global address gaps are real. Reliable socket pinning/peer verification in Vercel's fetch runtime is infrastructure work, not a safe local patch.
**Audit recommendation:** Global-address allow policy, IP pinning, peer verification, port restrictions and deadlines.
**Safer approach:** Implement and test strict public-port and non-global-address rejection, including mapped IPv4, CGNAT, benchmark, documentation, multicast and reserved ranges. Keep redirect/asset revalidation and add DNS deadlines. Defer pinning/peer verification to an approved transport design and controlled integration environment.
**Potential impact:** URLs on unusual ports and special networks become intentionally unsupported.

### P1-04 — Unbounded HTML buffering and missing abuse controls

**Verdict:** ⚠️ YES, BUT MODIFY
**Risk:** MEDIUM
**Why:** Full buffering is confirmed. An in-memory serverless rate limiter or cache would create false guarantees across instances.
**Audit recommendation:** Stream limits, total budgets, cancellation, rate limiting, throttling, coalescing, caching and telemetry.
**Safer approach:** Reuse the bounded stream reader for HTML, cancel immediately at the limit, combine request and scan deadlines, and report bounded byte counts. Defer distributed rate limiting, caching and global concurrency to the hosting layer/design decision.
**Potential impact:** Oversized/chunked targets fail earlier; normal API shape remains compatible.

### P1-05 — Absent features appear as detected score drivers

**Verdict:** ✅ YES — Makes Sense
**Risk:** MEDIUM
**Why:** Standardized logit contributions are mathematically valid but the current labels imply detection and score points.
**Audit recommendation:** Include raw value/baseline/type, use presence-aware copy and identify units.
**Implementation decision:** Return presence/state/baseline and relative-logit metadata, hide absent binary features from the default summary, and replace unexplained numbers with plain-language relative influence. Add four-quadrant driver tests.
**Potential impact:** Explanation copy changes; model output itself does not.

### P2-01 — Score bands are not independently calibrated

**Verdict:** ⚠️ YES, BUT MODIFY
**Risk:** MEDIUM
**Why:** The binary holdout does not validate five probability bands. The product still needs an understandable 0–100 similarity index.
**Safer approach:** Keep deliberately qualitative orientation bands, explicitly call the value an uncalibrated similarity index, publish 99/100 technical coverage and uncertainty in Methodology, and retain calibration as future research.
**Potential impact:** Trust copy becomes more conservative; score calculation remains unchanged.

### P2-02 — ARIA count is used as accessibility proxy

**Verdict:** ⚠️ YES, BUT MODIFY
**Risk:** MEDIUM
**Why:** ARIA quantity does not establish accessible names or keyboard behavior. A complete accessibility engine is outside this scanner's current evidence.
**Safer approach:** Remove the count-triggered high-priority finding. Keep clearly labelled manual accessibility guidance and do not infer accessibility from ARIA density.
**Potential impact:** Fewer false high-priority accessibility findings.

### P2-03 — No enforced CI or adversarial route coverage

**Verdict:** ✅ YES — Makes Sense
**Risk:** LOW
**Why:** Existing commands are useful but are not enforced.
**Audit recommendation:** Required install/test/lint/build workflow plus integration/E2E coverage.
**Implementation decision:** Add GitHub Actions for `npm ci`, tests, lint and build; add dependency-free adversarial unit/contract/network-policy tests now. Browser E2E remains a later harness decision.
**Potential impact:** Pull requests fail when existing quality gates fail.

### P2-04 — Retryability is unused in the UI

**Verdict:** ✅ YES — Makes Sense
**Risk:** LOW
**Why:** The API already exposes the required state.
**Implementation decision:** Add inline retry and cancel, align the client deadline with the server budget, and preserve the previous successful result while a replacement scan is pending or fails.
**Potential impact:** Client state flow changes without changing API semantics.

### P2-05 — Unsupported schemes are normalized incorrectly

**Verdict:** ✅ YES — Makes Sense
**Risk:** LOW
**Why:** The normalization order is incorrect and directly reproducible.
**Implementation decision:** Detect any explicit scheme before adding HTTPS and reject non-HTTP(S) schemes.
**Potential impact:** Clearer 400 outcomes for malformed/unsupported inputs.

### P2-06 — No shared runtime response contract

**Verdict:** ⚠️ YES, BUT MODIFY
**Risk:** MEDIUM
**Why:** Contract drift can produce a blank result, but adding a schema dependency is unnecessary for this small API.
**Safer approach:** Add a shared dependency-free runtime parser, additive API version and visible incompatible-response state. Validate success/error payload essentials.
**Potential impact:** Malformed responses become explicit errors rather than blank UI.

### P2-07 — Asset selection depends on document order

**Verdict:** 🛑 DANGEROUS — Could Break the Project
**Risk:** HIGH
**Why:** Asset selection is part of the frozen v0.4 feature pipeline. Changing it silently changes production scores without matching retraining and independent validation.
**Do not implement automatically.** Define a v0.5 selection contract, retrain and validate before switching production.

### P2-08 — Result accessibility gaps

**Verdict:** ✅ YES — Makes Sense
**Risk:** LOW
**Implementation decision:** Add `aria-pressed`, a named focused result region with visible focus, a concise status live region and compliant sequence-number contrast.
**Potential impact:** Assistive-technology behavior improves; layout remains stable.

### P2-09 — Release metadata can drift

**Verdict:** ✅ YES — Makes Sense
**Risk:** MEDIUM
**Implementation decision:** Add one machine-readable release manifest binding product/API/model versions, model hash, threshold, confirmation metrics, technical coverage and uncertainty. Read it in API and UI and test the hashes. Preserve all frozen artifacts.
**Potential impact:** Metadata becomes governed by a single source.

### P2-10 — No application-level observability

**Verdict:** ⚠️ YES, BUT MODIFY
**Risk:** MEDIUM
**Why:** Privacy-minimized diagnostics are useful; dashboards, retention and alerting require an operational decision.
**Safer approach:** Add request IDs, response headers and structured outcome/duration/byte logs without full URLs. Defer external telemetry and retention policy.
**Potential impact:** Hosting logs gain bounded diagnostic events without target URL disclosure.

### P2-11 — Footer links to private repository

**Verdict:** ✅ YES — Makes Sense
**Risk:** LOW
**Implementation decision:** Replace the public repository link with an in-page Methodology link until a public documentation destination exists.

### P2-12 — VibeBench does not declare its own response headers

**Verdict:** ⚠️ YES, BUT MODIFY
**Risk:** MEDIUM
**Why:** Explicit policy is appropriate, but a strict nonce CSP requires middleware and rendered-browser validation.
**Safer approach:** Configure a production-compatible CSP for the current Next/font behavior plus HSTS, framing, nosniff, referrer and permissions headers. Record the remaining `unsafe-inline` limitation rather than claiming a perfect policy.
**Potential impact:** External resources outside the declared policy are blocked; build/browser smoke verification is required.

### P2-13 — Generic work prevents a healthy state

**Verdict:** ✅ YES — Makes Sense
**Risk:** LOW
**Implementation decision:** Mark every item as observed finding or evergreen guidance, stop padding to five, and separate guidance in the UI. Allow “no high-confidence issue detected.”
**Potential impact:** Recommendation counts become more honest and may be smaller.

### P3-01 — User-Agent version drift

**Verdict:** ✅ YES — Makes Sense
**Risk:** LOW
**Implementation decision:** Generate it from the release manifest.

### P3-02 — Mobile navigation disappears

**Verdict:** ✅ YES — Makes Sense
**Risk:** LOW
**Implementation decision:** Retain a compact scan anchor on small screens.

### P3-03 — Mobile band text is too small

**Verdict:** ✅ YES — Makes Sense
**Risk:** LOW
**Implementation decision:** Raise the minimum size and permit a readable reflow.

### P3-04 — New scans erase the previous result

**Verdict:** ✅ YES — Makes Sense
**Risk:** LOW
**Implementation decision:** Covered with P2-04: preserve the last success during replacement and show scan status.

### P3-05 — Returned evidence is not fully displayed

**Verdict:** ✅ YES — Makes Sense
**Risk:** LOW
**Implementation decision:** Show header, manifest and structural evidence in technical details.

### P3-06 — External Google Fonts import

**Verdict:** ⚠️ YES, BUT MODIFY
**Risk:** MEDIUM
**Why:** Self-hosting can improve privacy/performance, but changing established typography without bundled licensed files creates a visual regression or a build-time network dependency.
**Implementation decision:** Do not change typography in this hardening sprint. Decide later between bundled licensed font files and the existing declared external origin.

### P3-07 — Untranslated fallback feature labels

**Verdict:** ✅ YES — Makes Sense
**Risk:** LOW
**Implementation decision:** Add localized category-aware fallback labels and descriptions for all frozen model feature families.

### P3-08 — Scan network behavior is unclear

**Verdict:** ✅ YES — Makes Sense
**Risk:** LOW
**Implementation decision:** State that VibeBench performs bounded server-side GET requests which can appear in target logs.

### P3-09 — Missing skip link

**Verdict:** ✅ YES — Makes Sense
**Risk:** LOW
**Implementation decision:** Add a keyboard-visible skip link to the scanner.

### P3-10 — No nearby methodology link

**Verdict:** ✅ YES — Makes Sense
**Risk:** LOW
**Implementation decision:** Link score/security limitations directly to the Methodology section.

## Implementation groups

### Safe to implement

P1-01, P1-02, P1-05, P2-03, P2-04, P2-05, P2-08, P2-09, P2-11, P2-13, P3-01–05 and P3-07–10.

### Implement with modification

P1-03 (classification/ports/deadline only), P1-04 (streaming/cancellation only), P2-01, P2-02, P2-06, P2-10 and P2-12.

### Do not implement

None of the findings is wholly false. P3-06 is valid but intentionally deferred pending a typography/asset decision.

### Requires human/infrastructure decision

- Connection IP pinning and peer-address verification for the Vercel runtime.
- Distributed caller/target rate limits, shared caching, coalescing and global concurrency limits.
- A browser E2E stack and required-branch settings in GitHub.
- v0.5 deterministic asset selection plus retraining/independent validation.
- External telemetry provider, privacy/retention policy and alerts.
- Bundled font licensing and typography source.
