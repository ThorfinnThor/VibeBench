# VibeBench Holdout-Akquisitionslog

Stand: 2026-08-10
Holdout: v0.1, 100 Slots (50 AI / 50 Human)
Status: Akquisition läuft; 11/100 Kandidaten vollständig geprüft, noch nicht eingefroren

## Zweck

Dieses Log trennt Quellenrecherche von der späteren Blind-Auswertung. Ein
Kandidat wird erst in das Holdout-Manifest übernommen, wenn Ziel-Deployment,
projektbezogene Provenienz, Erreichbarkeit und alle Leakage-Prüfungen eindeutig
bestätigt sind. Verworfene Kandidaten bleiben sichtbar, damit sie nicht später
versehentlich erneut aufgenommen werden.

## Bisher geprüfte AI-Kandidaten

### Akzeptiert

| Sample | Ziel | Builder | Provenienz | Ergebnis |
|---|---|---|---|---|
| `HO-AI-LOVABLE-01` | `https://starmate.love/` | Lovable | Offizielle Lovable-Story vom 2025-04-15 nennt das konkrete Projekt, zitiert den Maker und verlinkt das Deployment. | READY |
| `HO-AI-LOVABLE-02` | `https://safety-sentinel-guard.lovable.app/` | Lovable | Offizielle MySafe-Story vom 2025-01-17 beschreibt Team und Build-Prozess und verlinkt das konkrete Deployment. | READY |
| `HO-AI-LOVABLE-03` | `https://magican.lovable.app/` | Lovable | Offizielle Lovable-Story vom 2025-04-06 nennt MagiCan, dokumentiert den Prompt-basierten Build und verlinkt das Deployment. | READY |
| `HO-AI-LOVABLE-04` | `https://kaleidoscope-visionary.lovable.app/` | Lovable | Offizielles Maker-Interview vom 2025-01-20 beschreibt die Lovable-Erstellung des 3D-Projekts und verlinkt es direkt. | READY |
| `HO-AI-LOVABLE-05` | `https://cherishable.lovable.app/` | Lovable | Offizieller Lovable-Hackathonbericht vom 2024-12-24 nennt Projekt und Maker und verlinkt das Deployment. | READY |
| `HO-AI-BOLT-01` | `https://framemyhome.ai/` | Bolt | Offizielle Bolt-Kundenstory vom 2025-12-15 bezeichnet Frame My Home als live und Bolt als primäre Build-Umgebung; öffentliche Zielseite bestätigt. | READY |

Alle sechs Zielprojekte waren nicht im Development-Manifest enthalten. Ziel- und
Provenienz-URL sind getrennt; Domain-, Projekt- und Organisationsgruppen sind
untereinander unabhängig.

## Bisher geprüfte Human-Kontrollen

### Akzeptiert

| Sample | Ziel | Provenienz | Ergebnis |
|---|---|---|---|
| `HO-HUM-MODERN-APP-01` | `https://excalidraw.com/` | Offizielles Open-Source-Repository ordnet den enthaltenen App-Code ausdrücklich diesem Deployment zu; mehrjährige öffentliche Entwicklungshistorie. | READY |
| `HO-HUM-MODERN-APP-02` | `https://mermaid.live/` | Offizielles Mermaid-Live-Editor-Repository verlinkt dieses Deployment als Live-Version und dokumentiert die öffentliche Entwicklung. | READY |
| `HO-HUM-MODERN-APP-03` | `https://app.diagrams.net/` | Offizielles draw.io-Repository benennt dieses Deployment als Produktionsinstanz und enthält den Editor-Code. | READY |
| `HO-HUM-MODERN-APP-04` | `https://hoppscotch.io/` | Offizielles Open-Source-Monorepo ordnet dieses Web-Deployment dem gepflegten Hoppscotch-Projekt zu. | READY |
| `HO-HUM-MODERN-APP-05` | `https://design.penpot.app/` | Offizielles Penpot-Repository dokumentiert die gepflegte Open-Source-Designplattform und ihre öffentliche SaaS-Instanz. | READY |

Die Human-Labels stützen sich auf nachvollziehbare, langjährige öffentliche
Source-Historien und konkrete Deployment-Zuordnungen. Sie bedeuten nicht, dass
die heutigen Produkte keinerlei AI-Funktionen enthalten. Entscheidend ist der
auditierbare Ursprung als klassisch entwickeltes Softwareprojekt.

### Verworfen oder zurückgestellt

| Kandidat | Builder | Provenienz | Ergebnis | Begründung |
|---|---|---|---|---|
| `https://alpine.lovable.app` | Lovable | Offizielle Lovable-Kundenstory | REJECT | Deployment antwortete bei der Prüfung mit 404. |
| `https://elora-health.com` | Lovable | Offizielle Lovable-Kundenstory | REJECT | Bereits als `AIN-0020` im Development-Set enthalten (`www`/Apex-Domain gehören zum selben Projekt). |
| `https://plinq.com.br` | Lovable | Offizieller Lovable-Jahresrückblick | REJECT | Bereits als `AIN-0017` im Development-Set enthalten. |
| `https://replit.com/@victoriakim8/Personal-Habit-Tracker` | Replit Agent | Offizieller Replit-Agent-Blog | REJECT | Projektseite war nicht öffentlich zugänglich; keine unabhängige öffentliche Deployment-URL bestätigt. |
| `https://this-is-a.replit.app/apps` | Replit Agent | Offizieller Replit-Agent-Blog | RETRY | Öffentlicher Deployment-Kandidat, aber beim ersten Abruf Timeout; keine Aufnahme ohne erneute Erreichbarkeitsbestätigung. |
| `https://printpigeon.co.uk/` | Lovable | Offizielle Lovable-Story | REJECT | Bereits als `AIN-0018` im Development-Set enthalten. |
| `https://the-backchannel.lovable.app/` | Lovable | Offizielle Lovable-Story | REJECT | Bereits als `AIN-0021` im Development-Set enthalten. |
| `https://tribbai.com/` | Lovable | Offizielle Lovable-Story | REJECT | Domain leitet inzwischen auf eine sachfremde Casino-Seite weiter; Deployment-Identität verloren. |
| `https://aneta.so/` | Lovable | Offizielle Lovable-Story | RETRY | Ursprünglicher Projektbeleg ist stark, aber das heutige Deployment war nicht als funktionierende Ziel-App verifizierbar. |
| `https://dummyforms.lovable.app/` | Lovable | Offizieller Hackathonbericht | RETRY | Abruf lieferte einen internen Fehler; kein READY ohne erneute Bestätigung. |
| `https://voxel-christmas-cabin.lovable.app/` | Lovable | Offizieller Hackathonbericht | RETRY | Deployment war beim unabhängigen Abruf nicht zuverlässig erreichbar. |
| `https://sunny-sky-dashboard.lovable.app/dashboard` | Lovable | Offizieller Hackathonbericht | RETRY | Deployment war beim unabhängigen Abruf nicht zuverlässig erreichbar. |
| `https://notebkone.com/` | Lovable | Offizieller Hackathonbericht | REJECT | Deployment antwortete mit 404. |

## Quellen

- Lovable: `https://lovable.dev/blog/2025-01-23-how-a-venture-capitalist-rebuilt-his-website-and-internal-data-platform-with-lovable`
- Lovable: `https://lovable.dev/blog/2025-01-30-from-idea-to-full-blown-product-in-a-month`
- Lovable: `https://lovable.dev/blog/one-year-of-lovable`
- Replit: `https://replit.com/blog/introducing-replit-agent`
- Replit: `https://replit.com/blog/try-agent`
- Lovable: `https://lovable.dev/blog/2025-01-17-mysafe-x-lovable-hackathon-canada-winner`
- Lovable: `https://lovable.dev/blog/zohar-vanunu-magican-ai-maker`
- Lovable: `https://lovable.dev/blog/2025-01-20-how-a-developer-advocate-built-stunning-3d-projects-with-lovable-dev-and-won-big`
- Lovable: `https://lovable.dev/blog/2025-01-15-lovable-christmas-hackhaton-top-10-projects`
- GitHub: `https://github.com/excalidraw/excalidraw`
- GitHub: `https://github.com/mermaid-js/mermaid-live-editor`
- GitHub: `https://github.com/jgraph/drawio`
- GitHub: `https://github.com/hoppscotch/hoppscotch`
- GitHub: `https://github.com/penpot/penpot`

## Akquisitionsregeln

- Ziel-URL und Provenienz-URL müssen voneinander verschieden sein.
- Ein Verzeichnis- oder Projektlink reicht nur dann, wenn das konkrete öffentliche
  Deployment eindeutig zugeordnet werden kann.
- `www`-, Apex-, Redirect- und Subdomain-Varianten desselben Projekts zählen als
  ein Domain-/Projektverbund.
- Bereits im 52-URL-Development-Set vorhandene Projekte werden unabhängig vom
  aktuellen Hostnamen ausgeschlossen.
- Ein technischer Fehler führt zu `RETRY` oder `REJECT`, niemals zu `READY`.
- Vor dem Freeze werden keine Scanner-Verdicts angesehen.

## Nächste To-dos

1. Das Lovable-Stratum von 5 auf 10 READY auffüllen, mit maximal zwei Projekten
   pro Sammelquelle und ohne Wiederverwendung eines Makers oder Projekts.
2. Die fünf Human-Modern-App-Kontrollen typologisch gegen die fünf Lovable-
   Beispiele prüfen und bei Bedarf durch enger gematchte Kontrollen ersetzen.
3. Als nächstes fünf Bolt-Kandidaten plus fünf Human-SaaS-Gegenstücke beschaffen.
4. RETRY-Kandidaten erst nach einem zweiten, zeitlich getrennten Abruf neu bewerten.
5. Den Holdout erst bei 100/100 READY und festgeschriebenem Scanner-Commit einfrieren.

## Empfohlener nächster Schritt

Ein zweites unabhängiges 5+5-Paket für Bolt und Human-SaaS aufbauen. Dadurch
wird der Akquisitionsprozess über einen zweiten Builder validiert, ohne
Holdout-Ergebnisse zu öffnen oder Scannerregeln zu verändern.
