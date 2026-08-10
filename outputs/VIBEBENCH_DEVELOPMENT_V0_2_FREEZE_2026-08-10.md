# VibeBench Development v0.2 Freeze

Stand: 2026-08-10

Status: **FROZEN · 40/40 READY · 40/40 technisch und inhaltlich zulässig**

## Ergebnis

Die zuvor offene Development-Erweiterung ist vollständig und reproduzierbar
eingefroren:

| Gruppe | n | Direct | Indicative | Indeterminate | technische Fehler |
|---|---:|---:|---:|---:|---:|
| Replit Agent | 10 | 0 | 1 | 9 | 0 |
| Bolt | 10 | 1 | 0 | 9 | 0 |
| Human Modern SaaS | 10 | 0 | 5 | 5 | 0 |
| Human Modern App | 10 | 0 | 2 | 8 | 0 |

Der gemeinsame Produktionslauf ergab 40/40 technische Erfolge, 40/40
Übereinstimmungen mit dem gespeicherten Verdict und 40/40 Übereinstimmungen der
gespeicherten Stack-Signale.

Der verschärfte Content-Gate bestätigte zusätzlich 40/40 echte Seiteninhalte.
`focus-garden.xyz` und `pawformancemode.com` waren vor dem finalen Freeze nur
noch Sedo-Parking-Seiten und wurden durch die live erreichbaren, dokumentierten
Bolt-Projekte `app.tabsquad.com` und `colorpalgen.com` ersetzt.

## Was das bedeutet

Das Set behebt zwei wesentliche Development-Lücken:

- Replit Agent ist nicht mehr nur mit zwei alten Fällen vertreten, sondern mit
  zehn neuen, provenance-gelabelten Custom Domains.
- Die negative Vergleichsgruppe enthält 20 moderne React-/Next-/Vite-/Tailwind-
  Anwendungen; sieben davon lösen unter v0.1 bereits generische
  `indicative`-Muster aus.

Der Befund bestätigt zugleich das Recall-Problem: Unter v0.1 zeigt keine der
zehn neuen Replit-Seiten direkte Replit-Evidenz und nur eine generische
Strukturhinweise. Bei Bolt ist nur 1/10 `direct`.

Diese Zahlen sind Development-Diagnostik. Sie dürfen nicht als unabhängige
Evaluation oder als neue Produktmetrik veröffentlicht werden.

## Leakage-Schutz

- Kein Ziel stammt aus dem bestehenden 52er-Development-Capture.
- Kein Ziel oder Leakage-Host stammt aus dem abgeschlossenen 100er-Holdout.
- Geteilte Plattformen wie `replit.app`, `vercel.app` und `netlify.app` werden
  als gemeinsame Leakage-Einheit behandelt.
- Alle aufgenommenen Replit-Ziele verwenden Custom Domains.
- `project_family_id` ist eindeutig; das verhindert doppelte Schwesterprojekte.
- Ziel und Provenienz müssen auf unterschiedlichen Hosts liegen.
- Der abgeschlossene Holdout ist als Quelle und Tuninghilfe ausdrücklich
  gesperrt.

## Reproduzierbarkeit

```bash
npm run development:v0.2-build
npm run development:v0.2-validate
npm run development:v0.2-audit
npm run development:v0.2-freeze
npm run research:v0.2-artifacts
```

Der letzte Befehl prüft, ob Audit und Manifest zusammengehören, und schreibt
SHA-256-Hashes für Quelle, 40er-Manifest und Audit nach
`outputs/development_v0_2/vibebench_development_v0_2_frozen_manifest.json`.

## Einschränkungen

- Customer Stories, Creator-Berichte und Directory-Metadaten dokumentieren
  Builder-Nutzung, sind aber keine unabhängigen Code-Audits.
- Ein AI-Label bedeutet dokumentierte Nutzung des Builders, nicht zwingend
  vollständige oder exklusive Generierung.
- Human ist ein operatives Development-Label auf Basis eines vor dem
  30. November 2022 begonnenen öffentlichen Source-Projekts; spätere einzelne
  AI-Unterstützung kann damit nicht ausgeschlossen werden.
- Websites können sich nach dem Freeze ändern. Der Audit hält den beobachteten
  Stand und die Abweichung zu den gespeicherten Baselines fest.
- Ein HTTP-200 allein reicht nicht: Parking-Signale oder ein separater
  Content-Fetch-Fehler blockieren einen neuen Freeze.

## Nächste To-dos

1. Portable Feature-Kandidaten auf dem eingefrorenen Development-Set prüfen.
2. Jeden Kandidaten gegen alle 20 modernen Human-Kontrollen prüfen.
3. Hosting-Proxys nicht zu Builder-Evidenz hochstufen.
4. Eine v0.2-Regel vorregistrieren und anschließend mit einem neuen Holdout evaluieren.

## Empfohlener nächster Schritt

Die direkte Markerforschung ist abgeschlossen und hat keinen zusätzlichen
hochkonfidenten Marker ergeben. Jetzt eine kleine portable Feature-Matrix auf
Development v0.2 untersuchen; der alte Holdout bleibt ausgeschlossen.
