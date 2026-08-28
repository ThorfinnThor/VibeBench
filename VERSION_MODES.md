# VibeFootprint report versions

## Commercial version

- Fixed commit: `e971bbd`
- Local branch: `commercial-version`
- Fixed tag: `commercial-version-v1`
- Behavior: summary is public; the real detailed report is protected and the commercial unlock area is shown.

This is now the safe default for customer-facing deployments.

## Free testing version

- Explicit server mode: `free-test`
- Behavior: every successful scan includes the real unblurred full report for a controlled founding-customer review.
- The report still excludes raw HTML and other raw source material.

The server defaults to protected commercial behavior. `VIBEFOOTPRINT_REPORT_MODE=free-test` must be set deliberately to include full reports without an entitlement.

## Commercialization handover

After feedback is accepted:

1. Qualify the B2B request through the customer-beta contact page.
2. Confirm scope, timing and price in an individual offer.
3. Enable a full report only for the agreed delivery workflow.
4. Add checkout and automated entitlements later, once the initial offer is validated.
