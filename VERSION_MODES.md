# VibeFootprint report versions

## Commercial version

- Fixed commit: `e971bbd`
- Local branch: `commercial-version`
- Fixed tag: `commercial-version-v1`
- Behavior: summary is public; the real detailed report is protected and the commercial unlock area is shown.

This snapshot must remain unchanged while the free testing version is collecting feedback.

## Free testing version

- Active development branch: `main`
- Default server mode: `free-test`
- Behavior: every successful scan includes and opens the real unblurred full report. No checkout or access key is required.
- The report still excludes raw HTML and other raw source material.

The optional server variable `VIBEFOOTPRINT_REPORT_MODE=commercial` restores protected report behavior in this code line. Leaving it unset uses the free testing mode.

## Commercialization handover

After feedback is accepted:

1. Freeze the final testing results and feedback notes.
2. Restore commercial report access from `commercial-version` or set `VIBEFOOTPRINT_REPORT_MODE=commercial`.
3. Re-run the full automated and browser checks.
4. Only then connect pricing, checkout, entitlement storage and Stripe webhooks.
