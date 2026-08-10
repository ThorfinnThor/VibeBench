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

## Development-readiness v0.2

Die neue reproduzierbare Diagnose des festen 52-Site-Development-Captures
bestätigt, dass vor einer Regeländerung zusätzliche Daten nötig sind:

- 34/35 erfolgreiche AI-Sites haben mindestens zwei erkannte moderne
  Stack-Signale, aber 0/16 Human-Kontrollen.
- Replit Agent ist nur mit zwei Development-Sites vertreten; beide sind
  `indeterminate`.
- Bolt hat dreizehn Development-Sites, aber nur einen Direct-Treffer.
- Die bisherigen Human-Kontrollen testen die Spezifität eines breiteren
  modernen Stack-/Struktur-Ansatzes daher nicht.

Die vollständige Diagnose steht in
`outputs/VIBEBENCH_DEVELOPMENT_V0_2_READINESS_2026-08-10.md`. Für die nächste
Phase sind 40 überprüfte Development-Slots vorbereitet: je zehn Replit Agent,
Bolt, Human Modern SaaS und Human Modern App. Build und Validator blockieren
Überschneidungen mit bestehenden Development- und Holdout-Hosts. Das Protokoll
steht in `outputs/VIBEBENCH_DEVELOPMENT_V0_2_ACQUISITION_PROTOCOL.md`.
Die 20 Human-Slots sind bereits READY. Sie verwenden offizielle öffentliche
Source-Repositories, deren Projektgeschichte vor dem 30. November 2022 beginnt;
dies ist ein transparentes operatives Kontrolllabel, kein Beweis gegen jede
spätere AI-Unterstützung. Replit Agent steht bei 0/10 und Bolt bei 10/10.
16/20 Human-Kontrollen haben mindestens zwei erkannte moderne Stack-Signale;
7/20 lösen unter der alten v0.1-Baseline bereits `indicative` aus.
Zehn neue Bolt-Custom-Domain-Deployments sind ebenfalls READY. Ihre
builder-spezifische Provenienz stammt aus unabhängigen Devpost-Submissions;
unter der v0.1-Baseline ist eines `direct` und neun bleiben `indeterminate`.
Aufgenommene und wegen Leakage oder technischer Fehler abgelehnte Kandidaten
sind in `outputs/development_v0_2/VIBEBENCH_AI_ACQUISITION_LOG_2026-08-10.md`
dokumentiert.

```bash
npm run research:v0.2-readiness
npm run development:v0.2-build
npm run development:v0.2-validate
```

## Nächste To-dos

1. Die aktuellen Commits pushen, auf Vercel deployen und alle vier Ausgänge in
   Produktion prüfen.
2. Zehn neue Replit-Agent-Samples mit exakter Deployment-Provenienz ergänzen.
3. Danach 40/40 Slots validieren.
4. Eine Scanner-v0.2-Regel ausschließlich auf dem erweiterten
   Development-Datensatz entwickeln.
5. Einen neuen Bestätigungs-Holdout für v0.2 akquirieren und erst danach
   Kalibrierung oder Prozentwert prüfen.

## Empfohlener nächster Schritt

Die aktuellen Commits über GitHub Desktop pushen und den Vercel-Deploy mit
Direct-, Indicative-, Indeterminate- und Fehlerbeispiel prüfen. Danach zuerst
die zehn Replit-Agent-Slots füllen; der 100er-Holdout bleibt unangetastet.
