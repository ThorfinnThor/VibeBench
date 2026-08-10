# VibeBench handover · 2026-08-10

## Aktueller Stand

VibeBench ist als öffentliche Evidence-Scanner-Web-App funktionsfähig. Der
erste 100-Site-Blind-Holdout wurde nach abgeschlossenem Freeze genau einmal
gegen die Produktions-API ausgeführt und vollständig ausgewertet.

Das wichtigste Ergebnis ist nicht „AI sicher erkannt“, sondern eine belastbare
Trennung der Evidenzstufen:

- `direct` fand sichtbare builder-spezifische Deployment-Artefakte bei 28 von
  49 technisch erfolgreichen AI-Sites und bei keiner der 49 Human-Kontrollen.
- `indicative` ergänzte zwei weitere AI-Treffer, erzeugte aber neun Treffer auf
  Human-Kontrollen.
- Die vorregistrierte Primärregel `direct OR indicative = positiv` erreichte
  71,4 % Accuracy, 76,9 % Precision, 61,2 % Recall, 81,6 % Specificity und
  68,2 % F1 auf 98 technisch erfolgreichen Scans.
- Zwei Sites blieben nach genau einem Retry technische Fehler:
  `scorecastr.co` wegen HTTP 403 und `cal.com` wegen des 1,5-MB-HTML-Limits.

Der Direct-only-Vergleich kommt post-hoc auf 78,6 % Accuracy, 100 % Precision,
57,1 % Recall, 100 % Specificity und 72,7 % F1. Er ist eine Designhypothese für
v0.2, keine unabhängig bestätigte neue Regel.

## Was „blind“ hier bedeutet

Scanner-Quellcode, Schwellen, Manifest, Metriken und Retry-Regel waren vor dem
ersten Holdout-Aufruf eingefroren. Die Labels blieben für den Audit im Manifest
sichtbar; an den Produktionsendpoint wurde pro Request ausschließlich die
Ziel-URL gesendet. Der Holdout schützt damit vor nachträglichem Regel-Tuning,
ist aber kein doppelblindes Experiment.

## Fixierte Integrität

- Holdout: 100 Sites, 50 AI / 50 Human, zehn Strata mit jeweils zehn Sites.
- Manifest SHA-256:
  `5c2a5b34305a2b7ae85b7b21f56f10bf0ba91a371b1b89c3d231cbb28a082de3`
- Scanner-Commit:
  `6338a3a377ab58eb3f49b8cae4df45f4eb60abc0`
- Protokoll-Commit vor dem Lauf:
  `934b355`
- Bootstrap: 10.000 stratifizierte Replikate, Seed `20260810`.
- Ergebnis-Paket: neun SHA-256-gehashte Artefakte; `npm run holdout:verify`
  bestätigt Rohdaten, Confusion Matrix und Dateihashes.

## Zentrale Dateien

- Protokoll:
  `outputs/holdout_v0_1/VIBEBENCH_BLIND_RUN_PROTOCOL_V0_1.md`
- Freeze-Lock:
  `outputs/holdout_v0_1/vibebench_blind_holdout_100_v0_1.csv.freeze.json`
- Rohdaten JSON/CSV:
  `outputs/holdout_v0_1/blind_run_v0_1_2026-08-10/vibebench_blind_holdout_raw_results_v0_1.*`
- Statistische Auswertung:
  `outputs/holdout_v0_1/blind_run_v0_1_2026-08-10/vibebench_blind_holdout_metrics_v0_1.json`
- Lesbarer Ergebnisbericht:
  `outputs/holdout_v0_1/blind_run_v0_1_2026-08-10/VIBEBENCH_BLIND_HOLDOUT_EVALUATION_V0_1.md`
- Ergebnis-Workbook:
  `outputs/holdout_v0_1/blind_run_v0_1_2026-08-10/vibebench_blind_holdout_evaluation_v0_1.xlsx`
- Datei-Hashmanifest:
  `outputs/holdout_v0_1/blind_run_v0_1_2026-08-10/vibebench_blind_holdout_result_files_v0_1.json`

## Reproduzierbare Prüfungen

```bash
npm run holdout:validate
npm run holdout:evaluate
npm run holdout:evaluation-workbook
npm run holdout:results-manifest
npm run holdout:verify
npm test
npm run lint
npm run build
```

`npm run holdout:scan` darf nicht noch einmal ausgeführt werden. Der Runner
verweigert bei vorhandenem finalen Rohdatenartefakt absichtlich einen zweiten
Lauf. Eine Unterbrechung wäre nur über das persistierte Checkpoint fortgesetzt
worden; der Lauf ist bereits abgeschlossen.

## Umgesetzte Produktentscheidung · v0.1.1

Die aktuelle Primärregel ist als Forschungsbaseline eingefroren. Für die
Produktoberfläche bleibt `direct` die einzige hochkonfidente Builder-Evidenz.
`Indicative` wird als allgemeines Strukturmuster ohne Attribution erklärt und
visuell herabgestuft, weil moderne Human-SaaS-Seiten dieselben Next.js-, React-,
Tailwind-, Radix-, Lucide- und DOM-Dichte-Signale besitzen.

Technische Fehler sind ein eigener vierter Ausgang. Die API liefert strukturierte
Fehlercodes und Handlungsoptionen; `indeterminate` bleibt erfolgreichen Scans
ohne direkte Evidenz vorbehalten. Implementierung und Browser-QA stehen in
`outputs/VIBEBENCH_PRODUCT_SEMANTICS_UPDATE_2026-08-10.md`.

Das ist eine Änderung der Produktsprache und Ergebnishierarchie, nicht das
nachträgliche Umschreiben der v0.1-Metriken oder Scanner-Schwellen.

## Nächste To-dos

1. v0.1.1 pushen, auf Vercel deployen und alle vier Ausgänge in Produktion prüfen.
2. Replit-Agent-Signale und Human-SaaS-False-Positives nur auf neuen
   Development-Samples untersuchen.
3. Eine Scanner-v0.2-Regel ausschließlich auf Development-Daten entwickeln.
4. Einen neuen Bestätigungs-Holdout für v0.2 akquirieren und einfrieren.
5. Erst nach v0.2-Bestätigung Kalibrierung und Prozentwert prüfen.

## Empfohlener nächster Schritt

v0.1.1 über GitHub Desktop pushen und den Vercel-Deploy mit Direct-, Indicative-,
Indeterminate- und Fehlerbeispiel prüfen. Danach Development-only an v0.2
arbeiten; der 100er-Holdout bleibt unangetastet.
