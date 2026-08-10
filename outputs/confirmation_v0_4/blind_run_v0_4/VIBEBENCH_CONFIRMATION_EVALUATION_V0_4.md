# VibeBench independent confirmation v0.4

Status: **EXTERNAL_80_80_GATE_PASSED**

| Kennzahl | Wert | Gate |
|---|---:|---:|
| Precision | 82.4 % | ≥ 80,0 % |
| Recall | 85.7 % | ≥ 80,0 % |
| Specificity | 82.0 % | — |
| Accuracy | 83.8 % | — |
| F1 | 84.0 % | — |
| technische Abdeckung | 99.0 % | — |

Confusion Matrix: TP 42, FP 9, TN 41, FN 7.

- 100 neue Projektfamilien (50 AI / 50 Human), vor dem Lauf und ohne Modellscore ausgewählt.
- Neue AI-Akquisitionsquelle: öffentliche genehmigte Submissions; sechs Builder-Strata.
- Label-freier Runner, exakt ein technischer Retry; frühere Holdouts nicht trainiert.
