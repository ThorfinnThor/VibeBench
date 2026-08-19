# VibeFootprint safe enhancement review

Date: 2026-08-19

## Untouched restore point

The working production baseline was preserved before any enhancement work:

- commit: `c6df0c813f0eb7022f4d5f14bf541102184563e6`
- remote baseline: `origin/main` pointed to the same commit at backup time
- local branch: `backup/pre-enhancements-2026-08-19`
- annotated tag: `vibefootprint-safe-c6df0c8-2026-08-19`
- verified full bundle: `../VibeFootprint-Backups/vibefootprint-c6df0c8-2026-08-19.bundle`
- bundle SHA-256: `094e463c36529b6310420be8462743e9e1bc1efa7269c89cc911ae54006f3bec`

The branch and tag point to the baseline and were not checked out or modified. To inspect it without altering the current branch:

```bash
git show vibefootprint-safe-c6df0c8-2026-08-19
```

To restore into a separate directory from the independent bundle:

```bash
git clone ../VibeFootprint-Backups/vibefootprint-c6df0c8-2026-08-19.bundle VibeFootprint-restored
```

## Baseline verification

Before implementation the baseline passed:

- 146/146 automated tests
- ESLint
- production build
- `git diff --check`

## Decision table

| Proposal | Decision | Reason and implementation boundary |
| --- | --- | --- |
| Stable finding IDs | Implement | Deterministic IDs improve report references without changing model inputs, coefficients, thresholds or scores. |
| Signal taxonomy | Prepare behind protected boundary | Added deterministic classification for genericness, technology context, structural evidence and quality findings. It is not returned by the free API. |
| Benign technology context | Implement | Builder provenance is context, not automatically an actionable quality problem or free category issue. |
| Coding-agent remediation prompts | Prepare behind protected boundary | Added deterministic bilingual prompt generation with anti-gaming constraints, acceptance criteria, validation and rescan language. No LLM/API key is required. |
| Top-three fix pack | Prepare behind protected boundary | Added a deterministic generator that excludes guidance and benign technology context. The free API exposes no prompts or findings. |
| Local before/after comparison | Implement in free UI | Stores only minimized summary data in browser `localStorage`, keeps three scans per hostname, offers host-scoped deletion and makes no causal claim. |
| Public Launch Check | Prepare behind protected boundary | Added presence checks for public HTML/header basics without a readiness score and without affecting either existing score. Not exposed until paid-report delivery exists. |
| Explicit scan limitations | Implement in methodology | Clarifies that the scan does not test flows, backend, repository, full performance or full accessibility. |
| Checkout / entitlement | Defer | A fake unlock or client-side entitlement would break the protected-report boundary. Requires a real product and payment decision. |
| Detailed report in `/api/scan` | Reject | Would expose protected findings, evidence and remediation in the free response. API v3 remains summary-only. |
| Full functional, payment, Lighthouse, Core Web Vitals or accessibility testing | Reject for this iteration | Cannot be represented honestly with the current bounded public-surface collector. |
| Screenshot AI classifier, crawler or authorship probability | Reject | Outside the evidence boundary and would create misleading claims. |

## Protected architecture boundary

The free route remains `SCAN_API_VERSION = 3` and returns only:

- Vibe-Footprint summary;
- separate security summary;
- evidence breadth;
- five-category counts/status;
- locked report-access state.

It still rejects detailed keys including recommendations, score drivers, direct evidence, stack signals, structural hints, metrics and model internals. The new taxonomy, launch checks and fix prompts are reusable server-side building blocks only. A later paid-report endpoint must recompute or securely retrieve protected detail after entitlement verification; it must never trust a browser-only unlock.

## Product behavior added

1. A successful scan creates a privacy-minimized local summary for the scanned hostname.
2. A later scan of the same hostname shows descriptive deltas for the Vibe-Footprint, security baseline and observed category count.
3. A warning appears when evidence breadth differs between the compared scans.
4. The user can delete the hostname's local history.
5. The methodology now states explicit non-capabilities.
6. The locked-report offer accurately mentions three coding-agent fix prompts and a public launch check, while the data remains protected.

## Unchanged invariants

- no model coefficient, feature, threshold, score band or score interpretation changed;
- no frozen research artifact, dataset, benchmark or validation result changed;
- no security-score formula changed;
- no additional network request, crawler, browser collector or LLM call was added to production scanning;
- scan retry, admission, URL policy, peer pinning and response limits remain unchanged;
- the free API still contains no protected detail.
