# VibeBench Holdout-Akquisitionslog

Stand: 2026-08-09  
Holdout: v0.1, 100 Slots (50 AI / 50 Human)  
Status: Akquisition begonnen; 2/100 Kandidaten vollständig geprüft, noch nicht eingefroren

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
| `HO-AI-BOLT-01` | `https://framemyhome.ai/` | Bolt | Offizielle Bolt-Kundenstory vom 2025-12-15 bezeichnet Frame My Home als live und Bolt als primäre Build-Umgebung; öffentliche Zielseite bestätigt. | READY |

Beide Zielprojekte waren nicht im Development-Manifest enthalten. Ziel- und
Provenienz-URL sind getrennt; Domain-, Projekt- und Organisationsgruppen sind
untereinander unabhängig.

### Verworfen oder zurückgestellt

| Kandidat | Builder | Provenienz | Ergebnis | Begründung |
|---|---|---|---|---|
| `https://alpine.lovable.app` | Lovable | Offizielle Lovable-Kundenstory | REJECT | Deployment antwortete bei der Prüfung mit 404. |
| `https://elora-health.com` | Lovable | Offizielle Lovable-Kundenstory | REJECT | Bereits als `AIN-0020` im Development-Set enthalten (`www`/Apex-Domain gehören zum selben Projekt). |
| `https://plinq.com.br` | Lovable | Offizieller Lovable-Jahresrückblick | REJECT | Bereits als `AIN-0017` im Development-Set enthalten. |
| `https://replit.com/@victoriakim8/Personal-Habit-Tracker` | Replit Agent | Offizieller Replit-Agent-Blog | REJECT | Projektseite war nicht öffentlich zugänglich; keine unabhängige öffentliche Deployment-URL bestätigt. |
| `https://this-is-a.replit.app/apps` | Replit Agent | Offizieller Replit-Agent-Blog | RETRY | Öffentlicher Deployment-Kandidat, aber beim ersten Abruf Timeout; keine Aufnahme ohne erneute Erreichbarkeitsbestätigung. |

## Quellen

- Lovable: `https://lovable.dev/blog/2025-01-23-how-a-venture-capitalist-rebuilt-his-website-and-internal-data-platform-with-lovable`
- Lovable: `https://lovable.dev/blog/2025-01-30-from-idea-to-full-blown-product-in-a-month`
- Lovable: `https://lovable.dev/blog/one-year-of-lovable`
- Replit: `https://replit.com/blog/introducing-replit-agent`
- Replit: `https://replit.com/blog/try-agent`

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

1. Zehn unabhängige Lovable-Zielprojekte aus offiziellen Stories oder eindeutig
   zugeordneten öffentlichen Maker-Quellen beschaffen.
2. Parallel zehn gematchte Human-SaaS-Kontrollen mit dokumentierter Human-
   Provenienz sammeln.
3. Für jeden Kandidaten Development-, Domain-, Projekt- und Organisations-
   Overlap prüfen.
4. Erst vollständig belegte Kandidaten in Workbook und CSV übernehmen.

## Empfohlener nächster Schritt

Das erste geprüfte Paket auf fünf Lovable-Deployments und fünf Human-SaaS-
Kontrollen ausbauen. Dieses kleine Paarpaket validiert den Akquisitionsprozess,
ohne Holdout-Ergebnisse zu öffnen oder Scannerregeln zu verändern.
