# VibeBench Development extension acquisition protocol · v0.2

Stand: 2026-08-10

Status: 40 Slots vorbereitet; 30/40 READY

## Zweck

Diese Erweiterung behebt bekannte Repräsentationslücken des bisherigen
Development-Sets. Sie ist ausdrücklich für Regelentwicklung und Fehlersuche
bestimmt und später **keine unabhängige Validierung**.

## Zielverteilung

| Gruppe | Ziel |
|---|---:|
| Neue Replit-Agent-Websites | 10 |
| Neue Bolt-Websites | 10 |
| Neue Human Modern SaaS | 10 |
| Neue Human Modern Apps | 10 |

Alle 40 Ziele müssen neu sein. Weder bestehende Development-Ziele noch eine
URL oder ein Host aus dem abgeschlossenen 100-Site-Holdout dürfen übernommen
werden.

Bei geteilten Deployment-Plattformen gilt der Plattform-Host als gemeinsame
Einheit: unterschiedliche Subdomains auf `replit.app`, `repl.co`, `bolt.host`,
`lovable.app`, `vercel.app`, `netlify.app` oder `pages.dev` gelten nicht als
unabhängige Ziele. Der Validator blockiert diese Plattform-Leakage.

Die 20 READY Human-Kontrollen erfüllen den beabsichtigten Schwierigkeitsgrad:
16/20 zeigen mindestens zwei vom Scanner erkannte moderne Stack-Signale; 7/20
liefert die alte v0.1-Baseline als `indicative`. Damit sind es gezielte
False-Positive-Gegenbeispiele und keine leicht trennbaren statischen Seiten.

## Reihenfolge

1. Zuerst zehn Human Modern SaaS und zehn Human Modern Apps.
2. Danach zehn Replit-Agent- und zehn Bolt-Ziele.
3. Erst bei vollständiger moderner negativer Vergleichsgruppe neue Marker oder
   Schwellen untersuchen.

Diese Reihenfolge verhindert, dass erneut eine AI-lastige Signalregel entsteht,
bevor passende moderne Gegenbeispiele vorhanden sind.

## Aufnahmebedingungen

### AI-positiv

- exakte öffentliche HTTPS-Deployment-URL,
- unabhängige projektbezogene Provenienz für Bolt oder Replit Agent,
- Provenienz verweist auf dieses Projekt oder Deployment,
- Ziel weder im bestehenden Development-Capture noch im Holdout,
- erfolgreiche öffentliche Erreichbarkeit,
- keine reine Hosting-Proxy-Zuordnung.

### Human

- moderne produktive Website oder interaktive App,
- bewusste Abdeckung von Next.js, React, Tailwind, Radix, Lucide, Supabase oder
  vergleichbaren modernen Stacks,
- offizielles öffentliches Source-Repository, das vor dem 30. November 2022
  begonnen wurde und das Zielprojekt beziehungsweise dessen Domain verknüpft,
- Ziel weder im bestehenden Development-Capture noch im Holdout,
- kein leichtes rein statisches Gegenbeispiel.

`HUMAN` ist hier eine operative Development-Kontrolle: öffentlich dokumentierte
Projektentwicklung vor der breiten Verfügbarkeit generativer Web-Builder. Das
ist belastbarer als eine reine Sichtprüfung, beweist aber nicht, dass später
kein einzelner Beitrag AI-Unterstützung verwendet hat. Diese Einschränkung wird
pro Sample in `label_limitation` gespeichert.

## Pflichtfelder

- `target_url`
- `provenance_url`
- `provenance_type`
- `provenance_summary`
- `collected_at`
- `development_overlap_check`
- `holdout_overlap_check`
- `provenance_review`
- `status`
- `notes`

Human-Kontrollen benötigen zusätzlich `project_started_at`, `label_definition`,
`label_limitation` und einen gespeicherten `baseline_scan`.
AI-Kontrollen benötigen zusätzlich `provenance_locator`, `label_definition`,
`label_limitation` und einen gespeicherten `baseline_scan`.

`READY` ist nur zulässig, wenn alle drei Review-Felder `PASS` sind. Ziel und
Provenienz müssen auf unterschiedlichen Hosts liegen.

Der Slot-Status ist entweder `PENDING` oder `READY`. Verworfene Kandidaten
werden nicht in einen der 40 Zielsamples geschrieben; sie bleiben in den
Recherche-Notizen, damit ein abgelehnter Kandidat keinen finalen Slot belegt.

## Arbeitsdateien

- Quellen werden in `data/development-samples-v0_2.mjs` ergänzt.
- Der AI-Recherche- und Ablehnungslog steht in
  `outputs/development_v0_2/VIBEBENCH_AI_ACQUISITION_LOG_2026-08-10.md`.
- `npm run development:v0.2-build` erzeugt das stabile 40-Slot-JSON.
- `npm run development:v0.2-validate` prüft Struktur, Pflichtfelder,
  Development- und Holdout-Overlap sowie Provenienztrennung.

## Nächste To-dos

1. Zehn neue Replit-Agent-Kandidaten mit exakter Deployment-Provenienz sammeln.
2. Provenienz und Overlap prüfen; erst danach auf READY setzen.
3. Die 30 vorbereiteten Ziele auf fortbestehende Erreichbarkeit prüfen.
4. Vor dem ersten v0.2-Regeltest 40/40 READY erreichen.

## Empfohlener nächster Schritt

Als Nächstes die Replit-Agent-Provenienzgruppe füllen. Sie ist mit bisher nur
zwei Development-Fällen die größte positive Abdeckungslücke.
