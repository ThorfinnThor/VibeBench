# VibeBench Development v0.2 artifact research

Stand: 2026-08-10

Status: **40/40 untersucht · kein neuer Direct-Marker freigegeben**

## Fragestellung

Der eingefrorene Development-v0.2-Satz wurde nach Builder-Phrasen,
Runtime-Spuren, ausgewählten Response-Headern und externen Hosts untersucht.
Pro Ziel wurden das HTML sowie höchstens vier Same-Origin-JavaScript- und zwei
Same-Origin-CSS-Dateien begrenzt geladen. Der abgeschlossene Holdout wurde
weder gelesen noch zur Auswahl eines Signals verwendet.

## Ergebnis

| Kandidat | Replit (n=10) | Bolt (n=10) | Human modern (n=20) | Entscheidung |
|---|---:|---:|---:|---|
| Replit-Agent-/Generated-by-Replit-Phrase | 0 | 0 | 0 | kein Signal |
| eingebetteter `replit.app`-Host | 1 | 0 | 0 | Kontext, nicht Attribution |
| `bolt.new` | 0 | 1 | 0 | bestehender Direct-Marker bleibt |
| Built-/Made-with-Bolt-Phrase | 0 | 0 | 0 | kein zusätzliches Signal |
| Google Frontend + `via: ... google` | 6 | 0 | 0 | generischer Hosting-Kontext |
| Express-Response | 3 | 0 | 0 | generischer Runtime-Kontext |
| Netlify-Response | 0 | 6 | 2 | nicht Builder-spezifisch |
| Vercel-Response | 1 | 1 | 9 | nicht Builder-spezifisch |
| Cloudflare-Edge | 2 | 3 | 11 | nicht Builder-spezifisch |

Die belastbare Aussage ist damit enger als erhofft: Öffentliche Custom-Domain-
Deployments entfernen Builder-Spuren häufig vollständig. Auf diesem Set würde
eine Ausweitung von Google-, Express-, Netlify-, Vercel- oder Cloudflare-
Headern zu direkter AI-Evidenz Hosting mit Autorenschaft verwechseln.

## Umgesetzte Produktfolge · v0.1.2

- Eine Kombination aus `Server: Google Frontend` und einem Google-`via`-Header
  wird als `Google Frontend response` angezeigt.
- Eine im HTML oder in einem geprüften Same-Origin-Asset verlinkte
  `*.replit.app`-Ressource wird als `Replit-hosted resource` angezeigt.
- Beide Signale bleiben ausdrücklich `context`; sie ändern weder Verdict noch
  Builder-Zuordnung.
- Der bestehende `bolt.new`-Marker bleibt `direct`, weil er im Development-Set
  selektiv ist und eine konkrete Builder-Referenz enthält.

## Methodische Korrektur während des Research

`focus-garden.xyz` und `pawformancemode.com` antworteten technisch erfolgreich,
lieferten aber nur Sedo-Parking-Seiten. Sie wurden vor dem finalen Freeze durch
`app.tabsquad.com` und `colorpalgen.com` ersetzt. Der Freeze-Audit prüft jetzt
zusätzlich den Server-Header und begrenzten Seiteninhalt; Parking-Seiten und
Content-Fetch-Fehler blockieren den Freeze.

## Reproduzierbarkeit

```bash
npm run development:v0.2-audit
npm run development:v0.2-freeze
npm run research:v0.2-artifacts
```

Die vollständigen maschinenlesbaren Resultate stehen in
`outputs/development_v0_2/vibebench_development_v0_2_artifact_research.json`.

## Nächste To-dos

1. Portable, builderübergreifende Feature-Kandidaten ausschließlich auf
   Development v0.2 definieren.
2. Kandidaten gegen alle 20 modernen Human-Kontrollen auswerten und schwache
   Hosting-Proxys ausschließen.
3. Eine feste v0.2-Kandidatenregel mit Schwellen und Abbruchkriterien
   vorregistrieren.
4. Erst danach einen neuen, ungeöffneten Bestätigungs-Holdout akquirieren.

## Empfohlener nächster Schritt

Nicht weitere einzelne Hosting-Strings zur Attribution hochstufen. Stattdessen
eine kleine, erklärbare Development-only-Feature-Matrix erstellen und prüfen,
ob eine Kombination portabler Merkmale die Builder-Gruppen von den modernen
Human-Kontrollen trennt. Wenn das nicht gelingt, bleibt `direct-only` die
ehrliche Produktgrenze.
