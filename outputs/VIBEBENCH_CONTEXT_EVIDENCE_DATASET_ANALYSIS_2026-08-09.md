# VibeBench context evidence dataset analysis

Stand: 2026-08-09  
Quelle: `outputs/vibebench_live_features_v0_9.csv` und vollständiger Produktions-Capture  
Status: Entwicklungsanalyse, kein Blind-Holdout

## Fragestellung

Wie häufig treten Infrastruktur-Header und Web-App-Manifeste in den bisher
erreichbaren AI- und Human-Samples auf, und eignen sie sich für eine direkte
Builder-Zuordnung?

## Historischer Extraktor-Datensatz

Von den 52 im v0.9-Lauf erfolgreich erfassten Seiten waren 36 als AI und 16 als
Human gelabelt.

| Gruppe | n | bekannte Infra-Header | verlinktes Manifest | Manifest-Status 200 |
|---|---:|---:|---:|---:|
| AI | 36 | 33 | 6 | 14 |
| Human | 16 | 5 | 5 | 8 |
| Gesamt | 52 | 38 | 11 | 22 |

`Manifest-Status 200` schließt Fallback-Prüfungen des Python-Extractors ein und
ist deshalb nicht direkt mit dem strengeren Web-Scanner vergleichbar. Für die
Web-App ist `verlinktes Manifest` die relevante konservative Definition.

### Header nach Builder

| Builder | n | irgendein Header | Vercel | Netlify | Cloudflare | verlinktes Manifest |
|---|---:|---:|---:|---:|---:|---:|
| Bolt | 13 | 13 | 0 | 11 | 2 | 4 |
| Lovable | 13 | 12 | 0 | 1 | 11 | 2 |
| v0 | 6 | 6 | 6 | 0 | 0 | 0 |
| Replit Agent | 2 | 0 | 0 | 0 | 0 | 0 |
| Claude Code | 2 | 2 | 1 | 0 | 1 | 0 |

Die Verteilung erklärt Hosting-Infrastruktur, nicht die Erstellungsmethode.
Vercel kann mit v0 zusammen auftreten, Netlify mit Bolt und Cloudflare mit
Lovable; dieselben Plattformen hosten jedoch auch Human-Seiten.

## Aktueller Produktions-Capture

Der strengere Web-Scanner prüft nur ein tatsächlich im HTML verlinktes,
Same-Origin erreichbares und gültiges JSON-Manifest. Bei 52 erneut gescannten
URLs ergab sich:

| Gruppe | n | erfolgreiche Scans | Header | gültiges Manifest |
|---|---:|---:|---:|---:|
| AI | 36 | 35 | 32 | 3 |
| Human | 16 | 16 | 5 | 5 |
| Gesamt | 52 | 51 | 37 | 8 |

Ein AI-Sample (`AIN-0004`, `kraflio.com`) antwortete aktuell mit HTTP 403.

## Schlussfolgerung

1. Header sind als Stack-/Hosting-Erklärung nützlich, aber nicht als direkte
   Vibe-Coding-Evidenz.
2. Web-App-Manifeste sind ein generisches PWA-Merkmal. In der aktuellen
   Stichprobe treten gültige Manifeste häufiger bei Human- als bei AI-Seiten auf.
3. Weder Header noch Manifeste dürfen allein `direct` oder `indicative` auslösen.
4. Direkte Evidenz bleibt auf konkrete Builder-Artefakte in öffentlichem HTML
   oder begrenzt gelesenen Same-Origin-Assets beschränkt.

## False-Positive-Härtung

Im veröffentlichten 52-URL-Lauf war `HUM-0014` der einzige Human-Fall mit dem
Verdict `indicative`. Die Seite hatte zwei generische Strukturhinweise, aber
keinen erkannten Stack. Die neue Regel verlangt deshalb gleichzeitig:

- mindestens zwei Strukturhinweise und
- mindestens zwei Stack-Signale.

Alle fünf bisherigen AI-indicative-Fälle erfüllen diese zusätzliche Bedingung;
`HUM-0014` nicht. Ein Regressionstest schützt diese Trennung.

## Nächste To-dos

1. Härtung deployen und den vollständigen Capture erneut ausführen.
2. Direkte Treffer nach Marker und Fundort (`page`/`asset`) auswerten.
3. Fehlende Lovable-, Bolt-, Replit- und v0-Treffer auf weitere stabile,
   öffentlich sichtbare Builder-Artefakte prüfen.
4. Einen unangetasteten Blind-Holdout für belastbare Gütemaße anlegen.

## Empfohlener nächster Schritt

Nach dem Deployment zuerst `HUM-0014`, `AIN-0013`, `AIN-0026`, `AIN-0030`,
`AIN-0047` und `AIA-0023` erneut scannen. So wird die gezielte Härtung geprüft,
bevor ein weiterer Marker ergänzt wird.
