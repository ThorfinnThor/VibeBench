# VibeBench status · 2026-08-10

## Aktueller belastbarer Stand

Der eingefrorene Kandidat v0.4 hat einen neuen, vor dem Lauf unangetasteten
100er-Holdout bestanden:

| Kennzahl | Ergebnis | Ziel |
|---|---:|---:|
| Precision | 82,4 % | mindestens 80,0 % |
| Recall | 85,7 % | mindestens 80,0 % |
| Specificity | 82,0 % | — |
| Accuracy | 83,8 % | — |
| F1 | 84,0 % | — |
| technische Abdeckung | 99/100 | — |

Confusion Matrix auf 99 technisch erfolgreichen Scans: TP 42, FP 9, TN 41,
FN 7. Ein AI-Sample blieb auch nach dem vorab erlaubten Retry ein technischer
Fehler und wurde nicht als Klassifikationsfehler gezählt.

## Warum das Ergebnis unabhängig ist

- Der Holdout enthält 100 zuvor nicht verwendete Projektfamilien, 50 AI und 50 Human.
- Manifest und Auswahlregel wurden vor dem Scan eingefroren.
- Die Auswahl nutzte keine Modellwerte.
- Der Runner enthielt keine Labels und verwendete eine feste Schwelle von 0,44.
- Modell, Feature-Code, Scanner, Retry-Regel und Evaluator wurden vor dem Lauf gehasht.
- Frühere Holdouts wurden nicht als Trainingszeilen verwendet.

## Modell v0.4

- 246 Development-Seiten, balanciert 123 AI / 123 Human.
- 97 URL-seitig erfassbare Features aus Stack-, HTML-, CSS-, JavaScript- und
  UI-Fingerprints; keine Domain-, URL-, Provenienz- oder Builder-Labels als Features.
- L2-logistische Regression, L2 = 3, Schwelle = 0,44.
- 20/20 Development-CV-Zuordnungen erfüllten vor dem Holdout 80/80.

## Vollständige Ergebnishistorie

- v0.1 unabhängiger Holdout: 76,9 % Precision / 61,2 % Recall.
- v0.2 unabhängige Confirmation: 50,0 % / 16,0 %; verworfen und gesperrt.
- v0.3 unabhängige Confirmation: 76,4 % / 84,0 %; verworfen und gesperrt.
- v0.4 unabhängige Confirmation: 82,4 % / 85,7 %; 80/80-Gate bestanden.

## Wichtige Unsicherheit

Das Gate bezieht sich auf Punktschätzungen. Die Wilson-95-%-Intervalle liegen
wegen der Stichprobengröße ungefähr bei 69,7–90,4 % für Precision und
73,3–92,9 % für Recall. Für die stärkere Aussage, dass auch die statistische
Untergrenze über 80 % liegt, ist eine deutlich größere unabhängige Replikation nötig.

## Nächste To-dos

1. Den versiegelten v0.4-Ergebnisstand committen und pushen.
2. v0.4 erst nach expliziter Freigabe in die Produktionsauswertung übernehmen.
3. Produktion auf Vercel deployen und mit festen Smoke-URLs prüfen.
4. Einen größeren, quellenübergreifenden Replikations-Holdout planen.

## Empfohlener nächster Schritt

Zuerst diesen bestandenen Stand unverändert sichern. Danach v0.4 als neue
Produktionsregel implementieren, deployen und getrennt von der Modellvalidierung
einen Browser-/API-Smoke-Test durchführen.
