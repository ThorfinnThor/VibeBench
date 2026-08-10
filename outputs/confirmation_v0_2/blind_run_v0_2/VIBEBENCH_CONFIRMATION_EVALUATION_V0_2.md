# VibeBench independent confirmation v0.2

Status: **EXTERNAL_80_80_GATE_FAILED**

## Ergebnis

| Kennzahl | Wert | Gate |
|---|---:|---:|
| Precision | 50.0 % | ≥ 80,0 % |
| Recall | 16.0 % | ≥ 80,0 % |
| Specificity | 84.0 % | — |
| Accuracy | 50.0 % | — |
| F1 | 24.2 % | — |
| technische Abdeckung | 100.0 % | — |

Confusion Matrix auf technisch erfolgreichen Scans: TP 8, FP 8, TN 42, FN 42.

## Protokoll

- 100 vor dem Lauf ausgewählte Projektfamilien, 50 AI / 50 Human.
- Auswahl ausschließlich nach Provenienz, Overlap und Erreichbarkeit.
- Das Kandidatenmodell war vor der Auswahl eingefroren.
- Der Runner las ausschließlich Sample-ID und URL, keine Labels.
- Jeder technische Fehler erhielt genau einen Retry.
- Der abgeschlossene v0.1-Holdout wurde nicht zum Tuning verwendet.
