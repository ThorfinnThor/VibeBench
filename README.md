# VibeBench

VibeBench untersucht, wie stark eine öffentlich erreichbare Website sichtbaren
Mustern aus dem validierten Vibecoding-Korpus ähnelt. Die Web-App zeigt dafür
einen Vibe-Footprint von 0 bis 100, erklärt die wichtigsten Score-Treiber und
liefert priorisierte Security-, Design-, Engineering- und Accessibility-Maßnahmen.
Der Wert ist kein Prozentanteil AI-generierten Codes und kein Beweis für
Autorenschaft.

## Was VibeBench unterscheidet

- **Builder-Evidenz:** direkte Artefakte von Lovable, Bolt, v0, Replit Agent
  und weiteren AI-Buildern.
- **Portable Signale:** Merkmale jenseits konkreter Hosting- und
  Builder-Fingerprints.
- **Struktur-Signale:** DOM-, Asset-, SEO- und Layout-Merkmale ohne
  Framework- oder Builder-Erkennung.
- **Unsicherheit:** nicht scanbare oder mehrdeutige Websites werden nicht als
  sichere Klassifikation ausgegeben.

## Aktueller Forschungsstand

Der aktuell in die Web-App integrierte, eingefrorene v0.4-Kandidat erreichte im
damaligen unabhängigen 100er-Holdout 82,4 % Precision und 85,7 % Recall bei
99/100 technisch erfolgreichen Scans. Diese Zahlen sind nur noch als
**Legacy-Ergebnis** gekennzeichnet: Die Vollständigkeit der damaligen Captures
ist nachträglich nicht belegbar, daher sind sie kein aktueller Leistungsnachweis.
Der isolierte Option-B-v4-Development-Collector ist technisch stabil; eine
frische unabhängige Confirmation ist als nächster, separat zu autorisierender
Schritt vorbereitet, aber noch nicht als neue Leistungszahl ausgeführt.
Vollständiger Stand:
[`outputs/VIBEBENCH_STATUS_2026-08-10.md`](outputs/VIBEBENCH_STATUS_2026-08-10.md).
Run 1 und ein technisch stabiler, aber mit 18,93 Stunden zu früh ausgeführter
Repeat sind in
[`outputs/VIBEBENCH_OPTION_B_V4_EARLY_REPEAT_2026-08-16.md`](outputs/VIBEBENCH_OPTION_B_V4_EARLY_REPEAT_2026-08-16.md)
dokumentiert. Der Projektinhaber hat die Abweichung für den engen technischen
Gate ausdrücklich akzeptiert; die ursprüngliche 24–72-Stunden-Regel bleibt im
Audit unverändert als nicht erfüllt sichtbar. Die anschließend erlaubte,
eingefrorene 20er-Erweiterung erreichte 20/20 technische Erfolge und bestand
den korrigierten Isolation-, Privacy-, Payload- und Yield-Review:
[`outputs/VIBEBENCH_OPTION_B_V4_EXTENSION_20_RESULT_2026-08-16.md`](outputs/VIBEBENCH_OPTION_B_V4_EXTENSION_20_RESULT_2026-08-16.md).
Die danach autorisierte 81er-Erweiterung erreichte 61/81 technische Erfolge
(über dem technischen Mindestwert 57). Die Captures wurden label-blind im
isolierten Runtime-Pfad erstellt; die 20 Ausfälle sind technische bzw. nicht
klassifizierbare Ergebnisse. Die daraus abgeleiteten 38 Features und die
Development-Cross-Validation bleiben ausdrücklich Forschung und ändern das
Live-Modell nicht. Siehe
[`outputs/VIBEBENCH_OPTION_B_V4_EXTENSION_81_RESULT_2026-08-16.md`](outputs/VIBEBENCH_OPTION_B_V4_EXTENSION_81_RESULT_2026-08-16.md).

- Master-Dataset: 2.000 Samples in vier Kohorten.
- URL-Scan-Queue: 63 Websites, davon 52 erfolgreich gescannt.
- Trainings-Merge: 81 eindeutige, erfolgreiche und gelabelte Samples.
- Evaluation: Full, Portable, Structure und Leave-one-builder-out.
- Blind-Holdout v0.1: 100 eingefrorene Sites, 98 technisch erfolgreich ausgewertet.
- Primärregel im Holdout: 71,4 % Accuracy, 76,9 % Precision, 61,2 % Recall,
  81,6 % Specificity und 68,2 % F1.
- Direkte Builder-Evidenz: 28/49 erfolgreiche AI-Sites und 0/49 Human-Kontrollen;
  der Direct-only-Vergleich ist post-hoc und noch nicht unabhängig validiert.

Der vollständige Stand, Einschränkungen und die nächsten Forschungsaufgaben
stehen im aktuellen
[`outputs/VIBEBENCH_HANDOVER_2026-08-10.md`](outputs/VIBEBENCH_HANDOVER_2026-08-10.md).

## Produkt v0.4

Die Web-App ist der öffentliche Adapter um den eingefrorenen v0.4-
Forschungskandidaten; `v0.4` bezeichnet die Modell-/Release-Linie und nicht
jede einzelne Scanner- oder API-Komponente. Sie bewertet zusätzlich sieben öffentlich
sichtbare Security-Header-Prüfungen und erzeugt einen priorisierten
Verbesserungsplan. Umsetzung, Grenzen, Teststand und nächste Aufgaben stehen in
[`outputs/VIBEBENCH_PRODUCT_V0_4_UI_2026-08-11.md`](outputs/VIBEBENCH_PRODUCT_V0_4_UI_2026-08-11.md).

Der anschließende score-blinde Ausbau um 120 Development-Websites und die
Experimente mit 180 Oberflächenmerkmalen stehen in
[`outputs/VIBEBENCH_V0_5_90_90_RESEARCH_2026-08-11.md`](outputs/VIBEBENCH_V0_5_90_90_RESEARCH_2026-08-11.md).
Das 90/90-Ziel wurde in Development noch nicht stabil erreicht und wird daher
nicht als neue Produktkennzahl ausgewiesen.

Der für erste Kunden vorgesehene begrenzte Beta-Betrieb, die peer-gepinnte
Produktionsverbindung, Ressourcenlimits, Vercel-Firewall-Regel und der
Release-/Rollback-Check stehen in
[`outputs/VIBEBENCH_CUSTOMER_BETA_LAUNCH_2026-08-16.md`](outputs/VIBEBENCH_CUSTOMER_BETA_LAUNCH_2026-08-16.md).

## Produktions-Smoke-Test

Der versionierte Testlauf gegen die veröffentlichte App umfasst 10 gelabelte
AI-Seiten und 10 Human-Kontrollen. Der Report und die Einzelergebnisse stehen in
[`outputs/VIBEBENCH_PRODUCTION_SMOKE_2026-08-09.md`](outputs/VIBEBENCH_PRODUCTION_SMOKE_2026-08-09.md).
Die anschließende Untersuchung und Implementierung des begrenzten Asset-Scans
ist in [`outputs/VIBEBENCH_ASSET_EVIDENCE_UPDATE_2026-08-09.md`](outputs/VIBEBENCH_ASSET_EVIDENCE_UPDATE_2026-08-09.md)
dokumentiert.
Der erneute Produktionslauf steht in
[`outputs/VIBEBENCH_PRODUCTION_SMOKE_ASSET_V1_2026-08-09.md`](outputs/VIBEBENCH_PRODUCTION_SMOKE_ASSET_V1_2026-08-09.md),
der direkte Vorher-/Nachher-Vergleich in
[`outputs/VIBEBENCH_PRODUCTION_COMPARISON_ASSET_V1_2026-08-09.md`](outputs/VIBEBENCH_PRODUCTION_COMPARISON_ASSET_V1_2026-08-09.md).
Die nachfolgende getrennte Header- und Manifest-Kontextschicht ist in
[`outputs/VIBEBENCH_HEADER_MANIFEST_UPDATE_2026-08-09.md`](outputs/VIBEBENCH_HEADER_MANIFEST_UPDATE_2026-08-09.md)
dokumentiert.
Der vollständige Browser-Capture aller 52 historisch erfolgreichen URLs steht in
[`outputs/VIBEBENCH_PRODUCTION_SMOKE_FULL_HEADER_MANIFEST_2026-08-09.md`](outputs/VIBEBENCH_PRODUCTION_SMOKE_FULL_HEADER_MANIFEST_2026-08-09.md).
Die kohorten- und builderweise Einordnung der Kontextsignale steht in
[`outputs/VIBEBENCH_CONTEXT_EVIDENCE_DATASET_ANALYSIS_2026-08-09.md`](outputs/VIBEBENCH_CONTEXT_EVIDENCE_DATASET_ANALYSIS_2026-08-09.md).
Der bestätigte Produktionslauf nach der False-Positive-Härtung steht in
[`outputs/VIBEBENCH_PRODUCTION_SMOKE_POST_HARDENING_2026-08-09.md`](outputs/VIBEBENCH_PRODUCTION_SMOKE_POST_HARDENING_2026-08-09.md),
der reproduzierbare Vorher-/Nachher-Vergleich in
[`outputs/VIBEBENCH_PRODUCTION_COMPARISON_POST_HARDENING_2026-08-09.md`](outputs/VIBEBENCH_PRODUCTION_COMPARISON_POST_HARDENING_2026-08-09.md).
Die sichtbare Erklärung der generischen Strukturmuster wurde anschließend in
Produktion bestätigt: Der erneute Scan von `cardshows.io` zeigte unter
„Erkannte Strukturmuster“ die Hinweise `Dense modern stack` und
`High data-attribute density`.
Das eingefrorene Development-Regelwerk steht in
[`outputs/VIBEBENCH_WEB_SCANNER_DECISION_POLICY_V0_1.md`](outputs/VIBEBENCH_WEB_SCANNER_DECISION_POLICY_V0_1.md),
der freigegebene nächste Evaluationsschritt in
[`outputs/VIBEBENCH_BLIND_HOLDOUT_PLAN_V0_1.md`](outputs/VIBEBENCH_BLIND_HOLDOUT_PLAN_V0_1.md).

Der 100er-Blind-Holdout wurde am 2026-08-10 kontrolliert ausgeführt:

- 50 AI-positive und 50 gematchte Human-Sites,
- zehn Slots pro Builder- bzw. Kontrollgruppe,
- vorregistriertes Scan-/Retry-Protokoll und eingefrorener Scanner-Commit,
- 98 technische Erfolge, zwei Fehler nach genau einem Retry,
- vollständige Rohdaten, Bootstrap-Metriken, Bericht und Ergebnis-Workbook,
- SHA-256-Manifest und reproduzierbare Paketprüfung.

Der Bericht steht in
[`outputs/holdout_v0_1/blind_run_v0_1_2026-08-10/VIBEBENCH_BLIND_HOLDOUT_EVALUATION_V0_1.md`](outputs/holdout_v0_1/blind_run_v0_1_2026-08-10/VIBEBENCH_BLIND_HOLDOUT_EVALUATION_V0_1.md).

## Produktsemantik v0.1.1

Die App setzt die wichtigste Holdout-Erkenntnis um, ohne die eingefrorene
Scannerregel nachträglich zu verändern:

- `direct`: sichtbares Builder-Artefakt; konkrete technische Evidenz, aber kein
  Beweis für Autorenschaft oder AI-Anteil,
- `indicative`: allgemeine Stack-/DOM-Muster; ausdrücklich keine AI- oder
  Vibe-Coding-Attribution,
- `indeterminate`: keine ausreichende sichtbare Evidenz; weder AI- noch
  Human-Zuordnung,
- technischer Fehler: eigener Zustand für Blockierung, Timeout, Größenlimit,
  Redirect-, DNS-, Eingabe- oder Content-Type-Probleme.

Die Umsetzung und lokale Browserprüfung stehen in
[`outputs/VIBEBENCH_PRODUCT_SEMANTICS_UPDATE_2026-08-10.md`](outputs/VIBEBENCH_PRODUCT_SEMANTICS_UPDATE_2026-08-10.md).

## Development-Vorbereitung v0.2

Die reproduzierbare Diagnose des festen 52-Site-Development-Captures zeigt
eine entscheidende Datenlücke: 34/35 erfolgreiche AI-Sites, aber keine der 16
Human-Kontrollen haben mindestens zwei erkannte moderne Stack-Signale. Diese
Human-Kontrollen reichen daher nicht aus, um breitere Strukturregeln gegen
moderne React-/Next-/SaaS-Seiten abzusichern.

Diagnose und Akquisitionsprotokoll:

- [`outputs/VIBEBENCH_DEVELOPMENT_V0_2_READINESS_2026-08-10.md`](outputs/VIBEBENCH_DEVELOPMENT_V0_2_READINESS_2026-08-10.md)
- [`outputs/VIBEBENCH_DEVELOPMENT_V0_2_ACQUISITION_PROTOCOL.md`](outputs/VIBEBENCH_DEVELOPMENT_V0_2_ACQUISITION_PROTOCOL.md)
- [`outputs/development_v0_2/VIBEBENCH_AI_ACQUISITION_LOG_2026-08-10.md`](outputs/development_v0_2/VIBEBENCH_AI_ACQUISITION_LOG_2026-08-10.md)

Die eingefrorene Erweiterung enthält 40 Development-Slots: je zehn neue
Replit-Agent-, Bolt-, Human-Modern-SaaS- und Human-Modern-App-Sites. Sie wird
automatisch gegen bestehende Development- und Holdout-URLs sowie Hosts geprüft.
Die 20 Human-Slots sind mit vor dem 30. November 2022 begonnenen öffentlichen
Source-Projekten gefüllt und validiert; Replit Agent und Bolt stehen bei je
10/10 READY.
16/20 dieser Kontrollen haben mindestens zwei erkannte moderne Stack-Signale,
und 7/20 lösen unter der v0.1-Baseline bereits `indicative` aus.
Zusätzlich sind zehn neue, über unabhängige Hackathon-Submissions dokumentierte
Bolt-Custom-Domain-Deployments READY. Unter v0.1 ist eines `direct` und neun
sind `indeterminate`.
Die zehn Replit-Agent-Custom-Domains sind exakt über Customer Stories,
Creator-Berichte, einen kuratierten Builder-Showcase oder geprüfte
Projektmetadaten zugeordnet. Unter v0.1 sind neun `indeterminate`, eine nur
generisch `indicative` und keine `direct`.

Der gemeinsame Freeze-Audit war vollständig stabil: 40/40 technische Erfolge,
40/40 Verdict-Matches, 40/40 Stack-Matches und 40/40 inhaltlich zulässige
Live-Seiten. Das SHA-256-Freeze-Manifest
verhindert stilles Austauschen von Samples. Details:
[`outputs/VIBEBENCH_DEVELOPMENT_V0_2_FREEZE_2026-08-10.md`](outputs/VIBEBENCH_DEVELOPMENT_V0_2_FREEZE_2026-08-10.md).

Die anschließende Markerforschung fand außer dem bestehenden `bolt.new`-
Marker keine neue hochkonfidente Direct-Regel. Google-Frontend- und eingebettete
`replit.app`-Spuren werden ab v0.1.2 transparent als Kontext gezeigt, ändern
aber keine Builder-Zuordnung. Bericht und Produktänderung:

- [`outputs/VIBEBENCH_DEVELOPMENT_V0_2_ARTIFACT_RESEARCH_2026-08-10.md`](outputs/VIBEBENCH_DEVELOPMENT_V0_2_ARTIFACT_RESEARCH_2026-08-10.md)
- [`outputs/VIBEBENCH_CONTEXT_EVIDENCE_V0_1_2_2026-08-10.md`](outputs/VIBEBENCH_CONTEXT_EVIDENCE_V0_1_2_2026-08-10.md)

Ein anschließender portabler v0.2-Kandidat verwendet ausschließlich
Stack-Signale und logarithmierte HTML-/Asset-Strukturmetriken. Hostname, URL,
Provenienz, Builder-Label, Hosting-Header und direkte Marker sind als
Modellfeatures ausgeschlossen. In Leave-one-project-out-Cross-Validation auf
Development v0.2 erreicht der Kandidat 85,0 % Precision und 85,0 % Recall
(TP 17, FP 3, TN 17, FN 3). Das erfüllt das Development-Gate, ist aber noch
keine unabhängige Produktkennzahl:

- [`outputs/VIBEBENCH_DEVELOPMENT_V0_2_CANDIDATE_80_80_2026-08-10.md`](outputs/VIBEBENCH_DEVELOPMENT_V0_2_CANDIDATE_80_80_2026-08-10.md)
- [`outputs/VIBEBENCH_V0_2_CONFIRMATION_HOLDOUT_PLAN.md`](outputs/VIBEBENCH_V0_2_CONFIRMATION_HOLDOUT_PLAN.md)

```bash
npm run research:v0.2-readiness
npm run development:v0.2-build
npm run development:v0.2-validate
npm run development:v0.2-audit
npm run development:v0.2-freeze
npm run research:v0.2-artifacts
npm run research:v0.2-features
npm run research:v0.2-candidate
npm run development:v0.2-candidate-freeze
```

Arbeitsprüfung ohne Ergebnisöffnung:

```bash
npm run holdout:validate
```

Gespeichertes Ergebnis-Paket prüfen, ohne erneut zu scannen:

```bash
npm run holdout:verify
```

Direkt gegen die Produktions-API ausführen:

```bash
npm run eval:production
```

Zwei gespeicherte Captures vergleichen:

```bash
npm run eval:compare -- BEFORE.json AFTER.json REPORT.md
```

Ein bereits erfasstes Ergebnis reproduzierbar neu auswerten:

```bash
VIBEBENCH_OUTPUT_TAG=full_header_manifest \
VIBEBENCH_RESULTS_FILE=outputs/vibebench_production_browser_capture_full_2026-08-09.json \
npm run eval:production
```

## Einzelne URL untersuchen

Web-App lokal starten:

```bash
npm install
npm run dev
```

Anschließend `http://localhost:3000` öffnen. Die App scannt nur öffentlich
auflösbare HTTP(S)-Seiten, validiert auch Weiterleitungsziele und begrenzt den
HTML-Download auf 1,5 MB. Zusätzlich prüft sie höchstens vier Same-Origin-JS-
und zwei Same-Origin-CSS-Dateien mit jeweils maximal 300 KB. Fremde Assets und
Cross-Origin-Weiterleitungen werden nicht geladen. Ein im HTML verlinktes
Same-Origin-Web-Manifest wird mit maximal 100 KB als separate Kontextquelle
geprüft; bekannte öffentliche Response-Header werden ebenfalls separat angezeigt.

CLI-Extractor:

```bash
python3 vibebench_forensics_extractor_v0_9.py https://example.com
```

Der transparente `rule_score` ist nur ein technischer Sanity-Check und keine
kalibrierte AI-Wahrscheinlichkeit.

## Pipeline

```bash
./run_vibebench_url_training_pipeline_v0_9.sh
```

Der Standardlauf führt auf dem Host nur sichere statische Snapshot-Schritte
aus. Fremde Node-, Jekyll-, Hugo-, Hexo- und PHP-Projekte gehören ausschließlich
in den isolierten Container-Runner. Details:
[`outputs/VIBEBENCH_ISOLATED_RUNNER_README.md`](outputs/VIBEBENCH_ISOLATED_RUNNER_README.md).

## Produkt-Richtung

Die Web-App nimmt eine öffentliche URL entgegen und zeigt getrennt:

1. direkte Builder-Indikatoren,
2. allgemeine strukturelle und technische Hinweise,
3. ein offenes Ergebnis bei fehlender direkter Evidenz,
4. technische Fehler ohne Klassifikationsaussage,
5. die wichtigsten beobachteten technischen Signale.

Sie zeigt bewusst noch keinen Prozentwert. Der erste Blind-Holdout ist jetzt
abgeschlossen, zeigt aber builderabhängige Abdeckung und eine zu hohe
False-Positive-Rate des allgemeinen `indicative`-Pfads. Vor einem öffentlichen
Wahrscheinlichkeitswert fehlen deshalb eine neue Development-only-Regel,
separate Kalibrierungsdaten und ein frischer Bestätigungs-Holdout.

## Nächste To-dos

1. Den vorgeschlagenen 200er-Bestätigungs-Holdout akquirieren.
2. Alle Projektfamilien, Provenienzquellen und Overlaps vor dem Scan prüfen.
3. Manifest, Retry-Regel, Modellhash und Auswertung vorregistrieren.
4. Den eingefrorenen Kandidaten genau einmal auswerten und erst danach über
   Produktion oder einen Prozentwert entscheiden.

## Empfohlener nächster Schritt

Das Development-Gate ist mit 85,0 % Precision und 85,0 % Recall bestanden.
Als Nächstes den Kandidaten ohne weitere Anpassung auf einem neuen 200er-
Bestätigungs-Holdout prüfen. Der alte Holdout wird nicht wiederverwendet.
