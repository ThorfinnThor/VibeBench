# VibeBench blind holdout execution protocol v0.1

Status: preregistered before the first holdout scan  
Protocol date: 2026-08-10  
Holdout size: 100 websites (50 AI, 50 Human)

## Fixed inputs

- Manifest: `vibebench_blind_holdout_100_v0_1.csv`
- Expected manifest SHA-256: `5c2a5b34305a2b7ae85b7b21f56f10bf0ba91a371b1b89c3d231cbb28a082de3`
- Scanner source commit: `6338a3a377ab58eb3f49b8cae4df45f4eb60abc0`
- Production endpoint: `https://vibe-bench-cyan.vercel.app/api/scan`
- Positive scanner result: `direct` or `indicative`
- Negative scanner result: `indeterminate`
- Technical failure: request timeout, non-success API response, malformed response, or missing/unknown verdict

The runner must stop before scanning if the manifest hash differs, the sample count is not 100, the label balance is not 50/50, or scanner files under `app/` or `lib/` differ from the fixed scanner commit.

## Execution

1. Validate the frozen manifest and the freeze lock.
2. Make one schema smoke request with a Development-set URL; this request is not part of the holdout results.
3. Scan all 100 holdout targets sequentially in manifest order.
4. Use a 30-second client timeout and at least 300 ms spacing between requests.
5. Persist every attempt immediately to an append-safe checkpoint.
6. After the initial pass, retry technical failures exactly once. Do not retry a valid `indeterminate` result.
7. Start a retry no sooner than ten seconds after the failed attempt completed.
8. Do not alter markers, thresholds, scanner code, labels, URLs, or evaluation definitions during the run.
9. A scanner rule change after opening results requires a new holdout and must not be evaluated on this set as an independent test.

The checkpoint may be resumed after interruption. A completed sample is never scanned again. Once the final raw-results artifact exists, the runner refuses another run unless its source is deliberately changed in a new version.

## Stored fields

For every sample and every attempt, store timestamps, duration, HTTP response status, technical success, error, requested and resolved URL, target HTTP status, verdict, evidence arrays, stack signals, structural hints, page metrics, asset-scan metrics, manifest-scan metrics, and the unmodified JSON payload returned by the endpoint.

The final run metadata also stores the endpoint, timeout, pacing, retry rule, manifest hash, freeze-lock hash, scanner commit, runner commit, start/end timestamps, and runtime versions.

## Primary reporting

Technical completion is reported separately from classification quality. Classification metrics use only technically successful final results.

- Confusion matrix: TP, FP, TN, FN
- Accuracy
- Precision / positive predictive value
- Recall / sensitivity
- Specificity
- False-positive rate
- F1 score
- AI direct-evidence rate
- AI direct-or-indicative detection rate
- Human direct and indicative false-positive counts
- Technical success and error counts by label and target group
- Verdict distribution by builder/control stratum

For proportion and classification metrics, report deterministic stratified-bootstrap 95% percentile intervals with 10,000 replicates and seed `20260810`. The bootstrap samples AI and Human successful rows separately with replacement.

## Interpretation boundary

This holdout estimates the behavior of the frozen evidence scanner on this curated, provenance-reviewed set. It is not a population prevalence estimate, an authorship proof, or a calibrated probability that any arbitrary website was created with AI. Builder-level groups contain only ten sites each and must be interpreted as directional diagnostics.
