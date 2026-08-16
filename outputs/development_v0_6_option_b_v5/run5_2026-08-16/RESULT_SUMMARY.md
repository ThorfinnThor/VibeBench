# VibeFootprint v5 Development run 5 result

Date: 2026-08-16  
Workflow run: `31972093367`  
Artifact: `9270458119`

## Outcome

The label-blind capture completed and produced a valid balanced Development
matrix of 200 project-family-exclusive sites. It is suitable for Development
research, but neither the collector-promotion gate nor the 90/90 model gate
passed. No candidate was frozen and no independent confirmation or production
promotion is authorized.

## Collector

- Primary: 175/200 complete paired captures (**87.5% yield**).
- Reserve: 53/61 complete paired captures (**86.9% yield**).
- Frozen matrix: 200/200 complete pairs after 25 pre-registered replacements.
- Unknown terminal errors: 0/522 (**0.0%**).
- Collector-origin extraction failures: 1/522 (**0.19%**).
- Context-close timeouts/errors: 0/0 for both primary and reserve.
- The previous reserve-page stall is fixed; all 61 reserve targets terminated.

The complete matrix passes the label-join integrity gate. The separate
collector-promotion gate fails because primary yield is below 90%.

## True grouped nested evaluation

The evaluation used 200 unique project families, five outer seeds, five outer
folds, four inner folds, six predeclared linear configurations and thresholds
selected only within inner training folds.

| Metric | Minimum | p10 | Median | p90 | Mean |
|---|---:|---:|---:|---:|---:|
| Precision | 63.6% | **69.2%** | **78.3%** | 86.7% | 78.8% |
| Recall | 50.0% | **65.0%** | **80.0%** | 90.0% | 79.6% |
| F1 | 66.7% | 68.6% | 78.3% | 85.0% | 78.4% |
| Accuracy | 65.0% | 72.5% | 77.5% | 85.0% | 78.3% |
| ROC AUC | 76.3% | 81.5% | 85.0% | 93.0% | 85.7% |

The predeclared release requirements were p10 Precision/Recall >=90% and
median Precision/Recall >=92%. The observed result is materially below both
requirements. Selective decisions also do not rescue the gate: p10 decided
Precision is 70.8%, p10 decided Recall is 64.3%, and p10 coverage is 77.5%.

The frozen feature artifact is stored as gzip bytes encoded in base64 so it
can remain in the repository without altering the evaluated JSON bytes. Decode
the `.json.gz.base64` file, then gunzip it; the recovered JSON SHA-256 is
`d60517ec1d73ff11a0799cf0bccaa5c7e04e0feeb3335a0b02a3541c5d789d34`.

## Decision

1. Keep customer-facing v0.4 labelled as a Research Beta and keep its old
   confirmation numbers marked as legacy.
2. Do not run the second frozen v5 Development repeat: the first valid run
   already fails both the collector-promotion and Development-model gates.
3. Do not freeze a v0.6 candidate and do not spend an untouched confirmation
   set on this model.
4. Open a new Development namespace only after deciding whether the product
   goal remains binary AI/Human classification or becomes the narrower,
   evidence-based public-surface similarity score that the current app claims.
