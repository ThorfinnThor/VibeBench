# VibeBench URL Detector v0.9 – Arbeitsstand und Übergabe

Stand: 2026-08-09, ergänzt um den ersten realen URL-/Snapshot-/Modelllauf

Dieses Verzeichnis bündelt den aktuell bereitgestellten v0.9-Stand von VibeBench. Ziel ist ein nachvollziehbarer Benchmark für die Frage, ob sich **AI- bzw. Vibe-Coding-Entwicklung aus öffentlich sichtbaren Deployment-Artefakten probabilistisch erkennen lässt**. Das System soll keine Autorenschaft „beweisen“. Es trennt deshalb direkte Builder-Artefakte von allgemeinen Framework-, Hosting-, DOM-, Asset- und UI-Signalen.

## Kurzfassung

- Master-Dataset: **2.000 Samples** in vier Kohorten zu je 500.
- Strict-ready im Master: **333**; relaxed-ready: **374**; URL/Repo aufgelöst: **376**.
- AI-native 500: **44 strict-ready**, davon 13 Lovable, 19 Bolt, 6 Replit Agent und 6 v0.
- URL-Scan-Queue: **63 URLs**, davon **46 AI** und **17 Human**.
- Alle 63 Queue-Zeilen dürfen erst nach erfolgreichem Scan (`scan_ok=1`) ins URL-Modell einfließen.
- Feature-Schema: **78 technische Merkmale** plus klare Rollen für direkte Evidenz, Stack, Hosting, Heuristiken, Kontext und Qualitätskontrolle.
- Evaluation: drei Modellmodi (`full`, `portable`, `structure`) plus Leave-one-builder-out.
- Die vier zuvor fehlenden Runner-Abhängigkeiten sind wiederhergestellt. Freeze/Hash/Local-Scan, Merge, Baseline und v0.9-Evaluator wurden mit kontrollierten lokalen Fixtures erfolgreich getestet.
- Der reale Live-Lauf erfasste alle 63 Queue-Zeilen: 52 erfolgreich, 11 mit dokumentierten technischen Fehlern.
- Von 35 sicheren `static_auto`-Repos wurden 30 vor dem Cutoff eingefroren, gehasht und lokal gescannt. Fremder Build-/Runtime-Code wurde nicht auf dem Host ausgeführt.
- Der deduplizierte Merge enthält 92 eindeutige Zeilen, davon 81 trainierbar (36 AI, 45 Human).
- Zusätzlich zum Seed-42-Split liegen 50 wiederholte gruppierte Splits und eine Live-only-Kontrolle vor.

## Realer Lauf vom 2026-08-09

Der vollständige Laufbericht mit Fehlerlisten, Snapshot-Status, Leakage-Korrektur, Einzel- und Wiederholungsmetriken liegt in [`outputs/VIBEBENCH_RUN_REPORT_2026-08-09.md`](VIBEBENCH_RUN_REPORT_2026-08-09.md).

Die elf fehlgeschlagenen Live-URLs wurden am selben Tag erneut geprüft. Keine war wieder scanbar; die detaillierte Retry-Akte liegt in [`outputs/VIBEBENCH_LIVE_RETRY_REPORT_2026-08-09.md`](VIBEBENCH_LIVE_RETRY_REPORT_2026-08-09.md). Der Trainingsdatensatz blieb daher unverändert.

Die wichtigste Korrektur während des Laufs betraf `HIS-0024`: dieselbe Website war als Live-Zeile und Historical-Snapshot vorhanden. Der Merge bevorzugt jetzt den eingefrorenen Snapshot, sodass keine doppelte Sample-ID mit unterschiedlichen Gruppenkennungen über Train/Test-Grenzen lecken kann.

Über 50 gruppierte Splits erreicht der kombinierte Strukturmodus im Mittel 89,2 % Accuracy (5.–95. Perzentil 76,2–100,0 %) und 0,942 ROC-AUC. Live-only liegt der Strukturmodus im Mittel bei 85,8 % Accuracy; das 5. Perzentil fällt auf 66,7 %. Diese Spannweite ist die angemessenere Aussage als ein einzelner günstiger Split.

## Was bisher gemacht wurde

### v0.7 – erster URL-Prototyp

- 31 direkte strict Live-URLs wurden getrennt von Repo-only-Provenienz erfasst: 15 AI und 16 Human.
- Ein Standardbibliothek-basierter Python-Extractor wurde erstellt. Er untersucht unter anderem HTTP-Header, HTML/DOM, JS/CSS-Bundles, Asset-Namen, Source-Map-Marker, `robots.txt`, Sitemap, Manifest, DNS/TLS und Technologie-Fingerprints.
- Direkte Lovable-, Bolt-, v0-, Replit-Agent- und Base44-Artefakte wurden von schwachen UI-/Framework-Signalen getrennt.
- Der transparente `rule_score` wurde als Smoke-Test definiert, ausdrücklich **nicht** als kalibrierte AI-Wahrscheinlichkeit.
- Der Extractor wurde lokal an einer kontrollierten Seite getestet; der echte Live-Lauf war in der damaligen Runtime wegen fehlendem normalen DNS-/Webzugriff noch offen.

### v0.8 / v0.8.1 – historische Human-Kontrollen und Pipeline

- Für 50 historische, strict Human-Web-Repositories wurden Build-Rezepte beschrieben: 35 statische Sites, 4 Node/React/Pug-Builds, 3 Jekyll, 2 Hugo, 1 Hexo und 4 PHP-Runtime-Sites.
- Der geplante Snapshot-Builder friert Git-SHA und Pre-AI-Cutoff ein, baut die Website, erzeugt Source-/Build-SHA256 und scannt den lokalen Snapshot.
- Die Kette Commit-Lock → Datumsprüfung → Snapshot → Hashing → lokaler Server → Feature-Extraktion → Merge wurde an einem künstlichen Git-Repo mit Commit-Datum 2019-06-15 getestet.
- Die Live-Queue wuchs auf 32 strict URLs. Bei vollständigen historischen Builds war ein erster Versuch mit 82 Ground-Truth-Samples vorgesehen: 15 AI vs. 67 Human.

### v0.9 – mehr AI-Live-URLs und Generalisierungsdiagnostik

- 31 neue AI-positive URL-Kandidaten wurden ergänzt: 6 Lovable, 13 Bolt, 6 Replit Agent und 6 v0.
- Die AI-native strict-Menge stieg auf 44/500; der Master auf 333 strict-ready.
- Die Scan-Queue wuchs auf 63 URLs: 46 AI vs. 17 Human.
- Bolt-Verzeichnisfälle sind konservativ als `AI_GOLD_1_DIRECTORY_STRICT` markiert; offizielle Builder-Stories, offizielle v0-Deployments und direkte Maker-Aussagen haben höhere Evidenzstufen.
- `.replit.app` ist nur noch neutrales Hosting-Signal. Nur explizite Replit-Agent-Artefakte dürfen als direkter Builder-Hinweis zählen. Analog ist `.vercel.app` allein kein v0-Beweis.
- TanStack Start wurde als Stack-Fingerprint ergänzt, ohne es selbst als AI-Evidenz zu behandeln.
- Eine neue Evaluation misst `full`, `portable` und `structure` sowie Leave-one-builder-out, damit ein Modell nicht nur einzelne Builder-Domains wiedererkennt.

### Wiederherstellung aus dem Share-Chat

Der öffentliche Chat [KI-Website Erkennung Tipps](https://chatgpt.com/share/6a75f457-ffc0-83eb-bb0c-83d8be0d5680) enthält die v0.7-/v0.8-Ergebniszusammenfassungen sowie eingebettete Analyse-Quellzellen. Die ursprünglichen `sandbox:/mnt/data/...`-Dateianhänge werden in der Share-Ansicht nicht als normale Downloads freigegeben. Deshalb wurde transparent wie folgt rekonstruiert:

- `vibebench_snapshot_builder.py` aus der vollständigen v0.8-Quellzelle plus dem dort dokumentierten v0.8.1-JSON-Patch; zusätzlich mit lokalem Repo-Smoketest-Support und hartem `scan_ok`-Gate.
- `vibebench_merge_url_features.py` aus der im Share-Chat sichtbaren v0.8.1-Quellzelle.
- `vibebench_historical_snapshot_manifest_v0_8.csv` aus den 50 strict Historical-Human-Zeilen des v0.9-Masters mit derselben veröffentlichten Strategielogik. Die resultierende Verteilung stimmt exakt: 35 `static_auto`, 4 `node_auto`, 3 Jekyll, 2 Hugo, 1 Hexo, 4 PHP und 1 `static_or_node`.
- `vibebench_train_baseline.py` als v0.9-kompatible Rekonstruktion aus dem dokumentierten Verhalten. Der Original-Dateikörper war im Public Share nicht verfügbar; diese Datei ist daher funktional rekonstruiert, nicht byte-identisch behauptet.
- `scan_ok` wurde sowohl in Baseline als auch v0.9-Evaluator als Qualitäts-/Gate-Feld aus den Modellfeatures ausgeschlossen.

## Dateien in diesem Verzeichnis

| Datei | Rolle | Status |
|---|---|---|
| `vibebench_master_2000_v0_9.xlsx` | Master-Dataset mit Summary, vier 500er-Kohorten und `Sources & Rules` | vorhanden |
| `vibebench_ai_native_500_v0_9.csv` | CSV-Export der AI-native-Kohorte | vorhanden |
| `vibebench_ai_live_url_expansion_v0_9.xlsx` | Audit der 31 neuen AI-URLs und 63er Queue | vorhanden |
| `vibebench_url_scan_queue_63_v0_9.csv` | Eingabe für den Live-Extractor | vorhanden |
| `vibebench_feature_schema_v0_9.csv` | Definition der 78 technischen Merkmale | vorhanden |
| `vibebench_forensics_extractor_v0_9.py` | URL-/Batch-Scanner | real gelaufen; parallel und resumierbar |
| `vibebench_evaluate_url_models_v0_9.py` | Generalisierungs-, Wiederholungs- und Builder-Holdout-Evaluation | real gelaufen |
| `vibebench_snapshot_builder.py` | Freeze, Cutoff-Prüfung, Build, Hashing und lokaler Scan historischer Repos | 30/35 sichere Static-Snapshots erfolgreich |
| `vibebench_historical_snapshot_manifest_v0_8.csv` | Build-Rezepte für 50 Historical-Human-Repositories | aus v0.9-Master regeneriert und verifiziert |
| `vibebench_merge_url_features.py` | Merge von Live- und Snapshot-Features | real gelaufen; Sample-ID-Deduplizierung aktiv |
| `vibebench_train_baseline.py` | Gruppierte logistische Baseline | real gelaufen |
| `vibebench_url_evaluation_methodology_v0_9.md` | Kurzmethodik der drei Modellmodi | vorhanden |
| `run_vibebench_url_training_pipeline_v0_9.sh` | sichere, resumierbare End-to-End-Orchestrierung | aktualisiert; Static-only als Host-Default |
| `run_historical_snapshot_freeze.sh` | sicherer Runner für Static-Historical-Snapshots | aktualisiert; Static-only als Host-Default |
| `outputs/VIBEBENCH_RUN_REPORT_2026-08-09.md` | Bericht des ersten realen Laufs | vorhanden |
| `outputs/VIBEBENCH_LIVE_RETRY_REPORT_2026-08-09.md` | Audit des Retries der 11 Live-Ausfälle | 0/11 wieder scanbar |
| `outputs/VIBEBENCH_ISOLATED_RUNNER_README.md` | Sicherheits- und Bedienhinweise für dynamische Historical-Builds | vorbereitet; Docker-Daemon aus |
| `outputs/vibebench_live_features_v0_9.csv` | vollständige Live-Scan-Ausgabe | 63 Zeilen, 52 erfolgreich |
| `outputs/vibebench_url_training_features_v0_9.csv` | deduplizierter Trainings-Merge | 92 Zeilen, 81 trainierbar |
| `outputs/vibebench_url_model_diagnostics_v0_9.json` | kombinierte Evaluation inkl. 50 Splits | vorhanden |
| `outputs/vibebench_live_only_model_diagnostics_v0_9.json` | Live-only-Kontrolle inkl. 50 Splits | vorhanden |
| `outputs/vibebench_recovered_pipeline_sources_v0_9.zip` | Kompaktes Paket der 13 ausführungsrelevanten Pipeline-/Container-Dateien | vorhanden und Inhaltsliste geprüft |
| `website_design_reference_master_750.csv` | Separater Design-Referenzkorpus mit 750 Websites/Webapps/Blogs/SaaS-Seiten | vorhanden; nicht automatisch Ground Truth für das URL-Modell |
| `vibebench_previous_work_context_v0_7_to_v0_9.txt` | Übernommener Verlauf und frühere Ergebniszusammenfassungen | vorhanden |

Die zusätzlich bereitgestellte Datei `vibebench_url_evaluation_methodology_v0_9(1).md` wurde nicht doppelt übernommen: Sie ist byte-identisch zur Datei ohne `(1)`; beide haben SHA-256 `f0c5b10e84b87d8b59a695e637613feab87da1676e9dfec3423b816366626a0a`.

## Datenstand im Detail

### Master-Dataset

| Kohorte | Zeilen | Strict-ready | Relaxed-ready | URL/Repo aufgelöst |
|---|---:|---:|---:|---:|
| AI Native | 500 | 44 | 46 | 47 |
| AI Agents | 500 | 223 | 259 | 260 |
| Historical Human | 500 | 50 | 50 | 50 |
| Modern Human | 500 | 16 | 19 | 19 |
| **Gesamt** | **2.000** | **333** | **374** | **376** |

`strict-ready` im Master ist nicht gleichbedeutend mit „bereits als URL-Trainingszeile verwendbar“. Für das URL-Modell gilt zusätzlich der Scan-Gate: nur Provenienz-konforme Zeilen mit `scan_ok=1`.

### Aktuelle 63er URL-Queue

| Klasse/Builder | Anzahl |
|---|---:|
| Human | 17 |
| Lovable | 13 |
| Bolt | 19 |
| Replit Agent | 6 |
| v0 | 6 |
| Claude Code | 2 |
| **Gesamt** | **63** |

Der letzte dokumentierte Deployment-Status besteht aus 32 bestehenden Pilotzeilen, 9 am 2026-08-07 verifizierten Seiten, 4 weiteren verifizierten Seiten, 2 kürzlich geöffneten Seiten, 1 Redirect-Seite sowie 15 noch ausstehenden bzw. problematischen Scans.

### Design-Referenzkorpus

`website_design_reference_master_750.csv` enthält 750 kuratierte Referenzen: 456 Websites, 192 Webapps, 71 Blogs und 31 SaaS-Seiten. Dieser Korpus ist für visuelle/strukturelle Vergleichsmerkmale interessant, besitzt aber in der vorliegenden Form keine dokumentierten AI-vs.-Human-Ground-Truth-Labels. Er sollte daher nicht ungeprüft als Human-Kontrollklasse verwendet werden.

## Technischer Ablauf

Der Runner beschreibt folgende Kette:

```text
63 öffentliche Live-URLs
  → URL-Forensics-Extractor
  → vibebench_live_features_v0_9.csv

50 historische Human-Repositories
  → Commit-/Cutoff-Prüfung
  → reproduzierbare lokale Website-Snapshots
  → lokaler Forensics-Scan

Live-Features + Snapshot-Features
  → Merge
  → vibebench_url_training_features_v0_9.csv
  → Baseline-Training
  → full / portable / structure
  → Leave-one-builder-out
```

Der aktuell vorgesehene Startbefehl lautet:

```bash
./run_vibebench_url_training_pipeline_v0_9.sh
```

### Was der Extractor erfasst

- Scan-/HTTP-Qualität: Status, Redirects, Antwortzeit, Größen und Fehler.
- HTML/DOM/SEO/PWA: Meta-Daten, Canonical, JSON-LD, OpenGraph, Formulare, Klassen, Data-Attribute, `robots.txt`, Sitemap und Manifest.
- Assets: same-origin JS/CSS, gescannte Bytes, gehashte Dateinamen und Source-Map-Marker.
- Direkte Builder-Signale: Lovable, Bolt, v0, expliziter Replit Agent und Base44.
- Stack-/UI-Kontext: Next.js, Nuxt, Astro, Svelte, Angular, Vue, React, Vite, TanStack Start, Tailwind, Radix, Lucide, Framer Motion, Supabase, Firebase, Clerk sowie traditionelle Builder/CMS.
- Hosting/Header: unter anderem Lovable, Replit, Vercel, Netlify und providerbezogene Header.
- DNS/TLS: IP-Auflösung, IPv6 und leichte Zertifikatsmetadaten.

Private und lokale Adressen werden standardmäßig blockiert. `--allow-private` ist nur für kontrollierte lokale Snapshot-Tests gedacht.

## Evaluationslogik

### 1. Full

Verwendet alle zulässigen numerischen technischen Merkmale einschließlich direkter Builder-Artefakte. Das misst den besten deploy-time Detektor, wenn solche Artefakte erhalten bleiben.

### 2. Portable

Entfernt `builder_*`, `hosting_*`, `header_*`, `data_component_id_count` und traditionelle builder-spezifische Technologieflags. Das prüft, ob Signal jenseits direkter Builder-/Hosting-Fingerprints existiert.

### 3. Structure

Entfernt zusätzlich alle `tech_*`-Flags. Das ist ein harter Stress-Test für DOM-, Asset-, SEO-, Layout- und allgemeine Strukturmerkmale.

### 4. Leave-one-builder-out

Für Builder mit genügend erfolgreichen AI-Samples wird der gesamte Builder aus dem Training entfernt und zusammen mit gehaltenen Human-Domains getestet. So wird sichtbar, wenn gute Kennzahlen in Wahrheit nur Builder-/Domain-Erkennung sind.

Gemeldet werden Accuracy, AI-Precision, AI-Recall, AI-F1, ROC-AUC, Brier Score, Konfusionsmatrix und die stärksten logistischen Koeffizienten. Das Gate-Feld `scan_ok` wird nicht als Modellfeature verwendet. Die Ausgabe ist ausdrücklich Pilotdiagnostik; Produktionsgenauigkeit darf erst nach einem eingefrorenen, gruppierten Blind-Holdout behauptet werden.

## Aktueller Status und verbleibende externe Voraussetzungen

Der reale Live-Lauf, die sichere Static-Historical-Stufe, der deduplizierte Merge sowie Baseline, drei Modellmodi, Builder-Holdouts und 50 wiederholte Gruppensplits sind abgeschlossen.

Aktuell trainierbar sind 81 eindeutige erfolgreiche Zeilen: 36 AI und 45 Human. Elf Live-Seiten sind technisch nicht scanbar gewesen. Von 35 `static_auto`-Repos waren 30 direkt verwendbar; fünf benötigen eine korrigierte Strategie oder Ground-Truth-Prüfung.

Noch ausstehend sind 15 reguläre Build-/Runtime-Rezepte und fünf reklassifizierte Static-Fehler. Node/npm, Ruby/Bundler/Jekyll, Hugo, Hexo und PHP dürfen nicht über den normalen Host-Runner ausgeführt werden. Dafür wird ein isolierter Container-Workflow ohne Secrets, SSH-Agent, produktive Credentials und schreibbaren Workspace-Mount benötigt.

Dieser isolierte Workflow ist inzwischen implementiert: ein Container pro Sample, drei einzelne read-only Input-Dateien, getrennte Output-Verzeichnisse, read-only Root-Dateisystem, entfernte Capabilities und Ressourcenlimits. Der Docker-Client ist installiert; Docker Desktop/der Daemon war beim letzten Check jedoch nicht aktiv. Deshalb wurde noch kein fremder dynamischer Build gestartet.

Der kombinierte Datensatz ist trotz guter Pilotwerte anfällig für Zeit-/Runtime-Confounding: ein Teil der Human-Kontrollen sind lokale Pre-AI-Snapshots, während die AI-Seiten heutige Live-Deployments sind. Deshalb werden kombinierte und Live-only-Ergebnisse getrennt berichtet.

## Empfohlene Fortsetzung

### P0 – isolierten Build-Runner ergänzen

1. Container-Images bzw. klar getrennte Images für Node, Jekyll, Hugo, Hexo und PHP definieren.
2. Read-only Source-Input, temporären Output, deaktivierte Secrets/SSH-Sockets, Ressourcenlimits und ein minimales Netzwerkprofil erzwingen.
3. Je Strategie eine Probe bauen, Logs prüfen und erst danach die übrigen 15 regulären Rezepte plus reklassifizierte Fehler ausführen.

### P1 – Ausfälle und Ground Truth härten

1. Die 11 Live-Fehler versioniert erneut prüfen, ohne TLS-Prüfung zu deaktivieren.
2. Die fünf fehlklassifizierten `static_auto`-Rezepte korrigieren und Cutoff/Entry-Point fachlich bestätigen.
3. Provenienzbelege und Deployment-Mappings archivieren, damit Labels nicht von veränderlichen Seiten abhängen.
4. Scanzeit, Erreichbarkeit und Retry-Ergebnis als eigene Auditdaten persistieren.

### P1 – AI-positive Klasse ausbauen

Ziel sind etwa 70–100 wirklich scanbare AI-positive Live-Seiten mit belegter konkreter Deployment-URL. Priorität haben offizielle Builder-Stories/Deployments, direkte Maker-Aussagen und Repositories mit eindeutigem Deployment-Mapping. Verzeichnis-Proxy-Evidenz sollte separat berichtet werden.

### P2 – methodische Härtung

- Die vorhandenen 50 Wiederholungssplits durch verschachtelte Group-CV bzw. Bootstrap-Konfidenzintervalle ergänzen.
- Einen zeitlich späteren, unangetasteten Blind-Holdout einfrieren.
- Builder, Hostinganbieter und registrierbare Domain gruppieren; `_domain_group()` verwendet aktuell nur die letzten zwei Hostname-Bestandteile und behandelt etwa `example.co.uk` nicht korrekt als eTLD+1.
- Scan-Zeitpunkt und Erreichbarkeit versionieren, weil Websites, Header und Bundles driften.
- Fehlende Werte und Scanabbrüche auf klassenabhängige Verzerrung prüfen.
- Kalibrierung separat messen; `rule_score` niemals als AI-Prozentzahl ausgeben.
- Design-Referenzkorpus nur nach einem eigenen Label-/Sampling-Protokoll in die Human-Kontrollen aufnehmen.
- Provenienzquellen möglichst als archivierte Belege/Snapshots sichern, nicht nur als veränderliche URLs.

## Nützliche Einzelbefehle

Nur Live-Queue scannen:

```bash
python vibebench_forensics_extractor_v0_9.py \
  --input-csv vibebench_url_scan_queue_63_v0_9.csv \
  --output-csv outputs/vibebench_live_features_v0_9.csv \
  --carry sample_id,cohort,label_target,binary_label,tool_or_builder,evidence_level,deployment_check_status,training_gate \
  --workers 3 \
  --resume
```

Einzelne öffentliche URL untersuchen:

```bash
python vibebench_forensics_extractor_v0_9.py https://example.com
```

Nur die historischen Snapshots einfrieren und lokal scannen:

```bash
./run_historical_snapshot_freeze.sh
```

Baseline auf einer bereits gemergten Feature-Datei:

```bash
python vibebench_train_baseline.py \
  outputs/vibebench_url_training_features_v0_9.csv \
  --output-json outputs/vibebench_url_baseline_metrics_v0_9.json
```

Evaluation auf einer bereits gemergten Feature-Datei:

```bash
python vibebench_evaluate_url_models_v0_9.py \
  outputs/vibebench_url_training_features_v0_9.csv \
  --output-json outputs/vibebench_url_model_diagnostics_v0_9.json \
  --repeats 50
```

Der Evaluator benötigt Python, NumPy und scikit-learn. Der Extractor selbst verwendet nur die Python-Standardbibliothek.

## Definition of Done für den nächsten Meilenstein

Der erste ernstzunehmende URL-Benchmark ist erreicht, wenn:

- alle Pipeline-Quelldateien versioniert vorhanden sind,
- Eingaben, Provenienz und Snapshots eingefroren und prüfbar sind,
- Scan-Erfolge und -Fehler vollständig berichtet werden,
- keine verwandten Domains über Train/Test-Grenzen lecken,
- `full`, `portable`, `structure` und Builder-Holdouts gemeinsam vorliegen,
- Konfidenzintervalle bzw. Split-Stabilität dokumentiert sind,
- und eine unangetastete Blind-Testmenge existiert.

Bis dahin sind alle Kennzahlen als explorative Pilotdiagnostik zu behandeln.
