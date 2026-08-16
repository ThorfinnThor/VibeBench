# VibeBench Collector v5 + Model 90/90 Implementation Plan

Date: 2026-08-16  
Repository: `ThorfinnThor/VibeBench`  
Status: **IMPLEMENTATION PLAN — RESEARCH ONLY**  
Production model affected by this document: **No**  
Current production model remains: **v0.4 Research Beta**

---

## 1. Executive decision

The Option-B v4 81-site extension is complete and should remain frozen as a historical research artifact. It produced a reproducible label-blind technical capture, but it is **not sufficient to authorize a new production model version**.

Observed v4 result:

- 81 attempted sites
- 61 successful captures
- 20 technical/non-eligible outcomes
- technical yield: `61 / 81 = 75.3%`
- 25 `STRONG_AI`
- 36 `STABLE_HUMAN`
- 38 derived features
- best development configuration: logistic regression, threshold `0.52`
- median Precision: `80%`
- median Recall: `80%`
- p10 Precision: `76%`
- p10 Recall: `72%`
- assignments meeting 80/80: `10/20`
- assignments meeting 90/90: `0/20`

The correct next step is **not** to tune the existing v4 threshold until 90/90 appears. The next step is to build a new research path:

> **Collector v5 → Feature Contract v2 → Evaluation v2 → larger Development set → untouched independent confirmation → production gate**

This document defines that implementation path.

---

## 2. Non-negotiable principles

### 2.1 Preserve v4

Do not rewrite the existing v4 collector, capture contract, 81-site result, derived matrix or model-research output in place.

Keep these files immutable as research evidence:

- `lib/option-b-v4-capture.mjs`
- `lib/option-b-v4-derived-feature-contract.mjs`
- `outputs/development_v0_5_option_b_v4/option_b_capture_contract_v4.json`
- `outputs/development_v0_5_option_b_v4/option_b_v4_derived_feature_matrix_v1.json`
- `outputs/development_v0_5_option_b_v4/option_b_v4_model_research_v1.json`
- `outputs/VIBEBENCH_OPTION_B_V4_EXTENSION_81_RESULT_2026-08-16.md`

All new work should use a new version namespace.

### 2.2 No silent production promotion

Collector v5 and all v5/v0.6 outputs are Development research until an untouched independent confirmation is completed.

### 2.3 Preserve label blindness during capture

The collector may receive only:

```text
sample_id
target_url
```

It must not receive:

```text
label
target
target_group
cohort
builder
provenance_url
previous_score
previous_outcome
```

Labels may be joined only **after capture freeze**.

### 2.4 Do not evade access controls

The collector may retry transient technical failures, but it must not attempt to bypass:

- authentication
- CAPTCHA
- robots/access challenges through evasion
- 401/403 authorization controls
- geo/legal blocks such as HTTP 451
- anti-bot systems through browser fingerprint rotation

Blocked pages remain technical/non-classification outcomes.

### 2.5 90/90 is a release gate, not a tuning target

A production candidate must meet the frozen gate without threshold shopping on the final confirmation set.

---

## 3. Root-cause analysis

There are three separate bottlenecks.

### 3.1 Technical capture yield

The v4 81-site run yielded only 75.3% successful captures.

The failure classes observed in the artifact are approximately:

| Failure class | Count | Collector-fixable? |
|---|---:|---|
| Empty/interstitial with document response | 8 | partly |
| HTTP errors | 6 | generally no |
| HTTP blocked/denied | 3 | no |
| Unknown technical error | 2 | yes: observability/classification |
| Computed-style extraction failure | 1 | yes |

A 90% yield on 81 targets requires at least 73 successful captures.

Even perfect recovery of the 8 interstitial outcomes, 2 unknown technical errors and 1 style extraction error would produce only:

```text
61 + 8 + 2 + 1 = 72
72 / 81 = 88.9%
```

Therefore >90% technical yield requires both:

1. collector reliability improvements, and
2. a deterministic technical replacement policy for dead/blocked Development targets.

### 3.2 Evaluation methodology

The current v4 model research describes its folds as group-stratified, but the implementation distributes rows from each `target_group` across folds.

This means members of the same group can appear in both training and evaluation folds.

That is not a true grouped holdout.

Before any new model claim, the evaluation must guarantee:

```text
train target_groups ∩ test target_groups = ∅
```

### 3.3 Feature information content

The v4 contract intentionally stores privacy-minimal aggregate browser-surface information. This is a strong privacy boundary, but the derived feature set compresses much of the captured distribution into broad shares such as:

- unique structural signature share
- repeated structural signature share
- unique style signature share
- repeated style signature share
- radius/share/shadow/share
- generic document size/count values

The next feature contract should retain privacy while extracting more information from the already aggregated structures.

---

# PART A — COLLECTOR V5

## 4. New files

Create the following new files rather than modifying v4 semantics in place:

```text
lib/option-b-v5-capture.mjs
lib/option-b-v5-derived-feature-contract.mjs
scripts/run-development-v0_6-option-b-v5-isolated.mjs
scripts/build-development-v0_6-option-b-v5-derived-features.mjs
scripts/research-development-v0_6-option-b-v5-models.mjs
scripts/review-development-v0_6-option-b-v5-capture.mjs
scripts/build-development-v0_6-option-b-v5-manifest.mjs
scripts/build-development-v0_6-option-b-v5-reserve-manifest.mjs
scripts/evaluate-development-v0_6-option-b-v5-grouped.mjs
outputs/development_v0_6_option_b_v5/option_b_capture_contract_v5.json
.github/workflows/option-b-v5-development.yml
```

Add tests:

```text
tests/option-b-v5-capture.test.mjs
tests/option-b-v5-retry-policy.test.mjs
tests/option-b-v5-group-folds.test.mjs
tests/option-b-v5-derived-features.test.mjs
tests/option-b-v5-release-gate.test.mjs
```

---

## 5. Contract v5 changes

The v5 contract should explicitly introduce:

```json
{
  "budgets": {
    "navigation_timeout_ms": 18000,
    "readiness_timeout_ms": 14000,
    "extraction_timeout_ms": 12000,
    "attempts_per_viewport": 2
  },
  "retry_policy": {
    "fresh_context_per_retry": true,
    "maximum_attempts": 2,
    "retry_transient_only": true,
    "no_access_control_evasion": true
  },
  "viewports": [
    { "id": "desktop", "width": 1440, "height": 900 },
    { "id": "mobile", "width": 390, "height": 844 }
  ]
}
```

The exact budgets must be frozen before the first scored Development run.

Do not tune these budgets after labels or model performance have been inspected.

---

## 6. Terminal outcome taxonomy v5

Split ambiguous outcomes more precisely.

Recommended outcome set:

```text
success
invalid_url
private_or_disallowed_target
egress_policy_blocked
dns_unresolved
tcp_connection_failed
tls_certificate_error
http_rate_limited
http_blocked_or_denied
http_not_found
http_legal_block
http_error
navigation_timeout
navigation_context_replaced
surface_helper_installation_failed
dom_readiness_timeout
ineligible_empty_or_interstitial
capture_surface_unstable
computed_style_extraction_failed
structural_aggregation_failed
serialization_failed
unknown_technical_error
```

Reason:

- HTTP 429 should be distinguishable from 401/403.
- 404 should be distinguishable from temporary 5xx failure.
- 451 should be distinguishable as a non-retryable legal/availability outcome.
- helper installation should not be reported as generic navigation failure.

---

## 7. Retry policy implementation

### 7.1 Classification

Implement this in the new v5 runner:

```js
function classify(error, stage, status) {
  const message = String(error?.message || error || "");

  if (/gültige öffentliche URL/i.test(message)) return "invalid_url";

  if (/Nur öffentliche HTTP|Zugangsdaten|nicht öffentliche|reservierte|lokale/i.test(message)) {
    return "private_or_disallowed_target";
  }

  if (status === 429) return "http_rate_limited";
  if (status === 401 || status === 403) return "http_blocked_or_denied";
  if (status === 404) return "http_not_found";
  if (status === 451) return "http_legal_block";
  if (status >= 400) return "http_error";

  if (/ERR_TUNNEL_CONNECTION_FAILED|proxy|egress|blockedbyclient/i.test(message)) {
    return "egress_policy_blocked";
  }

  if (/ENOTFOUND|ERR_NAME_NOT_RESOLVED|dns/i.test(message)) {
    return "dns_unresolved";
  }

  if (/ECONNREFUSED|ECONNRESET|ERR_CONNECTION_|socket|tcp/i.test(message)) {
    return "tcp_connection_failed";
  }

  if (/CERT|certificate|TLS|SSL/i.test(message)) {
    return "tls_certificate_error";
  }

  if (/Execution context was destroyed|Cannot find context/i.test(message)) {
    return "navigation_context_replaced";
  }

  if (stage === "surface_helper_installation") {
    return "surface_helper_installation_failed";
  }

  if (/capture_surface_unstable/i.test(message)) {
    return "capture_surface_unstable";
  }

  if (/dom_readiness_timeout/i.test(message)) {
    return "dom_readiness_timeout";
  }

  if (/timeout/i.test(message)) {
    return stage === "http_navigation"
      ? "navigation_timeout"
      : "dom_readiness_timeout";
  }

  if (stage === "computed_style_extraction") {
    return "computed_style_extraction_failed";
  }

  if (stage === "structural_aggregation") {
    return "structural_aggregation_failed";
  }

  if (stage === "serialization") {
    return "serialization_failed";
  }

  return "unknown_technical_error";
}
```

### 7.2 Retry allowlist

```js
const RETRYABLE_OUTCOMES = new Set([
  "http_rate_limited",
  "dns_unresolved",
  "tcp_connection_failed",
  "navigation_timeout",
  "navigation_context_replaced",
  "surface_helper_installation_failed",
  "dom_readiness_timeout",
  "ineligible_empty_or_interstitial",
  "capture_surface_unstable",
  "computed_style_extraction_failed",
  "unknown_technical_error"
]);
```

Do **not** retry as an evasion mechanism:

```text
http_blocked_or_denied
http_legal_block
private_or_disallowed_target
```

A second normal request to a temporary 5xx endpoint may be allowed if frozen in the contract, but 4xx access control must remain terminal.

### 7.3 Backoff

```js
function retryDelay(outcome, retryNumber) {
  if (outcome === "http_rate_limited") {
    return Math.min(8_000, 2_000 * 2 ** retryNumber);
  }

  return 500 + retryNumber * 750;
}
```

### 7.4 Per-target retry loop

```js
async function runTargetWithRetries(row, index) {
  const maxAttempts = contract.retry_policy.maximum_attempts;

  for (let retryNumber = 0; retryNumber < maxAttempts; retryNumber += 1) {
    const result = await captureSingleAttempt({
      row,
      index,
      retryNumber
    });

    attempts.push(result.audit);

    if (result.ok) {
      captures.push(result.capture);
      return {
        ok: true,
        finalAttempt: retryNumber
      };
    }

    if (!RETRYABLE_OUTCOMES.has(result.audit.outcome_code)) {
      return {
        ok: false,
        finalAttempt: retryNumber,
        terminalOutcome: result.audit.outcome_code
      };
    }

    if (retryNumber + 1 < maxAttempts) {
      await new Promise((resolve) => {
        setTimeout(
          resolve,
          retryDelay(result.audit.outcome_code, retryNumber)
        );
      });
    }
  }

  return { ok: false };
}
```

Each retry must create:

- a new browser context
- a new attempt ID
- no cookies from the previous attempt
- no storage from the previous attempt
- no service workers
- the same frozen User-Agent
- the same locale/timezone/viewports

Do not rotate browser identity between retries.

---

## 8. Fix stage attribution

Before helper installation:

```js
stage = "http_navigation";
const response = await page.goto(target.toString(), {
  waitUntil: "domcontentloaded",
  timeout: contract.budgets.navigation_timeout_ms
});

status = response?.status() || null;
documentObserved = true;

if (status && status >= 400) {
  throw new Error(`HTTP ${status}`);
}

stage = "surface_helper_installation";
await installOptionBV5SurfaceHelpers(page);

stage = "dom_readiness";
await waitForOptionBV5Readiness(page, readiness);
```

This removes a large class of misleading `unknown_technical_error` reports.

---

## 9. Extraction performance improvements

The v4 extraction repeatedly traverses ancestors and calls `getComputedStyle()` and visibility logic for many of the same elements.

Introduce per-page caches.

```js
const styleCache = new WeakMap();
const depthCache = new WeakMap();
const visibilityCache = new WeakMap();

const styleFor = (element) => {
  if (!styleCache.has(element)) {
    styleCache.set(element, getComputedStyle(element));
  }
  return styleCache.get(element);
};

const depthFor = (element) => {
  if (depthCache.has(element)) {
    return depthCache.get(element);
  }

  let depth = 0;

  for (
    let current = element.parentElement;
    current;
    current = current.parentElement
  ) {
    depth += 1;
  }

  depthCache.set(element, depth);
  return depth;
};
```

Cached visibility:

```js
const isVisibleCached = (element) => {
  if (visibilityCache.has(element)) {
    return visibilityCache.get(element);
  }

  if (!(element instanceof Element) || element.closest("[hidden],[inert]")) {
    visibilityCache.set(element, false);
    return false;
  }

  const rect = element.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0 || !element.getClientRects().length) {
    visibilityCache.set(element, false);
    return false;
  }

  let left = rect.left;
  let right = rect.right;
  let top = rect.top;
  let bottom = rect.bottom;

  for (let current = element; current; current = current.parentElement) {
    const computed = styleFor(current);

    if (
      computed.display === "none" ||
      computed.visibility === "hidden" ||
      computed.visibility === "collapse" ||
      Number(computed.opacity) <= 0
    ) {
      visibilityCache.set(element, false);
      return false;
    }

    if (current !== element) {
      const parentRect = current.getBoundingClientRect();

      if (["hidden", "clip", "scroll", "auto"].includes(computed.overflowX)) {
        left = Math.max(left, parentRect.left);
        right = Math.min(right, parentRect.right);
      }

      if (["hidden", "clip", "scroll", "auto"].includes(computed.overflowY)) {
        top = Math.max(top, parentRect.top);
        bottom = Math.min(bottom, parentRect.bottom);
      }

      if (right <= left || bottom <= top) {
        visibilityCache.set(element, false);
        return false;
      }
    }
  }

  visibilityCache.set(element, true);
  return true;
};
```

Build a visible element set once:

```js
const all = [...document.body.querySelectorAll("*")];

const allVisible = all.filter(
  (element) =>
    depthFor(element) <= limits.maximum_dom_depth &&
    isVisibleCached(element)
);

const visible = allVisible.slice(0, limits.maximum_visible_elements);
const visibleSet = new Set(visible);
```

Then child counts become cheap:

```js
const visibleChildCount = [...element.children]
  .filter((child) => visibleSet.has(child))
  .length;
```

---

## 10. CSS traversal budget must terminate early

Do not continue recursively traversing CSS once the frozen byte budget is exhausted.

```js
let budgetExhausted = false;

function visitRules(items) {
  for (const rule of items) {
    if (budgetExhausted) return;

    const bytes = utf8Bytes(rule.cssText || "");

    if (
      sheetBytes + bytes > limits.maximum_stylesheet_bytes_each ||
      totalBytes + bytes > limits.maximum_total_stylesheet_bytes
    ) {
      budgetExhausted = true;
      return;
    }

    sheetBytes += bytes;
    totalBytes += bytes;

    if (rule.type === CSSRule.FONT_FACE_RULE) fontFaces += 1;
    if (rule.type === CSSRule.MEDIA_RULE) mediaQueries += 1;
    if (rule.constructor?.name === "CSSContainerRule") containerQueries += 1;

    if (rule.style) {
      for (const name of [...rule.style]) {
        if (!name.startsWith("--")) continue;
        customProperties.add(name);
        customPropertyValueTypes.push(
          valueType(rule.style.getPropertyValue(name))
        );
      }
    }

    if (rule.cssRules) {
      visitRules([...rule.cssRules]);
    }
  }
}
```

---

# PART B — DATASET RELIABILITY

## 11. Deterministic replacement policy

Technical failure replacement is acceptable for a **Development set** if the replacement protocol is frozen before model scoring.

The existing v0.5 project already has a technical replacement concept. v5 should make it stricter.

### 11.1 Pre-freeze a reserve pool

Before capture, create:

```text
outputs/development_v0_6_option_b_v5/option_b_v5_primary_manifest.json
outputs/development_v0_6_option_b_v5/option_b_v5_reserve_manifest.json
```

Reserve rows must already have:

- label provenance established before the run
- same label class as the primary target they can replace
- compatible target group/builder bucket where applicable
- unique project family
- no model score used for selection

### 11.2 Replacement rule

A primary row may be replaced only for a frozen technical reason such as:

```text
http_not_found
http_legal_block
permanent dns failure
persistent connection failure
persistent empty/interstitial outcome
```

The replacement selection must use only predeclared ordering.

Example:

```js
function chooseTechnicalReplacement({ failedRow, reserveRows, usedFamilies }) {
  return reserveRows.find((candidate) =>
    candidate.label === failedRow.label &&
    candidate.target_group === failedRow.target_group &&
    !usedFamilies.has(candidate.project_family_id)
  ) || null;
}
```

Do not inspect model scores while choosing replacement targets.

### 11.3 Preserve audit history

Store:

```json
{
  "sample_id": "...",
  "original_target": "...",
  "replacement_sample_id": "...",
  "reason": "http_not_found",
  "replacement_pre_registered": true,
  "model_score_inspected": false
}
```

The public/model artifacts may remain URL-free; the research manifest may retain target URLs under the existing repository privacy policy.

---

## 12. Development sample target

The 61-row v4 dataset is too small for strong claims with dozens of features and heterogeneous website families.

Recommended research target before attempting a new independent holdout:

```text
minimum successful Development captures: 200
preferred: 250–400
```

This is an engineering/research planning target, not a statistical guarantee of 90/90.

The important requirement is coverage across independent groups, not only raw row count.

Track at least:

```text
label
builder/source group
project family
site category
framework family where known from pre-existing provenance
cohort
capture outcome
```

These metadata are for evaluation stratification only and must not be exposed to the collector.

---

# PART C — FEATURE CONTRACT V2

## 13. Keep the privacy boundary

Feature Contract v2 must still exclude:

```text
target_url
resolved_url
hostname
title
raw_html
full visible text
provenance_url
builder declaration
label
target_group
cohort
```

The goal is to improve information density without reintroducing provenance leakage.

---

## 14. Frequency-shape features

v4 already stores frequency rows for structural/style hashes. Extract more signal from those distributions.

```js
function frequencyShape(rows, total) {
  const counts = rows
    .map((row) => row.count)
    .filter(Number.isFinite)
    .sort((a, b) => b - a);

  const denominator = Math.max(1, total);
  const probabilities = counts.map((count) => count / denominator);

  const entropy = probabilities.reduce(
    (sum, probability) =>
      probability > 0
        ? sum - probability * Math.log2(probability)
        : sum,
    0
  );

  return {
    top1_share: (counts[0] || 0) / denominator,
    top3_share:
      counts.slice(0, 3).reduce((sum, count) => sum + count, 0) /
      denominator,
    top10_share:
      counts.slice(0, 10).reduce((sum, count) => sum + count, 0) /
      denominator,
    entropy,
    effective_clusters: 2 ** entropy
  };
}
```

Add features such as:

```text
repetition:structural_top1_share
repetition:structural_top3_share
repetition:structural_top10_share
repetition:structural_entropy
repetition:structural_effective_clusters
repetition:style_top1_share
repetition:style_top3_share
repetition:style_top10_share
repetition:style_entropy
repetition:style_effective_clusters
```

---

## 15. Typography distribution features

Instead of only custom-font share, capture aggregate typography distributions.

Candidate features:

```text
style:font_size_p25
style:font_size_median
style:font_size_p75
style:font_size_iqr
style:font_weight_diversity
style:line_height_diversity
style:letter_spacing_nonzero_share
```

No font family names need to be persisted.

---

## 16. Spacing and geometry distributions

Candidate features:

```text
style:padding_value_diversity
style:margin_value_diversity
style:gap_value_diversity
style:radius_median
style:radius_p90
style:radius_value_diversity
layout:region_area_variance
layout:x_alignment_concentration
layout:y_alignment_concentration
layout:region_aspect_ratio_diversity
```

---

## 17. Semantic structure features

Add aggregate values such as:

```text
semantic:heading_share
semantic:landmark_share
semantic:landmark_diversity
semantic:interactive_share
semantic:form_control_share
semantic:named_region_share
semantic:list_share
semantic:media_share
```

Do not infer accessibility quality from ARIA counts alone.

---

## 18. Privacy-safe public UI-pattern counters

The older visible-surface research contained richer pattern information. v5 can recover part of that information without persisting literal class names.

Inside the browser, count and discard strings immediately.

Examples:

```text
utility:tailwind_like_token_count_log1p
utility:responsive_variant_share
utility:hover_variant_share
utility:arbitrary_value_share
utility:gradient_pattern_count_log1p
utility:rounded_pattern_count_log1p
utility:shadow_pattern_count_log1p
component:data_slot_count_log1p
component:radix_attribute_count_log1p
component:aria_state_attribute_count_log1p
```

The payload should contain only aggregate numeric counts.

Do not persist:

- class names
- IDs
- text values
- URLs from style declarations
- component names derived from private/internal identifiers

---

## 19. Responsive delta features

Collector v5 should capture desktop and mobile under the same frozen contract.

Derive:

```text
responsive:visible_element_delta
responsive:document_height_ratio
responsive:document_width_ratio
responsive:region_count_delta
responsive:interactive_share_delta
responsive:semantic_role_share_delta
responsive:style_cluster_delta
responsive:layout_reflow_score
responsive:navigation_structure_delta
```

The key concept is to model **how the surface changes**, not just one static viewport.

---

# PART D — EVALUATION V2

## 20. True grouped folds

Replace the current fold construction with group-exclusive folds.

```js
function groupedFoldsFor(seed, foldCount = 5) {
  const rng = random(seed);
  const grouped = new Map();

  for (const row of rows) {
    if (!grouped.has(row.target_group)) {
      grouped.set(row.target_group, []);
    }

    grouped.get(row.target_group).push(row);
  }

  const groups = [...grouped.entries()].map(([id, members]) => {
    const targets = new Set(members.map((row) => row.target));

    if (targets.size !== 1) {
      throw new Error(`Mixed target group: ${id}`);
    }

    return {
      id,
      target: members[0].target,
      rows: members
    };
  });

  const folds = Array.from({ length: foldCount }, () => ({
    rows: [],
    classCounts: { 0: 0, 1: 0 }
  }));

  for (const target of [0, 1]) {
    const targetGroups = shuffle(
      groups.filter((group) => group.target === target),
      rng
    ).sort((a, b) => b.rows.length - a.rows.length);

    for (const group of targetGroups) {
      const destination = [...folds].sort(
        (a, b) =>
          a.classCounts[target] - b.classCounts[target] ||
          a.rows.length - b.rows.length
      )[0];

      destination.rows.push(...group.rows);
      destination.classCounts[target] += group.rows.length;
    }
  }

  return folds.map((fold) => fold.rows);
}
```

Mandatory leakage assertion:

```js
function assertNoGroupLeakage(folds) {
  for (let testIndex = 0; testIndex < folds.length; testIndex += 1) {
    const testGroups = new Set(
      folds[testIndex].map((row) => row.target_group)
    );

    const trainingGroups = new Set(
      folds
        .flatMap((fold, index) =>
          index === testIndex ? [] : fold
        )
        .map((row) => row.target_group)
    );

    for (const group of testGroups) {
      if (trainingGroups.has(group)) {
        throw new Error(`Group leakage detected: ${group}`);
      }
    }
  }
}
```

Add a unit test that intentionally constructs repeated groups and proves the test fails under leakage.

---

## 21. Nested model selection

Do not select a threshold on the same predictions later used as the reported outer-fold result.

Required structure:

```text
Outer grouped fold
  ├─ untouched evaluation groups
  └─ outer training groups
       └─ inner grouped CV
            ├─ select feature subset
            ├─ select regularization
            ├─ select class weighting
            └─ select threshold
```

Then train on the full outer-training partition with the inner-selected configuration and evaluate once on the outer test fold.

### 21.1 Example outline

```js
for (const outerSeed of OUTER_SEEDS) {
  const outerFolds = groupedFoldsFor(outerSeed, 5);

  for (let outerFold = 0; outerFold < outerFolds.length; outerFold += 1) {
    const testRows = outerFolds[outerFold];
    const trainRows = outerFolds.flatMap((fold, index) =>
      index === outerFold ? [] : fold
    );

    const selected = selectConfigurationWithInnerGroupedCV(trainRows);

    const finalModel = trainModel(trainRows, selected);
    const predictions = testRows.map((row) => ({
      target: row.target,
      probability: score(finalModel, row.features)
    }));

    outerResults.push(
      metrics(predictions, selected.threshold)
    );
  }
}
```

---

## 22. Models to compare

Do not immediately increase complexity.

Start with:

```text
1. logistic regression, L2
2. logistic regression, elastic-net if implemented correctly
3. small/shallow tree ensemble only after dataset expansion
```

Avoid selecting a highly flexible model on the 61-row v4 sample.

The objective is generalization across website families, not Development-set leaderboard performance.

---

## 23. Metrics required in Evaluation v2

Report distributions for:

```text
precision
recall
specificity
f1
accuracy
ROC AUC
average precision
Brier score
log loss
expected calibration error
```

Also report:

```text
minimum
p10
median
p90
maximum
mean
```

### 23.1 Group/cohort diagnostics

Report metrics separately for sufficiently large groups:

```text
existing vs expansion cohort
AI source/builder family
human control source family
site category
framework bucket if pre-existing metadata supports it
```

Never publish a subgroup metric with an extremely small denominator without clearly marking it as unstable.

---

## 24. Abstention/indeterminate mode

A production-facing qualitative research tool does not need to force every page into a confident binary classification.

Research an indeterminate region chosen entirely within Development training.

Example concept:

```text
score < low threshold      → lower footprint orientation
score > high threshold     → higher footprint orientation
between thresholds         → indeterminate / mixed evidence
```

Measure:

```text
coverage
abstention rate
precision on decided rows
recall on decided rows
overall positive recall when abstentions remain unresolved
```

Do not claim 90/90 by hiding a large fraction of difficult examples. Coverage must be part of the release gate.

---

# PART E — PRODUCTION PROMOTION GATE

## 25. Collector gate

Before independent confirmation is authorized:

Recommended minimum:

```text
technical yield >= 90%
unknown technical errors <= 1%
collector-origin extraction failures <= 2%
```

Evaluate these over multiple frozen Development runs, not a single lucky run.

Also require:

```text
same contract
same browser/runtime identity policy
same feature schema
same retry rules
same replacement protocol
```

---

## 26. Development model gate

Suggested research gate before freezing a confirmation candidate:

```text
p10 grouped Precision >= 0.90
p10 grouped Recall >= 0.90
median Precision >= 0.92
median Recall >= 0.92
no major cohort below agreed floor
```

These are intentionally stricter than the eventual minimum claim because independent confirmation usually regresses relative to Development estimates.

If these are not achieved, do not open the independent confirmation set.

---

## 27. Independent confirmation gate

The final confirmation dataset must be:

- frozen before candidate scoring
- independent from Development project families
- independent from target groups
- untouched by threshold selection
- untouched by feature selection
- not used to choose model family

The frozen candidate must include:

```text
collector version
capture contract hash
feature contract hash
model artifact hash
threshold
runtime identity
confirmation manifest hash
```

### 27.1 Public performance claim

A new production version may claim 90/90 only if the frozen independent confirmation itself satisfies the approved gate.

Do not promote based on Development cross-validation alone.

---

# PART F — REPORT V2

## 28. New report sections

The current UI already shows score, drivers, recommendations, security baseline and technical evidence. Add explicit model-quality and uncertainty reporting.

### 28.1 Model reliability

Display:

```text
Production model version
release status
independent holdout total
successful holdout scans
technical coverage
precision
recall
F1
confirmation status
performance claim current: yes/no
```

If no current performance claim is valid, state that directly.

### 28.2 Evidence quality

Display:

```text
HTML fetched
assets discovered
assets selected
assets fetched
asset error count
asset coverage ratio
manifest linked/fetched
browser render capture used: yes/no
viewport count
```

### 28.3 Uncertainty

Add:

```text
classification state: decisive / indeterminate
score stability where available
model disagreement where available
feature coverage
known evaluation boundary
```

### 28.4 Capture metadata

Add to technical details:

```text
collector version
feature schema version
browser engine/version
viewport IDs
capture timestamp
contract hash
model hash
```

Do not expose internal security-sensitive infrastructure details unnecessarily in the customer UI; retain full details in research artifacts.

### 28.5 Failure boundary

Explicitly list what was not observed, for example:

```text
Repository not inspected
Private source code not inspected
Authenticated pages not inspected
Runtime user flows not exercised
Accessibility not fully audited
Core Web Vitals not measured by this scan
Security baseline is not a penetration test
```

---

## 29. Recommendation schema v2

Expand recommendations from:

```text
title
why
action
```

to:

```text
title
why
evidence
confidence
action
verify
basis
```

Example:

```js
{
  id: "security-csp",
  category: "security",
  priority: "high",
  title: "Content Security Policy härten",
  why:
    "Die aktuelle Policy erlaubt Inline-Ausführung und ist dadurch weniger restriktiv.",
  evidence: {
    type: "response-header",
    observed: "script-src contains unsafe-inline"
  },
  confidence: "high",
  action:
    "Inline-Ausführung entfernen und eine nonce- oder hash-basierte CSP verwenden.",
  verify:
    "Neu scannen und prüfen, dass script-src weder unsafe-inline noch unsafe-eval enthält.",
  basis: "observed"
}
```

Customer reports should make clear **why** an item exists and how the user can verify the remediation.

---

## 30. Additional report aspects

Add these areas when the evidence supports them.

### Engineering

- DOM size / complexity
- inline JavaScript bytes
- selected same-origin asset bytes
- asset fetch error ratio
- stylesheet count
- excessive fixed/absolute positioning
- responsive reflow consistency

### Design-system individuality

- repeated style cluster concentration
- radius concentration
- shadow concentration
- spacing rhythm concentration
- utility-pattern density
- responsive layout variation

Do not call these "AI proof". Present them as public-surface similarity/originality signals.

### Security

- HTTPS
- HSTS
- CSP
- frame protection
- `nosniff`
- Referrer Policy
- Permissions Policy

Potential later additions, kept separate from the main score:

- COOP
- CORP
- COEP where relevant
- cache policy for sensitive endpoints
- secure cookie observations only if cookies are actually visible and safely evaluable

### Accessibility boundary

Automatable observations may include:

- missing document language
- obvious unlabeled form controls
- heading structure anomalies
- missing image alt attributes when detectable
- focusable/disabled semantics

But retain a manual accessibility smoke-test recommendation because public DOM heuristics cannot establish WCAG compliance.

### Data/privacy

Report:

```text
No login used
No private repository accessed
No raw HTML persisted by isolated collector
No full visible text persisted by isolated collector
No screenshots persisted by isolated collector
Aggregate feature payload only
```

---

# PART G — CURRENT PRODUCT BUGS / HARDENING

## 31. `performanceClaimCurrent` response-contract bug

Current response validation requires:

```js
value.performanceClaimCurrent === false
```

That will reject a future legitimate release where the field becomes `true`.

Change the model validator to accept a boolean:

```js
const model = (value) =>
  object(value) &&
  text(value.version) &&
  text(value.releaseStatus) &&
  nonNegativeInteger(value.independentHoldout) &&
  nonNegativeInteger(value.successfulHoldoutScans) &&
  bounded(value.technicalCoverage, 0, 1) &&
  bounded(value.precision, 0, 1) &&
  bounded(value.recall, 0, 1) &&
  bounded(value.f1, 0, 1) &&
  text(value.confirmationStatus) &&
  boolean(value.performanceClaimCurrent);
```

Add tests for both:

```text
performanceClaimCurrent = false
performanceClaimCurrent = true
```

---

## 32. CSP hardening

The current production configuration still uses `unsafe-inline` in `script-src`.

Target state:

```text
no unsafe-eval in production
no unsafe-inline in production script-src
no wildcard script origins
```

Because the app currently builds with Webpack and can benefit from static rendering, investigate Next.js Subresource Integrity as the first path before switching the entire application to dynamic nonce rendering.

A target configuration shape:

```ts
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self'${isDev ? " 'unsafe-inline' 'unsafe-eval'" : ""}`,
  `style-src 'self'${isDev ? " 'unsafe-inline'" : ""}`,
  "font-src 'self'",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "upgrade-insecure-requests"
].join("; ");

const nextConfig: NextConfig = {
  experimental: {
    sri: {
      algorithm: "sha256"
    }
  },

  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: csp },
        {
          key: "Permissions-Policy",
          value: [
            "camera=()",
            "microphone=()",
            "geolocation=()",
            "payment=()",
            "usb=()",
            "serial=()",
            "bluetooth=()",
            "accelerometer=()",
            "gyroscope=()",
            "magnetometer=()"
          ].join(", ")
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains"
        },
        { key: "X-Content-Type-Options", value: "nosniff" },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin"
        }
      ]
    }];
  }
};

export default nextConfig;
```

Validate this against the deployed Next.js version before production rollout because SRI support is version-sensitive/experimental.

---

## 33. Remove avoidable inline styles from the report

The score ring currently uses an inline CSS custom property for the angle.

Replace the conic-gradient implementation with SVG or another CSP-compatible rendering path.

Example:

```tsx
function ScoreRing({
  score,
  language
}: {
  score: number;
  language: Language;
}) {
  const label = language === "en" ? "out of 100" : "von 100";
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - score / 100);

  return (
    <div className="score-ring-svg" aria-label={`${score} ${label}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle
          className="score-ring-track"
          cx="60"
          cy="60"
          r={radius}
        />
        <circle
          className="score-ring-progress"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={progress}
        />
      </svg>

      <div className="score-ring-inner">
        <strong>{score}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
```

If CSP style restrictions are later tightened further, avoid dynamic React `style={...}` usage in the report unless explicitly nonce-compatible.

---

# PART H — TEST PLAN

## 34. Collector tests

Add deterministic tests for:

```text
401 → http_blocked_or_denied → no retry
403 → http_blocked_or_denied → no retry
404 → http_not_found → no retry/replacement eligible
429 → http_rate_limited → retry
DNS temporary failure → retry
navigation timeout → retry
helper install failure → retry
computed style extraction failure → retry
success on retry 2 → capture accepted once
```

Verify audit rows include:

```text
retry_number
attempt_id
outcome_code
terminal_stage
elapsed_ms
browser_version
collector_version
```

---

## 35. Privacy schema tests

Fail the build if capture payload contains any exact key matching or semantically equivalent to:

```text
url
hostname
label
builder
provenance
raw_html
html
visible_text
text
screenshot
image
```

Retain the existing strict allowlist approach.

---

## 36. Group leakage tests

Construct synthetic rows:

```js
const rows = [
  { sample_id: "a1", target: 1, target_group: "A" },
  { sample_id: "a2", target: 1, target_group: "A" },
  { sample_id: "b1", target: 0, target_group: "B" },
  { sample_id: "b2", target: 0, target_group: "B" }
];
```

Assert that both `A` rows always occur in the same fold and both `B` rows always occur in the same fold.

Add a hard assertion before every evaluation run:

```text
No target_group may appear in both train and test.
```

---

## 37. Nested selection tests

Record an audit structure such as:

```json
{
  "outer_seed": 1,
  "outer_fold": 0,
  "test_groups": ["..."],
  "selected_by_inner_cv": {
    "model": "logistic",
    "l2": 10,
    "threshold": 0.57,
    "feature_contract": "v2"
  }
}
```

Test that test-group labels/predictions are not passed to configuration-selection code.

---

## 38. Report contract tests

Add response parser coverage for:

```text
performanceClaimCurrent true/false
new recommendation evidence fields
new uncertainty fields
collector metadata
model reliability block
```

The UI must fail closed on malformed model metadata but must not hard-code that a performance claim is always false.

---

# PART I — IMPLEMENTATION SEQUENCE

## 39. Phase 0 — immediate product fixes

Implement before Collector v5 research:

1. fix `performanceClaimCurrent` boolean validation
2. add tests
3. verify production CSP/Permissions-Policy against actual deployed response
4. remove obsolete or misleading report wording if deployment and source differ

Expected risk: low.

---

## 40. Phase 1 — Collector v5 reliability

Implement:

1. new v5 contract
2. new terminal outcomes
3. retry allowlist
4. fresh-context retry loop
5. improved stage attribution
6. extraction caches
7. CSS budget early termination
8. v5 unit tests
9. six-site smoke pilot

Gate:

```text
no schema regressions
no privacy regressions
no isolation regressions
100% expected behavior in synthetic failure tests
```

---

## 41. Phase 2 — frozen technical pilot

Run a small label-blind pilot with:

```text
same primary rows as prior pilot where useful
same two viewports
frozen contract
frozen images/runtime
```

Repeat after the predeclared time interval.

Measure:

```text
success consistency
retry recovery rate
feature stability
runtime cost
mobile/desktop delta stability
```

Do not evaluate model performance until capture/repeat review is frozen.

---

## 42. Phase 3 — Development expansion

Before running:

1. freeze primary manifest
2. freeze reserve manifest
3. freeze replacement ordering
4. freeze capture contract
5. freeze feature schema

Target at least 200 successful Development captures if feasible.

After capture freeze:

1. join labels
2. build Feature Contract v2 matrix
3. run grouped nested evaluation
4. report p10/median/p90 metrics
5. report subgroup/cohort diagnostics

---

## 43. Phase 4 — candidate freeze

Only if Development gates pass:

Freeze:

```text
collector image/runtime identity
capture contract
feature contract
feature list
model family
regularization
class weighting
threshold selection algorithm
final fitted model artifact
```

Hash every artifact.

No further tuning after candidate freeze.

---

## 44. Phase 5 — independent confirmation

Build an untouched manifest from project families not present in Development.

Run once according to the frozen confirmation protocol.

Possible decisions:

```text
PASS → authorize production release process
FAIL → keep v0.4; return to Development with a new version namespace
INCONCLUSIVE → do not claim 90/90; decide whether a larger pre-frozen confirmation is justified
```

Never rerun the same holdout repeatedly until it passes unless the protocol explicitly treats the first result as invalid for a predeclared technical reason.

---

# PART J — REPORT DESIGN DIRECTION

## 45. Reduce generic card-heavy presentation

The current results interface uses many rounded containers, pills and card subdivisions. This is functional, but it can reinforce the same generic visual patterns the product critiques.

For Report v2, move toward a technical audit/research-instrument visual language:

- fewer nested cards
- flatter sections
- stronger grid/table structure
- more direct metric/evidence presentation
- monospace treatment for hashes, versions and numeric diagnostics
- severity indicated with a narrow status rail rather than large badges
- confidence/evidence shown next to each recommendation
- fewer decorative shadows
- fewer rounded pills
- clearer distinction between measurement, interpretation and advice

Do not change visuals merely to reduce the model score. The objective is product clarity and originality, not gaming VibeBench.

---

# PART K — DEFINITION OF DONE

## 46. Collector v5 done

Collector v5 is technically ready for Development expansion when:

- all v5 unit tests pass
- no prohibited fields can persist
- retry behavior matches the frozen policy
- non-retryable access controls are never bypassed
- isolated runtime validation passes
- extraction has no known unclassified failure path
- pilot repeats show acceptable stability

## 47. Feature Contract v2 done

Feature Contract v2 is ready when:

- exact feature list is frozen
- all values are finite
- browser outputs remain privacy-minimal
- literal URLs/text/class names are not persisted
- responsive features are deterministic under repeat tests
- feature distributions are documented

## 48. Evaluation v2 done

Evaluation v2 is ready when:

- target groups are exclusive across train/test
- leakage tests pass
- threshold selection is nested
- all primary and calibration metrics are emitted
- subgroup diagnostics are emitted
- results are reproducible from seeds + frozen artifacts

## 49. Production candidate done

A candidate is eligible for independent confirmation only when:

- technical Development gate passes
- grouped p10 Precision/Recall gate passes
- candidate artifact is frozen
- no Development tuning occurs afterward

## 50. Production promotion done

A production promotion requires:

- untouched independent confirmation
- approved Precision/Recall gate passed
- technical coverage gate passed
- release artifact hashes recorded
- customer-facing wording updated to match the actual evidence
- production response contract supports the new release state

---

# 51. Recommended immediate coding order

Execute in this exact order:

1. `lib/scan-contract.mjs` — fix `performanceClaimCurrent` boolean validation.
2. Add regression test for both claim states.
3. Create `option_b_capture_contract_v5.json`.
4. Fork v4 collector into `lib/option-b-v5-capture.mjs`.
5. Add cached visibility/style/depth extraction.
6. Add new terminal outcome taxonomy.
7. Build fresh-context retry loop.
8. Add retry-policy tests.
9. Add desktop + mobile capture contract.
10. Run v5 six-site smoke pilot.
11. Freeze repeat and compare surface stability.
12. Create Feature Contract v2.
13. Add distribution/entropy/responsive features.
14. Implement true grouped folds.
15. Add leakage assertions/tests.
16. Implement nested threshold/model selection.
17. Freeze larger primary + reserve Development manifests.
18. Run Development expansion.
19. Review p10 grouped Precision/Recall.
20. Only if gates pass, freeze a new candidate and authorize independent confirmation.

---

# 52. Final recommendation

The current v4 result should be treated as a successful **research infrastructure milestone**, not as a failed production model release.

It established:

- reproducible isolated capture
- label-blind collection
- strict privacy-minimal persistence
- a working derived feature path
- a clear empirical signal that the present 38-feature representation is not enough for a reliable 90/90 target

The next version should focus first on **capture reliability, methodological isolation and feature information density**.

The priority is therefore:

> **fix collection → fix evaluation → improve features/data → validate independently**

not:

> **search thresholds/models until Development reports 90/90**

Until a new candidate passes an untouched independent confirmation, production should remain on the currently frozen v0.4 Research Beta and no new 90/90 customer-facing performance claim should be introduced.
