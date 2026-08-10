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
`outputs/VIBEBENCH_DEVELOPMENT_V0_2_READINESS_2026-08-10.md`. Die Erweiterung
ist jetzt mit je zehn Replit Agent, Bolt, Human Modern SaaS und Human Modern App
vollständig: 40/40 READY. Build und Validator blockieren Überschneidungen mit
bestehenden Development- und Holdout-Hosts, geteilte Deployment-Plattformen
und doppelte `project_family_id`-Werte.

Die 20 Human-Slots verwenden offizielle öffentliche Source-Repositories, deren
Projektgeschichte vor dem 30. November 2022 beginnt; dies ist ein transparentes
operatives Kontrolllabel, kein Beweis gegen jede spätere AI-Unterstützung.
16/20 haben mindestens zwei erkannte moderne Stack-Signale und 7/20 lösen unter
v0.1 bereits `indicative` aus.

Neun Bolt-Custom-Domains sind über Devpost-Submissions und eine über einen
geprüften Directory-Eintrag dokumentiert; eines ist `direct`, neun bleiben `indeterminate`. Die zehn
Replit-Agent-Custom-Domains sind über Customer Stories, Creator-Berichte,
einen kuratierten Builder-Showcase oder geprüfte Projektmetadaten zugeordnet;
keines ist `direct`, eines ist generisch `indicative` und neun bleiben
`indeterminate`.

Der gemeinsame Freeze-Audit bestätigt 40/40 technische Erfolge, 40/40
Verdict-Matches, 40/40 Stack-Matches und 40/40 inhaltlich zulässige Live-Seiten.
Zwei technisch erreichbare Sedo-Parking-Domains wurden vor dem finalen Freeze
durch `app.tabsquad.com` und `colorpalgen.com` ersetzt; der Audit blockiert
Parking-Inhalte jetzt ausdrücklich. Quelle, 40er-Manifest und Audit sind
SHA-256-gehasht. Der Bericht steht in
`outputs/VIBEBENCH_DEVELOPMENT_V0_2_FREEZE_2026-08-10.md`; aufgenommene und
abgelehnte Kandidaten in
`outputs/development_v0_2/VIBEBENCH_AI_ACQUISITION_LOG_2026-08-10.md`.

```bash
npm run research:v0.2-readiness
npm run development:v0.2-build
npm run development:v0.2-validate
npm run development:v0.2-audit
npm run development:v0.2-freeze
npm run research:v0.2-artifacts
```

## Artifact research und Kontextupdate v0.1.2

Die direkte Markerforschung auf allen 40 eingefrorenen Development-Zielen ist
abgeschlossen. Sie fand keine Replit-Agent-Phrase, genau einen bereits
bekannten `bolt.new`-Treffer und keine entsprechende Direct-Evidenz bei den 20
modernen Human-Kontrollen. 6/10 Replit-Ziele zeigten die generische Kombination
`Server: Google Frontend` plus Google-`via`; 1/10 verlinkte eine
`*.replit.app`-Ressource. Diese Spuren sind Infrastrukturkontext, keine
Autorschaftsevidenz.

v0.1.2 zeigt deshalb `Google Frontend response` und `Replit-hosted resource`
als Kontext, ohne den Verdict zu verändern. Die Details stehen in
`outputs/VIBEBENCH_DEVELOPMENT_V0_2_ARTIFACT_RESEARCH_2026-08-10.md` und
`outputs/VIBEBENCH_CONTEXT_EVIDENCE_V0_1_2_2026-08-10.md`.

## Development-Kandidat v0.2

Eine reproduzierbare Matrix mit 32 portablen Features wurde aus den 40
eingefrorenen Projekten erstellt. Verwendet werden neun sichtbare Stack-Signale
und 23 logarithmierte HTML-/Asset-Strukturmetriken. Ausgeschlossen sind
Hostname, URL, Provenienz, Projektfamilie, Builder-Label, Hosting-Header und
direkte Builder-Marker.

Der fest spezifizierte L2-logistische Kandidat erreicht in deterministischer
Leave-one-project-out-Cross-Validation:

- Precision 85,0 %
- Recall 85,0 %
- Accuracy 85,0 %
- Specificity 85,0 %
- TP 17, FP 3, TN 17, FN 3

Bei 100 festen stratifizierten 5-Fold-Zuordnungen bestanden 93 beide 80-%-
Gates; Median Precision und Recall lagen jeweils bei 85,0 %. Die Minima von
77,3 % Precision und 75,0 % Recall zeigen die verbleibende Unsicherheit der
kleinen Stichprobe. Modell, Matrix, Ergebnis und Featurecode sind für die
Bestätigung gehasht und weitere Development-Anpassung ist gesperrt.

Das ist ein Development-CV-Ergebnis, keine unabhängige Produktkennzahl. Der
Entwurf für einen neuen 200er-Holdout steht in
`outputs/VIBEBENCH_V0_2_CONFIRMATION_HOLDOUT_PLAN.md`.

## Nächste To-dos

1. Einen neuen Bestätigungs-Holdout mit 200 unabhängigen Projektfamilien akquirieren.
2. Provenienz, Matching und Overlap vor jeder Score-Sichtung prüfen.
3. Manifest, Retry-Regel und Auswertung vor dem ersten Request einfrieren.
4. Den Kandidaten genau einmal auswerten und die externen 80/80-Gates prüfen.

## Empfohlener nächster Schritt

Das Development-Gate ist mit 85/85 bestanden. Jetzt keine Gewichte mehr
nachjustieren, sondern den 200er-Bestätigungs-Holdout akquirieren und den
eingefrorenen Kandidaten genau einmal prüfen. Der alte 100er-Holdout bleibt
unangetastet.
