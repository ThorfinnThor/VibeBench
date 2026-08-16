# VibeFootprint Collector v5 / Model v0.6 implementation status

Updated: 2026-08-16

## Product state

- The customer-facing production model remains the frozen **v0.4 Research Beta**.
- Its historical 82.4% Precision / 85.7% Recall result remains labelled
  `LEGACY_CAPTURE_COMPLETENESS_UNVERIFIABLE`; it is not a current 90/90 claim.
- Collector v5 and model v0.6 are a separate research namespace. Nothing in
  this work silently promotes a model into production.

## Completed

### Phase 0 — product and contract fixes

- `performanceClaimCurrent` accepts both valid boolean states and has a
  regression test.
- Deployed CSP and Permissions-Policy behavior was verified and hardened.
- Customer wording distinguishes a qualitative public-surface footprint from
  authorship probability or percentage of AI-generated code.

### Phase 1 — isolated Collector v5

- v5 has a separate namespace and preserves v4 artifacts unchanged.
- It runs in a disposable non-root Playwright container behind the pinned
  egress proxy.
- Fresh browser contexts are used for retries; retryable and terminal outcomes
  are explicitly classified.
- Visibility/style/depth work is cached and CSS traversal terminates at the
  frozen budget.
- Desktop and mobile viewports are captured without URLs, raw HTML, visible
  text or screenshots in persisted payloads.

### Phase 2 — frozen technical pilot

- Two label-blind six-site runs used the same frozen contract and runtime.
- Both produced five complete sites and one content-ineligible site.
- All ten viewport keys repeated, structure and visible-element counts were
  stable, and six payloads matched byte-for-byte.
- This established technical repeatability only; it did not inspect model
  performance.

### Phase 3 — frozen Development design

- Primary manifest: 200 project-family-exclusive sites, balanced 100 AI / 100
  Human.
- Reserve manifest: 61 pre-registered technical replacements.
- Replacement ordering, capture contract, 155-feature paired Feature Contract
  v2 and grouped nested evaluation protocol are frozen.
- Group-CV keeps project families exclusive. Feature/model/threshold selection
  occurs only inside inner training folds.
- Candidate selection and the two-run collector gate are predeclared and cannot
  authorize themselves or production.

## Live execution and incident record

The first 200-site execution (`31961290645`) processed the full primary
manifest and produced exactly 180 complete primary sites (90.0% raw technical
yield). It then exhausted the container's Node heap while constructing one
monolithic JSON string, before a valid primary artifact could be finalized.
That run is technically invalid and is not used for model evaluation.

Two reauthorized diagnostic runs exposed and then fixed unbounded browser
cleanup/readiness calls. Run 5 (`31972093367`, artifact `9270458119`) completed
all 200 primary and 61 reserve targets without a cleanup stall. The original
finalizer then hit `RangeError: Invalid string length`; its capture rows are now
streamed and hashed without constructing one giant string. The raw run-5
capture was not changed or repeated during this recovery.

Run-5 capture result:

- primary: 175/200 complete pairs (87.5%);
- reserve: 53/61 complete pairs (86.9%);
- final Development matrix: 200/200 after 25 frozen replacements;
- unknown terminal errors: 0/522;
- collector-origin extraction failures: 1/522 (0.19%);
- privacy, runtime identity and label-blind capture gates passed;
- collector-promotion yield gate failed.

The true nested grouped evaluation is now complete. Across the 25 outer test
folds, p10 Precision is 69.2%, p10 Recall 65.0%, median Precision 78.3% and
median Recall 80.0%. The Development 90/90 gate failed materially. No
candidate freeze, second repeat, independent confirmation or production
promotion is authorized.

## Frozen release gates

Collector gate, over two independent frozen Development runs:

- primary technical yield at least 90% in each run;
- aggregate terminal unknown technical errors at most 1%;
- aggregate terminal collector-origin extraction failures at most 2%.

Development model gate:

- p10 grouped Precision at least 0.90;
- p10 grouped Recall at least 0.90;
- median Precision at least 0.92;
- median Recall at least 0.92;
- no material cohort failure hidden by aggregate performance.

Production promotion additionally requires one untouched independent
confirmation whose manifest is frozen after the candidate is sealed and which
is never used for feature, model-family or threshold selection.

## Next steps

1. Keep v0.4 as the customer-facing Research Beta and retain the legacy label
   on its historical confirmation figures.
2. Do not spend another frozen v5 repeat or untouched confirmation set on this
   failed candidate.
3. Decide the next research target before opening v6: binary AI/Human origin
   classification, or a narrower public-surface similarity score with no
   authorship claim.
4. For either target, diagnose the high-risk existing-site cohort and the
   remaining live-site acquisition failures before freezing a new protocol.
5. Preserve the 90/90 gate; do not tune or relabel against this run as though it
   were independent evidence.
