# VibeBench – isolierter Historical-Build-Runner

Stand: 2026-08-09

## Zweck

Dieser Runner verarbeitet die 15 Historical-Repositories, deren Rezepte Node, Jekyll, Hugo, Hexo oder PHP benötigen. Fremder Build- und Runtime-Code wird nicht auf dem Host ausgeführt.

Aktuell ist der Workflow implementiert und statisch geprüft. Der lokale Docker-Client ist installiert, aber Docker Desktop bzw. der Docker-Daemon lief beim letzten Check nicht. Deshalb wurden noch keine fremden dynamischen Repositories gestartet.

## Ausgewählte Strategien

| Strategie | Anzahl |
|---|---:|
| `node_auto` | 4 |
| `static_or_node` | 1 |
| `jekyll` | 3 |
| `hugo` | 2 |
| `hexo` | 1 |
| `php_runtime` | 4 |
| **Gesamt** | **15** |

## Sicherheitsgrenzen

- Ein eigener Container pro Sample; fremde Builds teilen kein Output-Verzeichnis.
- Das Projektverzeichnis wird nicht in den Container gemountet.
- Nur Builder, Extractor und Manifest werden als drei einzelne read-only Dateien gemountet.
- Pro Sample ist ausschließlich dessen eigenes Output-Verzeichnis schreibbar.
- Container-Root-Dateisystem read-only; `/tmp` ist ein begrenztes temporäres Dateisystem.
- Keine Secrets, SSH-Agenten, Nutzer-Home-Verzeichnisse oder produktiven Credentials werden übergeben.
- Alle Linux-Capabilities werden entfernt; `no-new-privileges` ist aktiv.
- Limits: 2 CPUs, 4 GB RAM, 512 Prozesse und 1.024 offene Dateien.
- Der Container nutzt normales Bridge-Netzwerk für Git-/Package-Downloads, aber keinen Host-Netzwerkmodus und keinen Docker-Socket.
- `.dockerignore` schließt den gesamten Projektinhalt aus dem Image-Build-Kontext aus; nur das Dockerfile wird übertragen.

Diese Maßnahmen reduzieren das Risiko deutlich, machen fremden Package-/Build-Code aber nicht vertrauenswürdig. Ergebnisse müssen weiterhin über Lock, Commit-Datum, Hash, `scan_ok` und Output-Pfade geprüft werden.

## Dateien

- `Dockerfile.vibebench-historical`: reproduzierbare Toolchain für Python, Git, Node/npm, Ruby/Jekyll, Hugo und PHP.
- `vibebench_run_isolated_snapshots.py`: Auswahl, ein Container pro Sample, Ressourcenlimits und aggregierte Ergebnisse.
- `run_historical_snapshot_isolated.sh`: kurzer Einstiegspunkt.
- `vibebench_merge_url_features.py`: akzeptiert mehrere `--snapshot-root`-Argumente und erkennt per-Sample-Outputs.

## Prüfung ohne Docker-Daemon

Alle 15 ausgewählten Zeilen anzeigen:

```bash
./run_historical_snapshot_isolated.sh --list
```

Eine einzelne Node-Probe anzeigen:

```bash
./run_historical_snapshot_isolated.sh --list --sample-id HIS-0021
```

## Empfohlener erster Lauf

Nach dem Start von Docker Desktop zunächst nur eine Node-Probe:

```bash
./run_historical_snapshot_isolated.sh --sample-id HIS-0021
```

Danach eine PHP-Probe:

```bash
./run_historical_snapshot_isolated.sh --sample-id HIS-0001
```

Erst wenn beide Outputs, Logs, Hashes und lokalen Scans plausibel sind:

```bash
./run_historical_snapshot_isolated.sh
```

Die Ergebnisse liegen getrennt unter `vibebench_historical_isolated_runs/<sample_id>/`. Die aggregierte Zusammenfassung wird als `vibebench_historical_isolated_runs/run_summary_isolated.json` geschrieben.

## Merge nach erfolgreichen Builds

```bash
python3 vibebench_merge_url_features.py \
  --live-features outputs/vibebench_live_features_v0_9.csv \
  --snapshot-root vibebench_historical_snapshots \
  --snapshot-root vibebench_historical_isolated_runs \
  --manifest vibebench_historical_snapshot_manifest_v0_8.csv \
  --output-csv outputs/vibebench_url_training_features_v0_9.csv
```

Anschließend Baseline sowie kombinierte und Live-only-Diagnostik erneut ausführen.

## Nächste To-dos

1. Docker Desktop starten und `docker info` erfolgreich prüfen.
2. `HIS-0021` als Node-Probe ausführen und Output-/Hash-Lock kontrollieren.
3. `HIS-0001` als PHP-Probe ausführen und sicherstellen, dass PHP nur innerhalb des Containers läuft.
4. Nach erfolgreichen Proben die übrigen 13 dynamischen Repositories starten.
5. Die fünf falsch klassifizierten `static_auto`-Fälle separat reklassifizieren.

## Empfohlener nächster Schritt

Docker Desktop starten und anschließend ausschließlich `HIS-0021` ausführen. Noch keinen Komplettlauf starten.
