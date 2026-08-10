# VibeBench Development v0.2 candidate · 80/80 gate

Stand: 2026-08-10

Status: **DEVELOPMENT-GATE BESTANDEN · keine unabhängige Validierung**

## Primärer Cross-Validation-Befund

| Kennzahl | Ergebnis | Ziel |
|---|---:|---:|
| Precision | 85.0 % | ≥ 80.0 % |
| Recall | 85.0 % | ≥ 80.0 % |
| Accuracy | 85.0 % | — |
| Specificity | 85.0 % | — |
| F1 | 85.0 % | — |

Confusion Matrix: TP 17, FP 3, TN 17, FN 3.

Das primäre Protokoll ist Leave-one-project-out-Cross-Validation über 40
eindeutige Projektfamilien. Für jede Vorhersage wurde das Modell ohne die
betreffende Seite neu trainiert.

## Modellgrenze

Der Kandidat verwendet ausschließlich erkannte Stack-Signale und logarithmierte
HTML-/Asset-Strukturmetriken. Hostname, URL, Provenienz, Builder-Label,
Hosting-Header und direkte Builder-Marker sind als Features ausgeschlossen.

Er ist Development-only. Die 40 Seiten wurden während der Featureforschung
verwendet; Cross-Validation verhindert direktes Training auf der Testzeile,
kann aber die vorangegangene Featureauswahl nicht ungeschehen machen.

## Stabilität

Bei 100 festen, nach den vier Akquisitionsgruppen stratifizierten
5-Fold-Zuordnungen erreichten 93/100
Läufe beide 80-%-Ziele. Median Precision 85.0 %,
Median Recall 85.0 %. Die Minima lagen bei
77.3 % beziehungsweise
75.0 %; die kleine Stichprobe bleibt damit
eine relevante Unsicherheit.

## Methodische Entscheidung

- Der Kandidat wird mit Featureliste, Standardisierung, Koeffizienten,
  Regularisierung und Schwelle eingefroren.
- Er ersetzt die Produktionsregel noch nicht.
- Der abgeschlossene v0.1-Holdout bleibt unberührt.
- Offizielle neue Precision/Recall entstehen erst auf einem neuen, ungeöffneten
  und vor dem Lauf eingefrorenen Bestätigungs-Holdout.

## Nächste To-dos

1. Kandidatenartefakte und Hashes einfrieren.
2. Einen neuen, builder- und website-type-stratifizierten Holdout akquirieren.
3. Scan-/Retry-/Fehlerprotokoll vor dem ersten Request sperren.
4. Kandidat genau einmal auswerten und 80/80 als externes Gate prüfen.

## Empfohlener nächster Schritt

Jetzt keine weiteren Gewichte auf Development nachjustieren. Den Kandidaten
einfrieren und einen frischen Bestätigungs-Holdout aufbauen; nur dessen Ergebnis
darf als neue VibeBench-Precision und -Recall bezeichnet werden.
