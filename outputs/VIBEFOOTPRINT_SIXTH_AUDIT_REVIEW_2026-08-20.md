# VibeFootprint Sixth Audit Review

Reviewed against current `main` (`6861ce1`), not only the older audited commit (`5965498`). The active product is the free testing version; the commercial state is preserved separately as `commercial-version-v1`.

## Architecture boundary

- Next.js 16 / React 19 application with one public Node scan endpoint.
- No database, account system, checkout, payment provider or customer entitlement store exists.
- Public scanning uses bounded peer-pinned HTTP(S); the UI stores an optional three-scan comparison locally.
- Full report data is returned in the active free-test mode. The saved commercial mode exposes it only after server-side admin authorization.
- The production score remains the frozen v0.4 model; research collectors and historical builders are separate offline tooling.

## Audit Review

### VF6-P1-01 — Dead-end unlock CTA

**Verdict:** ❌ NO — Do Not Implement  
**Risk:** LOW for truthful copy; HIGH for real commerce  
**Why:** This was true at the audited commit, but not on current `main`: the free-test mode returns and opens the real report without an unlock CTA. Checkout is intentionally deferred and the commercial version is preserved, not active.  
**Audit recommendation:** Add a real access journey or honest temporary CTA.  
**Implementation decision:** No current-product code change. Checkout, entitlement and recovery belong to the later Stripe phase.  
**Potential impact:** Premature commerce code would introduce security-sensitive state without accounts or persistence.

### VF6-P1-02 — Dialogs lack modal keyboard behavior

**Verdict:** ✅ YES — Makes Sense  
**Risk:** MEDIUM  
**Why:** Both overlays claim `aria-modal` but do not control focus, Escape, background interaction or restoration.  
**Audit recommendation:** One accessible reusable dialog primitive.  
**Implementation decision:** Add focus entry/trap, Escape close, background inertness, scroll lock and focus restoration without a dependency.  
**Potential impact:** Report overlay interactions and keyboard navigation.

### VF6-P1-03 — Redirect target admission bypass

**Verdict:** ✅ YES — Makes Sense  
**Risk:** MEDIUM  
**Why:** Initial-host locking does not protect a different final host.  
**Audit recommendation:** Reserve each redirect destination until completion.  
**Implementation decision:** Add target-only reservations and acquire them before cross-host fetches, with deduplication and `finally` cleanup.  
**Potential impact:** Scan availability and redirect-heavy targets; client/global quotas remain counted once.

### VF6-P1-04 — Missing maturity disclosure

**Verdict:** ⚠️ YES, BUT MODIFY  
**Risk:** LOW  
**Why:** The trust boundary is incomplete, but restoring the phrase “Research Beta” conflicts with the explicit product requirement to remove research-beta branding.  
**Audit recommendation:** Restore a visible beta label and legacy-validation caveat.  
**Safer approach:** Add a plain-language evaluation boundary in Methodology, describe the corpus as a frozen reference corpus, and state that historic confirmation metrics are not a current performance claim.

### VF6-P2-01 — Superseded retry can send a stale request

**Verdict:** ✅ YES — Makes Sense  
**Risk:** LOW  
**Why:** Sequence protection prevents a stale UI write but not the request after the delay.  
**Implementation decision:** Recheck the sequence and abort signal immediately after the retry wait.  
**Potential impact:** Retry traffic only.

### VF6-P2-02 — Local storage can turn success into failure

**Verdict:** ✅ YES — Makes Sense  
**Risk:** LOW  
**Why:** Optional local persistence currently runs before committing the successful response.  
**Implementation decision:** Commit the result first and isolate all history persistence errors.  
**Potential impact:** Comparison history may be unavailable while the core result remains usable.

### VF6-P2-03 — Admin rescans enter ordinary history

**Verdict:** ✅ YES — Makes Sense  
**Risk:** LOW  
**Why:** A protected duplicate retrieval is not a meaningful prior customer scan.  
**Implementation decision:** Do not record a scan requested with an admin key.  
**Potential impact:** Cleaner local comparisons; no server behavior change.

### VF6-P2-04 — Print stylesheet absent

**Verdict:** ❌ NO — Do Not Implement  
**Why:** The current repository contains a dedicated `@media print` block in `app/globals.css`; the finding is stale/incorrect.

### VF6-P2-05 — Report exports retain query parameters

**Verdict:** ✅ YES — Makes Sense  
**Risk:** LOW  
**Why:** Signed or preview query values can leak into copied/downloaded reports and fix prompts.  
**Implementation decision:** Redact query and fragment by default in all customer/admin report material.  
**Potential impact:** Reports identify the same path but omit request-specific parameters.

### VF6-P2-06 — German UI leaves English document language

**Verdict:** ✅ YES — Makes Sense  
**Risk:** LOW  
**Implementation decision:** Synchronize `document.documentElement.lang` with the selected locale and tolerate unavailable local storage.  
**Potential impact:** Assistive-technology pronunciation and language metadata.

### VF6-P2-07 — German launch copy can contradict state

**Verdict:** ✅ YES — Makes Sense  
**Risk:** LOW  
**Implementation decision:** Replace string mutation with explicit localized text for every status of every check.  
**Potential impact:** German report wording only.

### VF6-P2-08 — Narrow launch-check parsing

**Verdict:** ⚠️ YES, BUT MODIFY  
**Risk:** MEDIUM  
**Why:** The defects are real, but adding a browser DOM parser to the server would add unnecessary weight and different error behavior.  
**Safer approach:** Harden the bounded parser for quoted/unquoted attributes, robots `none`, non-empty H1, and valid HTTP(S) canonical URLs, backed by fixtures.

### VF6-P2-09 — No multi-address failover

**Verdict:** ⚠️ YES, BUT MODIFY  
**Risk:** MEDIUM  
**Why:** Failover improves availability, but transport changes must preserve peer verification and one total deadline.  
**Implementation decision:** Do not change the critical production transport in this patch without injectable-transport integration coverage. Add it as a contained follow-up.  
**Potential impact:** Incorrect failover could weaken SSRF guarantees or extend deadlines.

### VF6-P2-10 — Request body bound relies on Content-Length

**Verdict:** ✅ YES — Makes Sense  
**Risk:** LOW  
**Implementation decision:** Read the request stream through the existing bounded reader before JSON parsing.  
**Potential impact:** Oversized/chunked requests fail deterministically.

### VF6-P2-11 — Admin report parser is not a strict privacy schema

**Verdict:** ✅ YES — Makes Sense  
**Risk:** MEDIUM  
**Implementation decision:** Enforce exact top-level/nested keys, score ranges, safe target URL, boundary invariants and recursively reject raw-source field names.  
**Potential impact:** Future incompatible report payloads fail closed instead of rendering.

### VF6-P2-12 — HTTP does not share egress connection budget

**Verdict:** ✅ YES — Makes Sense  
**Risk:** MEDIUM  
**Implementation decision:** Use the existing active-connection budget for both HTTP and CONNECT with idempotent release.  
**Potential impact:** Research collector throughput, not production scanning.

### VF6-P2-13 — Intentional ten-second reveal

**Verdict:** ❌ NO — Do Not Implement  
**Why:** The user explicitly requested this product behavior to make the scan stages legible. It is disclosed in the UI and is not presented as technical latency.

### VF6-P3-01 — No global local-history host cap

**Verdict:** ✅ YES — Makes Sense  
**Risk:** LOW  
**Implementation decision:** Retain only the newest 25 hosts while preserving the per-host limit.  
**Potential impact:** Very old local-only history is evicted.

### VF6-P3-02 — Egress DNS timer is not cleared

**Verdict:** ✅ YES — Makes Sense  
**Risk:** LOW  
**Implementation decision:** Clear the timer in `finally`.  
**Potential impact:** Less timer churn in research batches.

### VF6-P3-03 — Admin auth reveals configuration state

**Verdict:** ✅ YES — Makes Sense  
**Risk:** LOW  
**Implementation decision:** Return the same generic 401 response for absent configuration and wrong keys; keep the distinction only in server logs.  
**Potential impact:** Admin troubleshooting relies on logs rather than public error detail.

### OPEN-P1-A — Raw asset text can create direct builder evidence

**Verdict:** ✅ YES — Makes Sense  
**Risk:** MEDIUM  
**Why:** Comments and strings in JavaScript are not reliable provenance evidence and can influence frozen-model inputs.  
**Implementation decision:** Remove asset-text direct attribution while retaining structured HTML/manifest evidence; add an adversarial regression test.  
**Potential impact:** Some scans with only marker-like JavaScript text may receive a different, more defensible score.

### OPEN-P1-B — Broad CSP sources pass the baseline

**Verdict:** ✅ YES — Makes Sense  
**Risk:** MEDIUM  
**Implementation decision:** Apply directive fallback/override semantics and reject broad scheme/wildcard/data/blob script sources.  
**Potential impact:** Security scores can decrease for permissive policies; Vibe-Footprint remains separate.

### OPEN-P1-C — Frozen model OOD sensitivity

**Verdict:** 🛑 DANGEROUS — Could Break the Project  
**Risk:** HIGH  
**Why:** Editing features, weights, clipping or abstention invalidates the frozen model and its historical confirmation.  
**Do not implement automatically:** A versioned successor requires preregistration, retraining, freeze and fresh independent validation.

### OPEN-P1-D — Legacy research scanner uses ordinary fetch

**Verdict:** ⚠️ YES, BUT MODIFY  
**Risk:** HIGH  
**Why:** The risk is real for future live runs, but rewriting frozen/historical tooling can invalidate provenance and artifacts.  
**Implementation decision:** Do not mutate the frozen scanner. Mark it legacy and require the isolated collector for future live-network work in documentation/operations.

### OPEN-P1-E — Historical builds execute untrusted repositories

**Verdict:** 🛑 DANGEROUS — Could Break the Project  
**Risk:** HIGH  
**Why:** A secure solution is an infrastructure project involving disposable workers, credential isolation, egress policy, mounts and resource budgets. A partial patch could create false confidence.  
**Do not implement automatically:** Design and adversarially test a dedicated sandbox profile before the next historical build batch.

## Decision groups

### Safe to implement

P1-02, P1-03, P2-01, P2-02, P2-03, P2-05, P2-06, P2-07, P2-10, P3-01, P3-02, P3-03.

### Implement with modification

P1-04, P2-08, P2-11, P2-12, OPEN-P1-A, OPEN-P1-B.

### Do not implement

P1-01 on active `main`, P2-04, P2-13.

### Requires a separate high-risk decision/project

P2-09, OPEN-P1-C, OPEN-P1-D, OPEN-P1-E, and the future checkout/entitlement implementation for the saved commercial version.
