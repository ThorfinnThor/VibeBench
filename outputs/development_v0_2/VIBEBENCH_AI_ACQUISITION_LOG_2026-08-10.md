# VibeBench AI Development acquisition log · 2026-08-10

Status: Bolt 10/10 READY · Replit Agent 10/10 READY · Development v0.2 FROZEN

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
| `app.tabsquad.com` | [Devpost](https://devpost.com/software/the-team-project) | indeterminate | React, Tailwind CSS, Supabase |
| `colorpalgen.com` | [Reviewed directory record](https://hot100.ai/project/687) | indeterminate | Vite, Tailwind CSS, Framer Motion |
| `no-fila.com` | [Devpost](https://devpost.com/software/no-fila) | indeterminate | React, Vite, Tailwind CSS |
| `ketz.site` | [Devpost](https://devpost.com/software/ketz-monetize-knowledge-get-trusted-ai-answers) | direct | React, Vite, Tailwind CSS, Lucide, Supabase |
| `justimagine.online` | [Devpost](https://devpost.com/software/just-imagine) | indeterminate | React, Vite, Tailwind CSS, Supabase |
| `ellisai.org` | [Devpost](https://devpost.com/software/ellis-ellisai-org) | indeterminate | React, Vite, Tailwind CSS, Lucide, Supabase |

Neun Devpost-Submissions und ein geprüftes Directory-Record nennen Bolt als
Entwicklungswerkzeug und verknüpfen das exakte öffentliche Ziel. Das Label dokumentiert
Builder-Nutzung, nicht den prozentualen Anteil generierten Codes oder Designs.
Alle zehn Ziele sind neue Custom Domains und bestehen den Development-,
Holdout- und Shared-Platform-Overlap-Check.

## Nicht aufgenommene Bolt-Kandidaten

Zwei zunächst aufgenommene Kandidaten wurden vor dem finalen Freeze wieder
entfernt, weil sie nur noch Sedo-Parking-Inhalte lieferten:

- `focus-garden.xyz`
- `pawformancemode.com`

Der Freeze-Audit blockiert solche Fälle jetzt über einen separaten Content-Gate.

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

## Aufgenommene Replit-Agent-Samples

| Ziel | Provenienz | v0.1-Baseline | Stack-Signale |
|---|---|---|---|
| `genaipi.org` | [Replit Customer Story](https://replit.com/customers/genaipi) | indeterminate | React, Vite, Tailwind CSS, Radix UI, Lucide |
| `saastr.ai` | [Replit Customer Story](https://replit.com/customers/saastr) | indeterminate | Vite, Tailwind CSS, Radix UI, Lucide |
| `clearscribehq.com` | [Creator launch](https://www.linkedin.com/posts/nagib-araman-53a51529_replit-buildathon-buildinpublic-activity-7431084271680995328-p9LG) | indeterminate | React, Vite, Tailwind CSS, Radix UI, Lucide |
| `realvsai.com` | [Creator build report](https://www.reddit.com/r/replit/comments/1kd6wjv/my_second_app_using_replit_my_experience_with_the/) | indeterminate | — |
| `podcast.thekamclub.com` | [Creator implementation report](https://replit.discourse.group/t/how-to-create-an-automated-podcast-website-with-replit/6034) | indeterminate | React, Vite, Tailwind CSS, Radix UI, Lucide |
| `findmysauna.com` | [Curated Agent v2 showcase](https://www.linkedin.com/posts/mannybernabe_replit-agent-v2-dropped-a-couple-weeks-ago-activity-7312859754689662978-Tkbv) | indeterminate | Tailwind CSS |
| `aivideodubbing.net` | [Reviewed directory record](https://hot100.ai/project/2347) | indeterminate | Next.js, React, Tailwind CSS, Lucide |
| `mygutgoddess.com` | [Reviewed directory record](https://hot100.ai/project/272) | indeterminate | React, Vite, Tailwind CSS, Radix UI, Lucide |
| `ankonai.com` | [Reviewed directory record](https://hot100.ai/project/2393) | indeterminate | Next.js, React, Tailwind CSS |
| `designmakerai.co` | [Reviewed directory record](https://hot100.ai/project/2358) | indicative | Next.js, React, Tailwind CSS, Lucide |

Alle zehn Ziele sind erreichbare Custom Domains. Die Quellen dokumentieren
Replit-Agent-Nutzung und die exakte Zielzuordnung; sie behaupten nicht, dass
jede sichtbare Zeile oder jedes Design ausschließlich vom Agent erzeugt wurde.
Diese Einschränkung ist pro Sample gespeichert. 8/10 zeigen mindestens zwei
erkannte moderne Stack-Signale, aber 0/10 direkte Replit-Evidenz unter v0.1.

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

Die Replit-Gruppe ist noch anspruchsvoller: neun Fälle sind `indeterminate`,
ein Fall ist nur wegen generischer Struktur `indicative`, und kein Fall liefert
direkte Replit-Agent-Evidenz. Das ist ein Development-Befund über den Recall,
keine neue Evaluationskennzahl.

## Nächste To-dos

1. Die eingefrorenen 40 Development-Ziele ausschließlich für v0.2-Research nutzen.
2. Portable Feature-Kandidaten gegen alle 20 modernen Human-Kontrollen prüfen.
3. Eine Kandidatenregel mit festen Schwellen vorregistrieren.
4. Für eine fertige v0.2-Regel einen neuen unabhängigen Holdout erstellen.

## Empfohlener nächster Schritt

Die direkte Markerforschung ist abgeschlossen; sie fand außer dem bestehenden
`bolt.new`-Marker keine neue belastbare Direct-Regel. Als Nächstes portable
Development-only-Features untersuchen. Der 100er-Holdout bleibt ausgeschlossen.
