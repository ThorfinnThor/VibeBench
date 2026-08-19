# VibeFootprint staged scan and report access — 2026-08-19

## Outcome

The free scan now uses a transparent ten-second presentation window, reveals only a decision-ready summary, and presents the detailed diagnostic as a locked premium preview. No detailed result is hidden only with CSS: the public API response no longer contains premium findings or technical evidence.

## Implemented

- Added a minimum 10,000 ms result-reveal window plus a 350 ms completion hold.
- Added a continuous 0–100 progress indicator with distinct acquisition and report-preparation stages.
- Progress copy explicitly describes the complete scan and report-preparation flow; it does not claim that the network request itself takes ten seconds.
- Preserved cancellation, client timeout and the single bounded automatic retry.
- Added a free overview with:
  - Vibe-Footprint score and band;
  - separate public security-baseline score;
  - evidence breadth;
  - five top-level category summaries with issue counts and severity.
- Added a critical-but-controlled visual language for categories that need attention.
- Added a locked full-report preview with warning accents and generic placeholder content.
- Added an honest unlock boundary: the call to action explains that checkout is not connected yet.
- Changed the downloadable/shareable artifact into a free summary. It no longer includes individual findings.

## Data-access boundary

Public scan API version `3` returns only:

- request and target metadata;
- Vibe-Footprint score/band/meaning;
- evidence-breadth summary;
- security score with aggregate pass/review/missing counts;
- five category summaries;
- a locked-report access declaration.

The response contract rejects score drivers, recommendations, model diagnostics, individual evidence, asset/manifest diagnostics, structural metrics and warning-detail fields. Therefore removing blur or editing the DOM cannot reveal the paid report.

## Verification

- 145 automated tests passed.
- ESLint passed.
- Next.js production build passed.
- Browser verification against the live VibeFootprint target completed.
- Measured result reveal: approximately 10.34 seconds.
- At approximately 3.9 seconds the interface showed 36%, a report-preparation stage and no result.
- English and German category/locked-report copy were verified.
- Detailed driver and recommendation sections were absent from the free DOM.

## Product boundary

This sprint does not yet create or persist an actual purchasable full report. A secure commercial flow still needs server-side report storage/generation, payment confirmation and entitlement-bound retrieval. The current locked section is a safe conversion preview, not a fake checkout.

## Next decisions and work

1. Choose pricing and payment model: recommended first version is a one-time report purchase via Stripe Checkout.
2. Define the full-report artifact and its retention period.
3. Add authenticated or signed entitlement-bound report retrieval.
4. Add Stripe webhook verification and idempotent fulfillment.
5. Add conversion analytics for scan completion, unlock click, checkout start and purchase.
6. Run a focused production accessibility and mobile-device QA pass after checkout integration.

## Report-preview refinement

The first preview used generic blurred shapes. It was replaced with a realistic structural representation of the intended paid report.

- Removed the ambiguous `≠` symbol between the two free scores.
- Replaced it with the explicit labels `Separate scores` and `Getrennte Scores`.
- Established one fixed six-section premium-report structure:
  1. Executive summary;
  2. Score drivers;
  3. Priority findings;
  4. Security review;
  5. Improvement plan;
  6. Technical appendix.
- The locked preview now visually mirrors this format with score cards, driver columns, critical and review findings, warning colors and a report index.
- The preview still contains no private premium findings. It combines already-public scores with neutral structural placeholders, so removing the blur cannot reveal paid evidence.
- Fixed the saved-language hydration mismatch discovered during browser verification.
