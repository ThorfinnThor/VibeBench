# VibeFootprint customer experience sprint — 2026-08-19

## Outcome

The production-facing v0.4 Research Beta now explains its qualitative
Vibe-Footprint beside the result, keeps the public security baseline visibly
and semantically separate, retries one eligible transient scan failure, and
provides a client-ready report surface.

## Implemented

- Replaced public probability-shaped response fields with the API v2
  qualitative score contract. The public result contains a 0–100 similarity
  index, band, meaning and interpretation boundary only.
- Removed the `AI probability` / `AI-Wahrscheinlichkeit` wording from the
  production UI, localization output and release description.
- Added one controlled automatic retry for a fixed allowlist of transient
  outcomes. Rate limits, invalid input and terminal failures are never retried
  automatically.
- Preserved manual retry after the automatic attempt and retained any previous
  successful result while a new scan is pending or fails.
- Localized raw scan payloads in the client so switching EN/DE also translates
  an already visible result. This fixes mixed-language result pages.
- Added an explicit footprint label beside the primary score and an explicit
  independent-security label beside the header baseline.
- Removed the security number from the footprint evidence snapshot to prevent
  the impression that it contributes to the footprint score.
- Added a customer-report section with:
  - side-by-side independent scores;
  - native share with clipboard fallback;
  - copyable Markdown summary;
  - downloadable Markdown report;
  - print / save-as-PDF presentation.
- Added print styles that remove navigation and research-detail noise while
  retaining the result, customer summary, recommendations and security checks.

## Verification

- `npm test`: 141/141 passing.
- `npm run lint`: passing after final cleanup.
- `npm run build`: production build passing.
- Browser QA on the local production UI:
  - English default verified;
  - successful public scan verified;
  - customer-report layout verified;
  - existing result switched EN → DE → EN without mixed-language content;
  - transient timeout performed exactly one automatic retry and then rendered
    an actionable English technical outcome;
  - no browser console warnings or errors.

## Product boundary retained

The Vibe-Footprint remains a qualitative similarity index. It does not estimate
code origin, generated-code share or authorship. The separate security baseline
checks selected public response headers and is not a penetration test.

## Recommended next work

1. Persist report snapshots behind opaque share links with expiry and deletion.
2. Add first-party product analytics for scan success, retry recovery and report
   actions without storing submitted full URLs.
3. Add a queued/async scan path for sites that cannot finish inside the current
   serverless request budget.
4. Run moderated customer comprehension testing on the score and report wording.
5. Keep v6 classifier research isolated from this production-facing beta.
