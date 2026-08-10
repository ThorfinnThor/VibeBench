# VibeBench independent confirmation v0.3

Status: **EXTERNAL_80_80_GATE_FAILED**

| Kennzahl | Wert | Gate |
|---|---:|---:|
| Precision | 76.4 % | ≥ 80,0 % |
| Recall | 84.0 % | ≥ 80,0 % |
| Specificity | 74.0 % | — |
| Accuracy | 79.0 % | — |
| F1 | 80.0 % | — |
| technische Abdeckung | 100.0 % | — |

Confusion Matrix: TP 42, FP 13, TN 37, FN 8.

- 100 vor dem Lauf ausgewählte, bisher unbenutzte Projektfamilien (50 AI / 50 Human).
- Auswahl ohne Modellscore; Runner ohne Labels; maximal ein technischer Retry.
- Frühere Holdouts wurden weder trainiert noch zur Schwellenwahl verwendet.
