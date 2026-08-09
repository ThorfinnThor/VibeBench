# VibeBench production comparison: pre- vs. post-hardening

Stand: 2026-08-09  
Vorher: `outputs/vibebench_production_browser_capture_full_2026-08-09.json`  
Nachher: `outputs/vibebench_production_browser_capture_post_hardening_2026-08-09.json`

## Zweck

Dieser Vergleich prüft ausschließlich die gezielte False-Positive-Härtung und
die Transparenz der direkten Marker. Er ist kein Blind-Holdout und keine
allgemeine Accuracy-Aussage.

## Zusammenfassung

| Label | Verdict | Vorher | Nachher | Delta |
|---|---|---:|---:|---:|
| AI | direct | 13 | 13 | 0 |
| AI | indicative | 5 | 5 | 0 |
| AI | indeterminate | 17 | 17 | 0 |
| AI | error | 1 | 1 | 0 |
| HUMAN | direct | 0 | 0 | 0 |
| HUMAN | indicative | 1 | 0 | -1 |
| HUMAN | indeterminate | 15 | 16 | +1 |
| HUMAN | error | 0 | 0 | 0 |

Technisch erfolgreich: 51/52 vorher,
51/52 nachher.

## Geänderte Einzelergebnisse

| Sample | Label | Builder | Vorher | Nachher |
|---|---|---|---|---|
| HUM-0014 | HUMAN | — | indicative | indeterminate |

## AI-Abdeckung nach Builder

| Builder | n | Direct | Indicative | Indeterminate | Error |
|---|---:|---:|---:|---:|---:|
| Bolt | 13 | 1 | 3 | 9 | 0 |
| Claude Code | 2 | 0 | 1 | 1 | 0 |
| Lovable | 13 | 8 | 0 | 4 | 1 |
| Replit Agent | 2 | 0 | 0 | 2 | 0 |
| v0 | 6 | 4 | 1 | 1 | 0 |

## Transparente Direct-Marker

| Sample | Builder | Marker und Fundort |
|---|---|---|
| AIN-0001 | Lovable | Lovable: page · lovable.dev |
| AIN-0005 | Lovable | Lovable: page · lovable.dev |
| AIN-0019 | Lovable | Lovable: page · lovable.dev |
| AIN-0042 | v0 | v0: page · v0.app |
| AIN-0044 | v0 | v0: page · v0.app |
| AIN-0003 | Lovable | Lovable: page · lovable.app |
| AIN-0006 | Lovable | Lovable: asset · lovable.dev |
| AIN-0007 | Lovable | Lovable: page · lovable.dev |
| AIN-0021 | Lovable | Lovable: page · lovable.app |
| AIN-0022 | Lovable | Lovable: page · lovable.dev |
| AIN-0028 | Bolt | Bolt: asset · bolt.new |
| AIN-0045 | v0 | v0: page · v0.app |
| AIN-0046 | v0 | v0: page · v0.app |

## Interpretation

- Die Härtung soll ausschließlich generische Strukturmuster ohne erkannten
  Stack von `indicative` auf `indeterminate` zurückstufen.
- Direkte und indikative AI-Fälle dürfen dabei nicht verloren gehen.
- Builder-Abdeckung und Accuracy sind getrennte Fragen. Fehlende direkte Marker
  werden nicht durch Hosting oder generische Framework-Kombinationen ersetzt.

## Nächste To-dos

1. Die sichtbare Erklärung der Strukturhinweise deployen.
2. Die niedrige Direct-Abdeckung von Bolt und Replit Agent als bekannte Lücke führen.
3. Neue Builder-Marker nur nach Human-Control- und Blind-Holdout-Prüfung ergänzen.
4. Einen unangetasteten, builderbalancierten Holdout einfrieren.

## Empfohlener nächster Schritt

Die lokale Erklärung der bestehenden `indicative`-Fälle deployen, ohne die
Entscheidungsschwelle erneut zu verändern. Danach einen Blind-Holdout festlegen.
