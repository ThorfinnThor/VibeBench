# VibeBench v0.9 – erster realer URL-/Snapshot-Lauf

Stand: 2026-08-09 (Europe/Berlin)

## Ergebnis in Kürze

Der erste echte, reproduzierbare Teil-Lauf ist abgeschlossen. Alle 63 Live-Queue-Zeilen wurden verarbeitet, 30 sichere historische Static-Snapshots wurden vor dem jeweiligen Cutoff eingefroren und lokal gescannt, der Merge wurde gegen doppelte Sample-IDs gehärtet und die Modellvarianten wurden sowohl einmalig als auch über 50 gruppierte Splits evaluiert.

Die Ergebnisse sind explorative Pilotdiagnostik. Sie sind noch kein Nachweis einer allgemein gültigen „AI-Website-Erkennung“, weil Ground Truth, Stichprobengröße, zeitliche Unterschiede und Builder-/Stack-Verteilungen weiterhin starke Einschränkungen darstellen.

## 1. Live-Scan

| Kennzahl | Ergebnis |
|---|---:|
| Queue-Zeilen | 63 |
| Erfolgreiche Scans | 52 |
| Fehlgeschlagene Scans | 11 |
| Gesamtabdeckung | 82,5 % |
| AI erfolgreich | 36 / 46 (78,3 %) |
| Human erfolgreich | 16 / 17 (94,1 %) |
| Ausgabespalten | 136 |
| Definierte Schema-Features emittiert | 78 / 78 |
| Fehlende / unerwartete / doppelte Queue-IDs | 0 / 0 / 0 |

Fehlerursachen:

| Ursache | Anzahl | Samples |
|---|---:|---|
| DNS nicht auflösbar | 3 | `AIN-0009`, `AIN-0024`, `AIN-0032` |
| HTTP 404 | 4 | `AIN-0036`, `AIN-0037`, `AIN-0038`, `AIN-0041` |
| HTTP 429 | 2 | `AIN-0031`, `AIN-0034` |
| TLS-Zertifikatsprüfung | 1 | `AIN-0023` |
| HTTP 521 | 1 | `HUM-0011` |

Die niedrigere AI-Abdeckung ist selbst ein mögliches Selektionsbias. Fehlgeschlagene AI-Seiten dürfen nicht still entfernt und die 52 erfolgreichen Seiten nicht als zufällige Stichprobe behandelt werden.

Der transparente `rule_score` war nur ein Sanity Check: Erfolgreiche AI-Seiten hatten im Mittel 19,2 Punkte, Human-Seiten 0. Direkte Flag-Treffer: Lovable 8, Bolt 1, v0 4, Replit 0, Base44 0. Diese Werte gehen nicht als Modellfeature ein und sind keine Wahrscheinlichkeiten.

## 2. Historische Static-Snapshots

Von den 35 als `static_auto` markierten Repositories wurden 30 erfolgreich verarbeitet (85,7 %):

1. Repo klonen, ohne Git-LFS-Binärdateien vorauszusetzen,
2. letzten erreichbaren Commit am oder vor dem Cutoff bestimmen,
3. detached Checkout und Commit-Datum prüfen,
4. Source- und Snapshot-SHA256 erzeugen,
5. statische Site lokal ohne fremden Build-Code ausliefern,
6. mit demselben Forensics-Extractor scannen,
7. Commit-/Hash-Lock und Scan-JSON persistieren.

Fünf vermeintlich statische Rezepte benötigen eine manuelle Reklassifizierung:

| Sample | Befund | Sichere Behandlung |
|---|---|---|
| `HIS-0003` | Pug/Node-Quellen, kein gebautes `index.html` | isolierter Node-Build |
| `HIS-0028` | am Cutoff nur README/CNAME, keine Site-Datei | Ground-Truth-/Cutoff-Prüfung |
| `HIS-0037` | `index.php` statt statischer Startseite | isolierte PHP-Runtime |
| `HIS-0038` | einzelne `cuadrados.html`, kein Root-Index | URL-/Entry-Point-Prüfung |
| `HIS-0049` | Jekyll-Quelle mit `index.md` | isolierter Jekyll-Build |

Die übrigen 15 Manifest-Rezepte (`node_auto`, `static_or_node`, Jekyll, Hugo, Hexo und PHP) wurden bewusst nicht auf dem Host ausgeführt. Sie benötigen einen Container ohne Secrets, SSH-Agent, produktive Credentials oder schreibbaren Host-Mount.

## 3. Merge und Leakage-Korrektur

Der erste Merge enthielt `HIS-0024` zweimal: als Live-URL und als eingefrorenen Snapshot. Weil beide Repräsentationen unterschiedliche Gruppenkennungen hatten, hätte dieselbe Website über eine Train/Test-Grenze gelangen können.

Der Merge bevorzugt jetzt bei identischer `src_sample_id` den eingefrorenen, gehashten Snapshot. Der verifizierte Stand lautet:

| Kennzahl | Ergebnis |
|---|---:|
| Live-Eingaben | 63 |
| Nach Snapshot-Deduplizierung verbleibende Live-Zeilen | 62 |
| Historische Snapshots | 30 |
| Gemergte Zeilen | 92 |
| Erfolgreich und gelabelt | 81 |
| AI / Human trainierbar | 36 / 45 |
| Doppelte Sample-IDs | 0 |

## 4. Modellresultate

### Kombiniert: Live + Historical-Snapshots

Einzelner reproduzierbarer Gruppensplit, Seed 42, Testmenge 27:

| Modus | Features | Accuracy | ROC-AUC |
|---|---:|---:|---:|
| Full | 110 | 96,3 % | 0,984 |
| Portable | 82 | 96,3 % | 0,989 |
| Structure | 47 | 88,9 % | 0,923 |

50 wiederholte gruppierte Splits:

| Modus | mittlere Accuracy | 5.–95. Perzentil | mittlere ROC-AUC | ROC-AUC 5. Perzentil |
|---|---:|---:|---:|---:|
| Full | 97,2 % | 92,3–100,0 % | 0,985 | 0,929 |
| Portable | 97,4 % | 92,4–100,0 % | 0,986 | 0,929 |
| Structure | 89,2 % | 76,2–100,0 % | 0,942 | 0,849 |

### Live-only-Kontrolle

Die Live-only-Kontrolle reduziert den möglichen Unterschied „lokaler alter Snapshot vs. heutige Live-Site“, ist mit 52 erfolgreichen Seiten aber kleiner und AI-lastig (36 vs. 16).

| Modus | mittlere Accuracy (50 Splits) | 5.–95. Perzentil | mittlere ROC-AUC | ROC-AUC 5. Perzentil |
|---|---:|---:|---:|---:|
| Full | 96,1 % | 91,7–100,0 % | 0,971 | 0,892 |
| Portable | 96,2 % | 91,7–100,0 % | 0,973 | 0,913 |
| Structure | 85,8 % | 66,7–97,5 % | 0,908 | 0,715 |

Der härteste beobachtete Builder-Holdout ist Live-only / Structure / Bolt: 72,2 % Accuracy und 0,831 ROC-AUC. Damit ist sichtbar, dass die hohen Full-/Portable-Werte nicht als builderunabhängige Universalgenauigkeit kommuniziert werden dürfen.

## 5. Implementierte technische Verbesserungen

- Asset- und Spezialdatei-Abrufe laufen begrenzt parallel; Batch-Scans unterstützen `--workers`.
- Die Live-CSV wird nach jeder fertigen URL als Checkpoint geschrieben und kann mit `--resume` fortgesetzt werden.
- Der Historical-Builder unterstützt `--strategy` und `--resume`.
- Ohne vorhandenen Lock wird tatsächlich der letzte Commit vor dem Cutoff gewählt.
- Git-LFS-Pointer können ohne Host-Installation von `git-lfs` ausgecheckt werden.
- Der Merge verhindert doppelte Sample-IDs zwischen Live- und Snapshot-Quellen.
- Der Evaluator berichtet zusätzlich 50 wiederholte gruppierte Splits mit Mittelwert, Streuung und Perzentilen.
- Die Standard-Runner führen nur `static_auto` aus und verlangen mindestens 30 erfolgreiche Snapshots. Build-/Runtime-Strategien bleiben bis zu einem isolierten Container-Workflow ausgeschlossen.

## 6. Ergebnisdateien

- `vibebench_live_features_v0_9.csv`: alle 63 Live-Zeilen einschließlich Fehlern.
- `vibebench_url_training_features_v0_9.csv`: deduplizierter Merge mit 92 Zeilen.
- `vibebench_url_baseline_metrics_v0_9.json`: einzelner kombinierter Baseline-Split.
- `vibebench_url_model_diagnostics_v0_9.json`: kombinierte Modi, 50 Splits und Builder-Holdouts.
- `vibebench_live_only_baseline_metrics_v0_9.json`: Live-only-Baseline.
- `vibebench_live_only_model_diagnostics_v0_9.json`: Live-only-Modi, 50 Splits und Builder-Holdouts.
- `../vibebench_historical_snapshots/run_summary.json`: 35-Zeilen-Status der sicheren Static-Stufe.
- `../vibebench_historical_snapshots/locks/`: Commit-, Datums- und Hash-Locks der 30 erfolgreichen Snapshots.

## 7. Nächste Prioritäten

1. Container-Runner für die 15 Build-/Runtime-Strategien und die fünf reklassifizierten Static-Fehler erstellen.
2. Die 11 Live-Fehler mit einem versionierten Retry-Protokoll erneut prüfen, ohne TLS-Validierung abzuschalten.
3. Registrierbare Domains korrekt als eTLD+1 gruppieren; die aktuelle Zwei-Label-Heuristik ist bei Domains wie `example.co.uk` unzureichend.
4. Einen zeitlich späteren, unangetasteten Blind-Holdout einfrieren.
5. Ground Truth und AI-positive Live-Menge erweitern, besonders Replit/Base44 und builderunabhängige Fälle.
6. Alter, Runtime, Hosting und Scanquelle als mögliche Confounder explizit testen; Deployment-Metadaten dürfen nicht mit der Zielklasse verwechselt werden.

Bis diese Punkte erfüllt sind, bleiben alle Kennzahlen Pilotdiagnostik.

## 8. Live-Retry am 2026-08-09

Die elf fehlgeschlagenen Live-URLs wurden noch am selben Tag erneut geprüft. Keine war unter der provenance-belegten Deployment-URL wieder scanbar: drei DNS-Ausfälle, ein TLS-Fehler, vier HTTP-404-, zwei HTTP-429- und ein Cloudflare-521/522-Fall. Der Trainingsstand bleibt deshalb unverändert bei 81 erfolgreichen eindeutigen Zeilen.

Details und Einzelmaßnahmen: `VIBEBENCH_LIVE_RETRY_REPORT_2026-08-09.md` sowie `vibebench_live_retry_audit_2026-08-09.json`.

## 9. Isolierter Dynamic-Build-Runner

Für die 15 Node-/Jekyll-/Hugo-/Hexo-/PHP-Rezepte wurde ein Ein-Container-pro-Sample-Runner vorbereitet. Der Container erhält nur Builder, Extractor und Manifest read-only sowie ein eigenes Sample-Output-Verzeichnis. Projekt-Root, Nutzer-Home, Secrets, SSH-Agent und Docker-Socket werden nicht gemountet. Root-Dateisystem, Capabilities, Prozesszahl, offene Dateien, CPU und RAM sind eingeschränkt.

Der Docker-Client ist vorhanden, Docker Desktop/der Daemon war beim letzten Check jedoch nicht aktiv. Deshalb wurde noch kein fremder dynamischer Build ausgeführt. Der nächste kontrollierte Test ist ausschließlich `HIS-0021` (`node_auto`), gefolgt von `HIS-0001` (`php_runtime`). Details: `VIBEBENCH_ISOLATED_RUNNER_README.md`.
