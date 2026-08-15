# VibeBench independent confirmation v0.4 — integrity reconstruction

Status: **LEGACY_CAPTURE_COMPLETENESS_UNVERIFIABLE**

| Kennzahl | Wert | Gate |
|---|---:|---:|
| Precision | 82.4 % | ≥ 80,0 % |
| Recall | 85.7 % | ≥ 80,0 % |
| Specificity | 82.0 % | — |
| Accuracy | 83.8 % | — |
| F1 | 84.0 % | — |
| technische Abdeckung | 99.0 % | — |

Confusion Matrix: TP 42, FP 9, TN 41, FN 7.

The evaluator reconstructed every stored classification from probability and the frozen threshold and verified exact ID sets, labels, class balance and technical totals. The legacy scanner did not persist stream-completeness evidence for 99 successful rows; therefore the prior performance result is not promoted as capture-completeness-verified. The original frozen artifacts remain unchanged.
