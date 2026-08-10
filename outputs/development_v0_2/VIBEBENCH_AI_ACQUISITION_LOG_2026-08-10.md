# VibeBench AI Development acquisition log · 2026-08-10

Status: Bolt 10/10 READY · Replit Agent 0/10 READY

## Zweck

Dieser Log dokumentiert die positive Akquisition nach dem geöffneten
v0.1-Holdout. Er verhindert, dass bereits gesehene Testziele, verwandte
Deployments oder bloße Hosting-Proxys unbemerkt in Development v0.2 gelangen.

## Aufgenommene Bolt-Samples

| Ziel | Provenienz | v0.1-Baseline | Stack-Signale |
|---|---|---|---|
| `toomuchforce.com` | [Devpost](https://devpost.com/software/too-much-force) | indeterminate | React, Vite, Tailwind CSS, Supabase |
| `bolt-shop.com` | [Devpost](https://devpost.com/software/bolty-bolt-new-boilerplate-mobile-firebase-stack) | indeterminate | React, Vite, Tailwind CSS, Supabase |
| `zropi.com` | [Devpost](https://devpost.com/software/zropi) | indeterminate | React, Vite, Tailwind CSS, Framer Motion, Lucide |
| `onceupon.fun` | [Devpost](https://devpost.com/software/once-upon-ai) | indeterminate | — |
| `focus-garden.xyz` | [Devpost](https://devpost.com/software/focus-fuel) | indeterminate | — |
| `pawformancemode.com` | [Devpost](https://devpost.com/software/pawformance-mode-ai) | indeterminate | — |
| `no-fila.com` | [Devpost](https://devpost.com/software/no-fila) | indeterminate | React, Vite, Tailwind CSS |
| `ketz.site` | [Devpost](https://devpost.com/software/ketz-monetize-knowledge-get-trusted-ai-answers) | direct | React, Vite, Tailwind CSS, Lucide, Supabase |
| `justimagine.online` | [Devpost](https://devpost.com/software/just-imagine) | indeterminate | React, Vite, Tailwind CSS, Supabase |
| `ellisai.org` | [Devpost](https://devpost.com/software/ellis-ellisai-org) | indeterminate | React, Vite, Tailwind CSS, Lucide, Supabase |

Jede Submission nennt Bolt.new als Entwicklungswerkzeug, verknüpft das exakte
öffentliche Ziel und gehört zum Bolt-Hackathon-Kontext. Das Label dokumentiert
Builder-Nutzung, nicht den prozentualen Anteil generierten Codes oder Designs.
Alle zehn Ziele sind neue Custom Domains und bestehen den Development-,
Holdout- und Shared-Platform-Overlap-Check.

## Nicht aufgenommene Bolt-Kandidaten

Fünf weitere Custom-Domain-Kandidaten antworteten beim kontrollierten
Baseline-Lauf nicht technisch erfolgreich. Ein einzelner sequenzieller Retry
blieb bei allen fünf ebenfalls erfolglos; sie wurden deshalb nicht aufgenommen:

- `policypilotpro.com`
- `bolthonapp.brandvirality.com`
- `bolthackathonbadge.bolt.army`
- `dun-it.app`
- `kit.nimsitha.com`

Netlify-, Vercel- oder andere Shared-Platform-Subdomains wurden unabhängig von
ihrer Erreichbarkeit ausgeschlossen, weil der abgeschlossene Holdout bereits
andere Tenants derselben Plattform enthält.

## Replit-Recherche und Leakage-Abweisung

Die [offizielle Replit Customer Showcase](https://replit.com/usecases/customers)
und ein [offizieller Replit Build-Artikel](https://replit.com/blog/bookmark-manager-browser-extension)
lieferten mehrere exakte Agent-Beispiele. Keines wurde übernommen:

| Kandidat | Ablehnungsgrund |
|---|---|
| `podnudge.com` | exakter Holdout-Overlap |
| `lowcarbpdf.com` | exakter Holdout-Overlap |
| `wordleap.co.uk` | exakter Holdout-Overlap |
| `wiblet.com` | exakter Holdout-Overlap |
| `lowcarbtiff.com` | Schwesterprojekt eines geöffneten Holdout-Ziels; Owner-/Family-Leakage |
| `livebuild.replit.app` | Shared-Platform-Overlap mit einem Holdout-`replit.app`-Tenant |
| `nowows.com` | beim Research-Lauf nicht DNS-auflösbar |

Der Validator wurde als Folge zusätzlich gehärtet: `replit.app`, `repl.co`,
`bolt.host`, `lovable.app`, `vercel.app`, `netlify.app` und `pages.dev` werden
bei Leakage-Prüfungen jeweils als gemeinsame Plattform-Hosts behandelt.

## Interpretation

Neun der zehn neuen Bolt-Sites sind keine Erfolge des aktuellen Detektors,
sondern gezielte False-Negative-Development-Fälle: sie enden unter v0.1 als
`indeterminate`, obwohl die unabhängige Submission Bolt-Nutzung dokumentiert.
`ketz.site` liefert dagegen einen direkten `bolt.new`-Marker aus einem
Same-Origin-Asset. Alle zehn dürfen für v0.2-Research verwendet werden, aber
nicht als unabhängige Bestätigung einer späteren Regel.

## Nächste To-dos

1. Zehn neue Replit-Agent-Custom-Domain-Ziele außerhalb des Holdouts finden.
2. Für Replit nur offizielle Builder-Quellen oder unabhängige projektbezogene
   Submissions mit exakter Deployment-Zuordnung zulassen.
3. Die 30 READY-Ziele vor dem Development-Freeze erneut technisch prüfen.
4. Erst bei 40/40 READY mit v0.2-Markerforschung beginnen.

## Empfohlener nächster Schritt

Die Replit-Agent-Akquisition über neue Customer Stories und unabhängige
Hackathon-/Launch-Submissions fortsetzen. Das ist der verbleibende größte
Provenienzblock; der geöffnete Holdout bleibt vollständig ausgeschlossen.
