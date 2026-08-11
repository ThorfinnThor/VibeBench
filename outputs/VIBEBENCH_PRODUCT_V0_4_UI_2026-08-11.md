# VibeBench Produktintegration v0.4 · 2026-08-11

## Ziel dieses Sprints

Die bisherige Evidenzansicht wurde zu einem verständlichen Produkt-Dashboard
umgebaut. Ein Nutzer soll nach Eingabe einer öffentlichen URL unmittelbar
erkennen:

1. wie stark die ausgelieferte Website dem validierten Vibecoding-Korpus ähnelt,
2. welche sichtbaren Merkmale den Wert besonders beeinflussen,
3. welche Security-Baseline öffentlich erkennbar ist,
4. welche Maßnahmen zuerst umgesetzt werden sollten, um Sicherheit,
   Eigenständigkeit und technische Qualität zu erhöhen.

## Neue Ergebnissemantik

Die App zeigt einen **Vibe-Footprint von 0 bis 100**:

| Score | Einordnung |
|---:|---|
| 0–24 | niedrig |
| 25–49 | leicht |
| 50–69 | mittel |
| 70–84 | hoch |
| 85–100 | sehr hoch |

Der Score ist die gerundete Modellwahrscheinlichkeit des eingefrorenen
v0.4-Kandidaten. Seine korrekte Produktbedeutung ist die **Ähnlichkeit
öffentlich sichtbarer Muster mit dem validierten VibeBench-Korpus**. Er ist
ausdrücklich:

- kein messbarer Prozentanteil AI-generierten Codes,
- kein Beweis dafür, wer eine Website gebaut hat,
- kein vollständiger Code-, Security- oder Accessibility-Audit.

## Modell und Datenbasis

- eingefrorener v0.4-Kandidat,
- 246 Development-Seiten, balanciert 123 AI / 123 Human,
- 97 portable Features,
- feste Entscheidungsschwelle 0,44,
- unabhängiger Holdout mit 100 zuvor ungesehenen Projektfamilien,
- 82,4 % Precision,
- 85,7 % Recall,
- 84,0 % F1,
- 99/100 technische Abdeckung.

Die eingefrorenen Modell-, Scanner- und Feature-Artefakte wurden für die
Produktintegration nicht verändert.

## Technische Umsetzung

### Live-Scan

`app/api/scan/route.js` erzeugt jetzt zusätzlich:

- `vibeScore` mit Score, Band, Schwelle und Interpretationsgrenze,
- `scoreDrivers.raises` und `scoreDrivers.lowers`,
- `security.score` und sieben einzelne Header-Checks,
- priorisierte `recommendations`,
- transparente Modell- und Holdout-Metadaten.

`lib/production-v0_4-features.mjs` ergänzt die Produktionsschicht für:

- die erweiterten v0.4-Oberflächenmetriken,
- verständliche Score-Bänder,
- standardisierte Score-Beiträge pro Feature,
- Security-Header-Audit,
- dynamische Verbesserungsmaßnahmen.

Die Security-Baseline prüft HTTPS, CSP, HSTS, Clickjacking-Schutz,
`X-Content-Type-Options`, Referrer-Policy und Permissions-Policy. Sie untersucht
nur die Header des Hauptdokuments und ersetzt keinen Penetrationstest.

### Oberfläche

Die alte große Evidenzfläche wurde vollständig ersetzt durch:

- kompakten Hero mit großer, gut lesbarer URL-Eingabe,
- sichtbare unabhängige Validierungskennzahlen,
- große Score-Anzeige und durchgehende 0–100-Skala,
- klare Erklärung dessen, was der Score bedeutet und nicht bedeutet,
- positive und negative Score-Treiber,
- filterbaren, priorisierten Maßnahmenplan,
- aufklappbare Security-Checks,
- progressive technische Details für fortgeschrittene Nutzer,
- responsive Desktop- und Mobile-Darstellung.

Die visuelle Sprache verwendet ein ruhiges Dunkelgrün, Off-White, gedecktes
Teal und sparsame Coral-/Amber-Statusfarben. Standardtext ist 15–16 px groß,
Formfeld und Hauptbutton sind jeweils 58 px hoch.

## Verifikation

- `npm test`: 46/46 Tests bestanden,
- `npm run lint`: bestanden,
- `npm run build`: bestanden,
- Desktop-Browserprüfung bei 1440 × 1000: kein horizontaler Overflow,
- Mobile-Browserprüfung bei 390 × 844: kein horizontaler Overflow,
- echter Scan von `https://example.com`: Score, Empfehlungen und sieben
  Security-Checks erfolgreich gerendert,
- Empfehlungsfilter und Security-Akkordeon funktionieren,
- keine Browserfehler oder Warnungen im geprüften Flow.

## Noch nicht enthalten

- Repository- oder Quellcodeanalyse,
- aktive Security-Tests oder Schwachstellen-Exploitation,
- Lighthouse-/Core-Web-Vitals-Messung,
- Screenshot-basierte visuelle Ähnlichkeitsanalyse,
- Nutzerkonto oder gespeicherter Scanverlauf,
- PDF-/Share-Report.

## Nächste To-dos

1. Commit zu GitHub pushen und Vercel-Deployment auslösen.
2. Produktions-API mit einer festen Smoke-Liste aus AI-, Human- und
   Blockierungsfällen prüfen.
3. Score-Verteilung und Fehlerrate im realen Betrieb protokollieren, ohne URLs
   oder personenbezogene Daten unnötig zu speichern.
4. Einen größeren unabhängigen Replikations-Holdout planen, damit auch die
   statistischen Untergrenzen belastbarer werden.
5. Als nächste Produktstufe einen exportierbaren Maßnahmenreport und optional
   einen autorisierten Repository-Audit konzipieren.

## Empfohlener nächster Schritt

Nach dem Push zuerst das Vercel-Deployment testen. Dabei mindestens eine
bekannte Vibecoding-Seite, eine etablierte Human-Kontrolle, eine sehr einfache
statische Seite und einen erwarteten 403-/Timeout-Fall scannen. Erst danach die
Deployment-URL öffentlich teilen.
