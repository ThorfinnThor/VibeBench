# VibeBench

VibeBench untersucht, ob eine öffentlich erreichbare Website Hinweise auf
AI-gestütztes Vibe-Coding enthält. Das aktuelle Ergebnis ist eine transparente
Evidenz-Einschätzung auf Basis sichtbarer Deployment-Artefakte und struktureller
Merkmale – kein Beweis für Autorenschaft und noch keine kalibrierte Wahrscheinlichkeit.

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

Die vorbereitete Erweiterung enthält 40 Development-Slots: je zehn neue
Replit-Agent-, Bolt-, Human-Modern-SaaS- und Human-Modern-App-Sites. Sie wird
automatisch gegen bestehende Development- und Holdout-URLs sowie Hosts geprüft.
Die 20 Human-Slots sind mit vor dem 30. November 2022 begonnenen öffentlichen
Source-Projekten gefüllt und validiert; Replit Agent steht bei 0/10 und Bolt
bei 10/10.
16/20 dieser Kontrollen haben mindestens zwei erkannte moderne Stack-Signale,
und 7/20 lösen unter der v0.1-Baseline bereits `indicative` aus.
Zusätzlich sind zehn neue, über unabhängige Hackathon-Submissions dokumentierte
Bolt-Custom-Domain-Deployments READY. Unter v0.1 ist eines `direct` und neun
sind `indeterminate`.

```bash
npm run research:v0.2-readiness
npm run development:v0.2-build
npm run development:v0.2-validate
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

1. Die aktuellen Commits pushen, über Vercel deployen und die vier
   Ergebniszustände in Produktion prüfen.
2. Zehn neue Replit-Agent-Samples mit exakter Deployment-Provenienz ergänzen.
3. Alle 40 Slots müssen den Development-/Holdout-Overlap-Validator bestehen.
4. Eine Scanner-v0.2-Regel erst auf dem erweiterten Development-Datensatz
   entwickeln; den abgeschlossenen 100er-Holdout nicht zum Tuning verwenden.
5. Für v0.2 einen neuen, unabhängigen Bestätigungs-Holdout erstellen und erst
   danach über Kalibrierung oder einen Prozentwert entscheiden.

## Empfohlener nächster Schritt

Die aktuellen Commits pushen und in Vercel deployen. Danach die zehn neuen
Replit-Agent-Samples akquirieren; diese Builder-Gruppe ist derzeit die größte
positive Abdeckungslücke.
