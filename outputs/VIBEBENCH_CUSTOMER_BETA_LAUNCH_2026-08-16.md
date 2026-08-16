# VibeBench Customer Beta Launch

Date: 2026-08-16
Product: `0.4.1`
Model: frozen `v0.4`
Status: **READY FOR LIMITED CUSTOMER BETA**

## Customer entry point

- Production: https://vibe-bench-cyan.vercel.app
- Input: one publicly reachable HTTP(S) website URL
- Output: a qualitative Vibe-Footprint from 0 to 100, visible score drivers,
  a separate security baseline and prioritized improvements
- Expected scan time: usually a few seconds, with a hard bounded request budget

The result is an uncalibrated public-surface similarity index. It is not an AI
probability, not a percentage of AI-generated code and not proof of authorship.
The interface presents these limits before and after each scan.

## Launch safety completed

- Main documents and selected same-origin assets have strict byte, media-type,
  redirect, encoding and deadline limits.
- Every DNS answer must be public. The selected public answer is pinned into the
  HTTP(S) socket and the connected peer IP is verified before a response is
  accepted. This closes the previously documented DNS-check/connect TOCTOU gap.
- Local, private, reserved, credential-bearing, non-standard-port and
  non-HTTP(S) targets fail closed.
- Responses are `private, no-store`; application diagnostic events contain a
  request ID, bounded byte totals, duration and outcome, but no full target URL.
- Per serverless instance: at most four concurrent scans, one concurrent scan
  per target and 20 admitted scans per client per ten-minute window.
- Vercel Firewall rule `VibeBench scan beta limit` is active for `/api/scan`:
  fixed window, 20 requests per 600 seconds per IP, then HTTP 429.
- Vercel's platform-wide DDoS mitigation remains active.
- The product remains explicitly labelled Research Beta and the historical
  Precision/Recall values remain Legacy, not a current performance claim.

## Verification required for every release

```bash
npm test
npm run lint
npm run build
git diff --check
```

Production smoke:

1. `GET /` returns HTTP 200 and the expected product title.
2. `POST /api/scan` with `https://example.com` returns a versioned success
   payload, request ID, score, security checks and recommendations.
3. A private or credential-bearing URL returns a versioned technical non-result
   and never attempts a connection.
4. Desktop and 390 px mobile views have no horizontal overflow and keep the
   scan, result, error recovery and Methodology content usable.
5. Vercel production points to the intended GitHub `main` commit and reports
   deployment status `Ready`.

## Customer-facing operating guidance

- Use only public pages that the customer is authorized to inspect.
- Do not enter login URLs, credentials, private dashboards, repositories or
  internal hosts.
- Treat recommendations as a prioritized review checklist; validate changes in
  staging before production deployment.
- If a scan fails, retain the displayed Request ID and outcome. A technical
  failure is never interpreted as a low or high Vibe-Footprint.
- Compare a website again after meaningful changes; small score movements are
  not independently calibrated.

## Rollback and incident response

- Vercel supports immediate rollback to the previous Ready production
  deployment.
- The Firewall rule can be disabled independently of deployment; during abuse,
  reduce the API limit or temporarily challenge/deny `/api/scan` rather than
  weakening the scanner's outbound safety checks.
- If peer verification, bounded streaming, response-contract validation or CI
  fails, do not release a score. Roll back or disable scans until fixed.

## Research work that does not block customer beta

The Option-B-v4 collector is a Development research track and is not the live
customer scoring model. The accepted early repeat authorizes exactly one frozen
20-site technical extension. It does not authorize the 81-site run, independent
Confirmation, a model change or a stronger public performance claim.

Before promoting the product beyond a limited Research Beta, still complete a
fresh preregistered independent Confirmation on the final collector/features,
define a support and external observability policy, and decide whether customer
accounts, contractual terms or paid plans are required.
