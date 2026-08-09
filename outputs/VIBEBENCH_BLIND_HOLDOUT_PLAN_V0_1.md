# VibeBench blind holdout plan v0.1

Stand: 2026-08-09  
Status: Vorschlag zur Freigabe; noch keine URLs ausgewählt

## Ziel

Der Holdout soll erstmals messen, wie die eingefrorene Web-Scanner-Regel auf
neuen, nicht zur Marker- oder Schwellenentwicklung verwendeten Websites
generalisiert. Er bleibt bis zum finalen Lauf unangetastet und wird nicht zur
Fehlersuche oder Nachkalibrierung benutzt.

## Empfohlener Umfang

100 erfolgreiche, provenance-gelabelte und öffentlich scanbare URLs:

- 50 AI-positive Websites
- 50 Human-Kontrollen

Vorgeschlagene AI-Verteilung:

| Gruppe | Ziel |
|---|---:|
| Lovable | 10 |
| Bolt | 10 |
| Replit Agent | 10 |
| v0 | 10 |
| andere agentische/AI-gestützte Entwicklung | 10 |

Die Human-Kontrollen sollen nach Website-Typ, Hosting-Ära, Framework-Komplexität
und Größenordnung möglichst ähnlich verteilt sein. Reine Pre-AI-Static-Sites
allein wären kein angemessener Gegenpol zu modernen AI-Webapps.

## Aufnahmebedingungen

### AI-positive URL

- konkrete Deployment-URL,
- projektbezogene Provenienz für AI-Builder oder agentische Erstellung,
- Provenienzquelle getrennt von der zu scannenden Website,
- keine Verwendung im bisherigen 52-URL-Development-Set,
- erfolgreicher sicherer Scan vor dem Freeze.

### Human-Kontrolle

- glaubwürdige Human-Entwicklung oder eingefrorener Pre-AI-Stand,
- konkrete Deployment- oder Snapshot-URL,
- keine erkennbare Nutzung eines AI-Builders in der Ground Truth,
- vergleichbare moderne Stacks ausdrücklich zulässig und erwünscht,
- keine Verwendung im bisherigen Development-Set.

## Leakage-Schutz

- Gruppierung nach registrierbarer Domain, Projekt und Organisation.
- Kein Builder-Demo-Klon in mehreren Splits.
- Keine URL-Varianten desselben Deployments in Development und Holdout.
- Provenienzseiten, Verzeichnisse und Builder-Stories werden nicht als
  Scanner-Input verwendet.
- Labels und Quellen werden vor dem technischen Scan eingefroren.

## Freeze-Artefakte

Vor dem ersten Ergebnisblick müssen versioniert vorliegen:

1. Holdout-Manifest mit Sample-ID, URL, Label, Builder und Provenienzklasse,
2. Hash der Eingabedatei,
3. eingefrorener Scanner-Commit,
4. Scanzeitfenster und Retry-Regel,
5. vorab definierte Metriken und Fehlerbehandlung.

## Primäre Auswertung

- technische Erfolgsquote separat,
- Direct-Coverage nach Builder,
- `direct + indicative` als positives Scanner-Signal,
- Human-False-Positive-Rate,
- Precision, Recall und F1 nur auf erfolgreich gescannten Zeilen,
- Bootstrap-Konfidenzintervalle,
- vollständige Liste aller Fehler und Verdict-Wechsel.

Ein Wahrscheinlichkeitswert wird erst nach separater Kalibrierung eingeführt.

## Abbruch- und Änderungsregel

Nach Öffnung der Holdout-Ergebnisse wird keine Regeländerung mehr als Ergebnis
desselben Holdouts berichtet. Jede Änderung erzeugt eine neue Scanner-Version
und benötigt später einen neuen Holdout.

## Nächste To-dos

1. Umfang und Verteilung freigeben.
2. Provenienz-Schema und Manifestspalten festlegen.
3. 100 Kandidaten beschaffen und technische Erreichbarkeit vor dem Freeze prüfen.
4. Duplikate und Domain-/Projekt-Leakage entfernen.
5. Manifest hashen, Scanner-Commit fixieren und erst dann auswerten.

## Empfohlener nächster Schritt

Den 100-URL-Plan freigeben. Falls die Beschaffung zu aufwendig ist, wäre ein
60-URL-Holdout (30 AI/30 Human) die minimale Lean-Variante; belastbarer ist der
100-URL-Plan.
