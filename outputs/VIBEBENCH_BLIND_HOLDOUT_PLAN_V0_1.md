# VibeBench blind holdout plan v0.1

Stand: 2026-08-10
Status: Akquisition abgeschlossen; 100/100 READY; Holdout eingefroren

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
- keine Verwendung im bisherigen 63-URL-Development-Set,
- erfolgreiche unabhängige Erreichbarkeitsprüfung vor dem Freeze; noch kein
  VibeBench-Scannerlauf und kein Verdict-Blick.

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

1. Das Scanzeitfenster und die Retry-Regel unmittelbar vor dem Blindlauf protokollieren.
2. Den Holdout genau einmal mit dem eingefrorenen Scanner ausführen.
3. Technische Fehler zuerst separat ausweisen; danach die vorab definierten Metriken berechnen.
4. Konfidenzintervalle und Builder-Coverage zusammen mit der Human-FPR berichten.
5. Keine Scannerregel anhand dieser 100 Ergebnisse nachjustieren; Änderungen benötigen einen neuen Holdout.

## Empfohlener nächster Schritt

Das Scanzeitfenster und die einmalige Retry-Regel protokollieren und anschließend
den Blindlauf gegen den im Lockfile fixierten Scanner-Commit starten.

## Freigabe und Arbeitsdateien

Der 100-URL-Plan wurde am 2026-08-09 freigegeben. Die Akquisition erfolgt in:

- `outputs/holdout_v0_1/vibebench_blind_holdout_100_v0_1.xlsx`
- `outputs/holdout_v0_1/vibebench_blind_holdout_100_v0_1.csv`

Die CSV wird im Arbeitsmodus mit `npm run holdout:validate` geprüft. Der finale
Freeze erfolgt erst bei 100 READY-Zeilen mit einem vollständigen Scanner-Commit:

```bash
node scripts/validate-holdout.mjs \
  outputs/holdout_v0_1/vibebench_blind_holdout_100_v0_1.csv \
  --freeze --scanner-commit FULL_40_CHARACTER_GIT_SHA
```

Verworfene, zurückgestellte und akzeptierte Quellen werden getrennt im
Akquisitionslog dokumentiert:

- `outputs/holdout_v0_1/VIBEBENCH_HOLDOUT_ACQUISITION_LOG_2026-08-09.md`
