# VibeBench Development readiness for v0.2

Stand: 2026-08-10

Quelle: `outputs/vibebench_production_browser_capture_post_hardening_2026-08-09.json`

Status: Development-only Diagnose; **keine Validierung und keine neue Regel**

## Ergebnis in einem Satz

Der aktuelle 52-Site-Development-Capture reicht nicht aus, um einen breiteren
v0.2-Struktur- oder Stack-Classifier seriös zu entwickeln: 34/35 erfolgreiche
AI-Sites, aber 0/16 Human-Kontrollen haben mindestens zwei erkannte moderne
Stack-Signale. Damit fehlt genau die schwierige negative Vergleichsgruppe.

## Aktueller Development-Datensatz

| Label | Gesamt | Erfolgreich | Direct | Indicative | Indeterminate | Fehler |
|---|---:|---:|---:|---:|---:|---:|
| AI | 36 | 35 | 13 | 5 | 17 | 1 |
| Human | 16 | 16 | 0 | 0 | 16 | 0 |

Die v0.1-Primärregel ergibt auf diesen bereits zur Entwicklung verwendeten
Zeilen diagnostisch Accuracy 66.7 %, Precision
100.0 %, Recall 51.4 %,
Specificity 100.0 % und F1 67.9 %.
Diese Zahlen sind optimistisch verzerrte In-sample-Diagnostik und keine
Generalisierungskennzahlen.

## Builder-Abdeckung

| Builder | n | Direct | Indicative | Indeterminate | Fehler | Direct / erfolgreiche Scans |
|---|---:|---:|---:|---:|---:|---:|
| Lovable | 13 | 8 | 0 | 4 | 1 | 66.7 % |
| Bolt | 13 | 1 | 3 | 9 | 0 | 7.7 % |
| Replit Agent | 2 | 0 | 0 | 2 | 0 | 0.0 % |
| v0 | 6 | 4 | 1 | 1 | 0 | 66.7 % |
| Claude Code | 2 | 0 | 1 | 1 | 0 | 0.0 % |

Replit Agent ist mit zwei Fällen zu klein und hat keinen positiven Treffer.
Bolt ist zahlenmäßig besser vertreten, zeigt aber nur einen direkten Marker in
dreizehn Fällen. Neue Markersuche darf deshalb nur auf neuen Development-Sites
erfolgen und muss gegen moderne Human-Kontrollen geprüft werden.

## Repräsentationslücke der Human-Kontrollen

| Label | Erfolgreich | ≥1 Stack | ≥2 Stacks | ≥4 Stacks | Median Stack-Anzahl |
|---|---:|---:|---:|---:|---:|
| AI | 35 | 34 | 34 | 29 | 4 |
| Human | 16 | 0 | 0 | 0 | 0 |

| Signal | AI | Human |
|---|---:|---:|
| Next.js | 10 / 35 | 0 / 16 |
| React | 28 / 35 | 0 / 16 |
| Vite | 22 / 35 | 0 / 16 |
| Tailwind CSS | 34 / 35 | 0 / 16 |
| Framer Motion | 1 / 35 | 0 / 16 |
| Radix UI | 13 / 35 | 0 / 16 |
| Lucide | 28 / 35 | 0 / 16 |
| Supabase | 8 / 35 | 0 / 16 |
| Firebase | 0 / 35 | 0 / 16 |

Die bisherigen Human-Seiten sind für eine Direct-Marker-Prüfung nützlich, aber
nicht für die Kalibrierung allgemeiner moderner Web-Muster. Eine neue Schwelle
auf diesem Datensatz würde denselben Repräsentationsfehler wiederholen.

## Beobachtete direkte Marker im Development-Capture

| Builder / Fundort / Marker | Treffer |
|---|---:|
| Lovable · page · lovable.dev | 5 |
| v0 · page · v0.app | 4 |
| Lovable · page · lovable.app | 2 |
| Lovable · asset · lovable.dev | 1 |
| Bolt · asset · bolt.new | 1 |

## Blocker vor einer v0.2-Regel

1. 0/10 neue Replit-Agent- und nur 1/10 neue Bolt-Controls zeigen unter v0.1
   direkte Builder-Evidenz.
2. Creator- und Directory-Provenienz ist dokumentiert, aber kein Code-Audit;
   die Einschränkung bleibt pro Zeile erhalten.
3. Der geöffnete 100er-Holdout bleibt für jedes weitere Tuning gesperrt.

## Empfohlene Development-Erweiterung

40 **neue** Sites, die weder in den bisherigen 52 Development-Seiten noch im
abgeschlossenen 100er-Holdout vorkommen:

| Neues Stratum | Ziel |
|---|---:|
| Replit Agent, provenance-gelabelt | 10 |
| Bolt, provenance-gelabelt | 10 |
| Human Modern SaaS | 10 |
| Human Modern App | 10 |

Akquisitionsstand: **40/40 READY**. Die beiden
Human-Gruppen sind mit je zehn öffentlich dokumentierten Projekten vollständig;
Replit Agent steht bei 10/10 und
Bolt bei 10/10. `HUMAN` ist hier ein operatives
Development-Label für ein vor dem 30. November 2022 begonnenes öffentliches
Source-Projekt und kein Beweis, dass später niemals AI-Unterstützung vorkam.

Die neue negative Vergleichsgruppe trifft die erkannte Lücke: 16/20
haben mindestens zwei erkannte moderne Stack-Signale. Unter v0.1 ergeben sich
bereits 7 `indicative`- und
13 `indeterminate`-Ergebnisse. Diese
Baseline dient der Development-Diagnose und ist keine neue Validierung.

Die neue Bolt-Gruppe ist vollständig: 10/10 READY,
davon 1 `direct`, 0
`indicative` und 9 `indeterminate` unter
v0.1. 9/10 haben mindestens
zwei erkannte moderne Stack-Signale. Damit enthält Development v0.2 gezielt
neue dokumentierte Bolt-False-Negatives und einen Direct-Positivfall.

Die neue Replit-Agent-Gruppe ist ebenfalls vollständig:
10/10 READY, davon 0
`direct`, 1 `indicative` und
9 `indeterminate` unter v0.1.
8/10 haben mindestens zwei
erkannte moderne Stack-Signale. Alle Ziele liegen auf Custom Domains; kein
`replit.app`-Tenant wurde wegen des bekannten Plattform-Leakage-Risikos
zugelassen.

Die Human-Seiten sollen bewusst Next.js, React, Tailwind, Radix, Lucide,
Supabase und vergleichbare moderne Stacks enthalten. Sie sind keine leichten
Gegenbeispiele, sondern der notwendige Test für generische Signale.

## Sichere v0.2-Forschungsrichtungen

1. **Portable layer:** kleine, erklärbare Feature-Kombinationen auf
   Development v0.2 prüfen; direkte Markerforschung allein ergab keine neue Regel.
2. **Context layer:** Stack-/DOM-Muster weiterhin ohne Attribution anzeigen.
3. **Technical coverage:** Blockierung, Timeout und Größenlimit getrennt vom
   Klassifikator verbessern.
4. **Evaluation:** v0.2 erst nach Development-Freeze auf einem neuen Holdout
   bestätigen; den aktuellen Holdout nicht wiederverwenden.

## Nächste To-dos

1. Nur auf dem eingefrorenen Development-Set portable Feature-Kandidaten untersuchen und
   gegen die 20 modernen Human-Kontrollen prüfen.
2. Kandidaten mit Owner-, Hosting- oder Stack-Leakage verwerfen.
3. Erst danach eine v0.2-Regel vorregistrieren und auf einem neuen Holdout evaluieren.

## Empfohlener nächster Schritt

Als Nächstes eine kleine portable Feature-Matrix auf dem eingefrorenen 40-Site-
Development-Set erstellen, ohne den abgeschlossenen 100er-Holdout als Quelle
oder Tuninghilfe zu verwenden. Die direkte Markerforschung ist abgeschlossen.
