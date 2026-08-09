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
- Alle veröffentlichten Kennzahlen sind explorative Pilotdiagnostik.

Der vollständige Stand, Einschränkungen und die nächsten Forschungsaufgaben
stehen in [`outputs/VIBEBENCH_HANDOVER_V0_9.md`](outputs/VIBEBENCH_HANDOVER_V0_9.md).

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

Der 100er-Blind-Holdout ist als kontrollierter Arbeitsbereich vorbereitet:

- 50 AI-positive und 50 gematchte Human-Slots,
- zehn Slots pro Builder- bzw. Kontrollgruppe,
- XLSX-Arbeitsmappe und CSV-Manifest aus derselben Vorlage,
- automatische Struktur-, Leakage- und Freeze-Prüfung,
- getrenntes Akquisitionslog für verworfene und zurückgestellte Kandidaten.

Arbeitsprüfung ohne Ergebnisöffnung:

```bash
npm run holdout:validate
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

Die erste Web-App nimmt eine öffentliche URL entgegen und zeigt getrennt:

1. direkte Builder-Indikatoren,
2. allgemeine strukturelle und technische Hinweise,
3. Unsicherheit und Datenqualität,
4. die wichtigsten beobachteten technischen Signale.

Sie zeigt bewusst noch keinen Prozentwert. Vor einem öffentlichen
Wahrscheinlichkeitswert fehlen ein eingefrorener Blind-Holdout, belastbare
Kalibrierung und mehr builderunabhängige Ground Truth.

## Nächste To-dos

1. Den freigegebenen 100er-Holdout mit unabhängigen Provenienzquellen befüllen.
2. Passende Human-Kontrollen parallel zu jedem AI-Paket aufnehmen.
3. Duplikate und Development-/Domain-/Projekt-Leakage vollständig entfernen.
4. Bei 100 READY-Zeilen Manifest und Scanner-Commit einfrieren.
5. Erst danach den Blindlauf und eine mögliche Kalibrierung durchführen.

## Empfohlener nächster Schritt

Die ersten fünf Lovable-Deployments zusammen mit fünf gematchten Human-SaaS-
Kontrollen provenance-seitig fertigstellen. Bis zum Freeze keine weitere
Schwellenänderung am Development-Set vornehmen.
