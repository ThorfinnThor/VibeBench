# VibeBench v0.9 – Retry der 11 Live-Ausfälle

Stand: 2026-08-09, Europe/Berlin

## Ergebnis

Alle elf beim ersten Lauf fehlgeschlagenen Deployment-URLs wurden erneut geprüft. Keine Seite war unter ihrer provenance-belegten URL wieder erfolgreich scanbar. Der Trainingsdatensatz wurde daher nicht verändert.

| Retry-Ergebnis | Anzahl |
|---|---:|
| DNS nicht auflösbar | 3 |
| TLS-Zertifikatsprüfung fehlgeschlagen | 1 |
| HTTP 404 | 4 |
| HTTP 429 | 2 |
| Cloudflare HTTP 521/522 | 1 |
| Wieder vollständig scanbar | 0 |

Die Abdeckung bleibt bei 52/63 Live-Seiten: 36/46 AI und 16/17 Human. Die niedrigere AI-Erreichbarkeit bleibt ein mögliches Selektionsbias und muss gemeinsam mit den Modellkennzahlen berichtet werden.

## Prüfmethodik

- HTTP-HEAD mit Redirect-Following und 20 Sekunden Timeout.
- Derselbe transparente Research-User-Agent wie im Forensics-Extractor.
- Strikte TLS-Prüfung; kein `-k` und keine Zertifikatsausnahme.
- Plausible Apex-/`www`- und HTTP→HTTPS-Varianten nur bei DNS-, TLS- oder Origin-Problemen.
- Keine erfundenen Deployment-Varianten: eine URL wird nur ersetzt, wenn die vorhandene Provenienzquelle die neue URL belegt.
- Kein Umgehen der beiden Netlify-429-Antworten durch verschleierten User-Agent oder hohe Retry-Frequenz.

## Befunde

| Sample | Klasse | Builder | Retry | Provenienzstatus |
|---|---|---|---|---|
| `AIN-0009` | AI | Bolt | DNS | kein belegtes Ersatz-Deployment |
| `HUM-0011` | Human | – | 521 Apex / 522 `www` | Cloudflare-Origin weiterhin nicht erreichbar |
| `AIN-0023` | AI | Bolt | TLS | Made-with-Bolt-Verzeichnis nennt weiterhin dieselbe URL |
| `AIN-0024` | AI | Bolt | DNS | Made-with-Bolt-Verzeichnis nennt weiterhin dieselbe URL |
| `AIN-0031` | AI | Bolt | 429 | Made-with-Bolt-Verzeichnis nennt weiterhin dieselbe Netlify-URL |
| `AIN-0032` | AI | Bolt | DNS | Made-with-Bolt-Verzeichnis nennt weiterhin dieselbe URL |
| `AIN-0034` | AI | Bolt | 429 | Made-with-Bolt-Verzeichnis nennt weiterhin dieselbe Netlify-URL |
| `AIN-0036` | AI | Replit Agent | 404 | Replit-Post nennt weiterhin dieselbe Demo-URL |
| `AIN-0037` | AI | Replit Agent | 404 | Replit-Post nennt weiterhin dieselbe Demo-URL |
| `AIN-0038` | AI | Replit Agent | 404 | Maker-Write-up nennt weiterhin dieselbe Demo-URL |
| `AIN-0041` | AI | Replit Agent | 404 | Maker-Profil nennt weiterhin dieselbe App-URL |

Die Replit-Quellen sind weiterhin brauchbare Provenienzbelege für den damaligen Build, aber die Deployments selbst sind aktuell nicht verfügbar. Das reicht nicht für eine technische Feature-Zeile, weil VibeBench nur `scan_ok=1` trainiert.

## Entscheidung

1. Alle elf Zeilen bleiben in Queue und Live-Feature-Ausgabe erhalten.
2. Sie bleiben durch `scan_ok=0` vom Training ausgeschlossen.
3. Die beiden 429-Ziele dürfen in einem späteren, niedrigfrequenten Lauf erneut geprüft werden.
4. DNS-, TLS-, 404- und Origin-Fehler benötigen eine Reparatur durch den Betreiber oder eine provenance-belegte neue Deployment-URL.
5. Die aktuellen Modell- und Merge-Dateien bleiben unverändert, weil keine neue erfolgreiche Feature-Zeile entstanden ist.

## Nächste To-dos

1. Isolierten Container-Runner für Node, Jekyll, Hugo, Hexo und PHP erstellen.
2. Die fünf falsch als `static_auto` klassifizierten Historical-Rezepte korrigieren.
3. Danach alle neu gewonnenen Snapshot-Zeilen mergen und die 50 Gruppensplits erneut ausführen.
4. Parallel neue, dauerhaft scanbare AI-positive Deployments sammeln, damit tote URLs nicht nur durch Retries kompensiert werden.

## Empfohlener nächster Schritt

Der Container-Runner ist vorbereitet. Als Nächstes Docker Desktop starten und ausschließlich die Node-Probe `HIS-0021` ausführen. Erst nach Prüfung von Isolation, Hash-Lock und Scan-Ergebnis folgt die PHP-Probe `HIS-0001`.
