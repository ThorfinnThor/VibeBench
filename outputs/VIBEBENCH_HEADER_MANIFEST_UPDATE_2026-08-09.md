# VibeBench header and manifest context update

Stand: 2026-08-09  
Status: in Produktion auf Commit `4fa3f38` geprüft

## Ziel

Der Scanner soll zusätzliche öffentliche Infrastruktur- und PWA-Signale
erklären, ohne Hosting oder ein Web-Manifest als direkten Beweis für
AI-gestütztes Vibe-Coding zu behandeln.

## Implementierte Kontextquellen

### Response-Header

Bekannte öffentliche Header werden auf verständliche Labels reduziert:

- `x-vercel-id` oder ein Vercel-Serverwert → `Vercel response`
- `x-nf-request-id` oder ein Netlify-Serverwert → `Netlify response`
- `x-replit-user-id` → `Replit response`
- `x-render-origin-server` → `Render response`
- `cf-ray` oder ein Cloudflare-Serverwert → `Cloudflare edge`
- `x-powered-by: Next.js` → `Next.js response`

Die konkreten Headerwerte werden nicht in der Oberfläche veröffentlicht. Alle
Labels sind Kontextsignale und verändern allein kein Urteil zu `direct`.

### Web-App-Manifest

- Es wird ausschließlich ein im HTML verlinktes Manifest berücksichtigt.
- Das Manifest muss Same-Origin sein und darf keine Credentials enthalten.
- Cross-Origin-Weiterleitungen werden blockiert.
- Der Download ist auf 100 KB begrenzt.
- Nur ein gültiges JSON-Objekt wird als Manifest-Kontext anerkannt.
- Installierbarer Display-Modus und vorhandene Icons werden separat angezeigt.
- Ein ungültiges oder nicht abrufbares verlinktes Manifest wird transparent als
  nicht auswertbar gemeldet.

Manifestdaten werden nicht in die direkte Builder-Marker-Suche aufgenommen.

## Oberfläche

Die Ergebnisse sind jetzt in vier fachliche Karten aufgeteilt:

1. direkte Builder-Artefakte,
2. Stack und Hosting,
3. Header und Manifest,
4. Struktur- und Assetmetriken.

Auf breiten Ansichten werden sie als ausgewogenes 2×2-Raster dargestellt; auf
kleinen Ansichten bleiben sie einspaltig.

## Tests

- Header-Kontext verändert ein unbestimmtes Urteil nicht zu einem Treffer.
- Next.js kann über `x-powered-by` als Stack- und Header-Kontext erscheinen.
- Gültige Manifeste liefern ausschließlich Kontextlabels.
- Ungültiges JSON und `null` werden nicht als Manifest akzeptiert.
- Nur verlinkte Same-Origin-Manifeste werden extrahiert.
- Fremde Manifest-URLs bleiben blockiert.
- Insgesamt 11/11 Unit-Tests erfolgreich (einschließlich False-Positive-Regression).
- ESLint, Next.js-Produktionsbuild, Bundle-Verifikation und Diff-Prüfung erfolgreich.

## Produktionsergebnis

Der Kern-Smoke-Test mit 10 AI- und 10 Human-Seiten lief nach dem Deployment
20/20 technisch erfolgreich. Die Verdict-Verteilung blieb gegenüber dem Stand
vor Header/Manifest unverändert. Damit verbessern die neuen Signale die
Erklärung, ohne selbst direkte oder indikative Treffer auszulösen.

Die anschließend auf alle 52 historisch scanbaren URLs ausgeweitete Erfassung
lieferte 51 erfolgreiche Scans und einen HTTP-403-Ausfall. 37/52 Seiten hatten
bekannte Infrastruktur-Header; 8/52 hatten ein gültiges verlinktes Manifest.

| Gruppe | Header | Manifest |
|---|---:|---:|
| AI (36) | 32 | 3 |
| Human (16) | 5 | 5 |

Manifeste kommen in dieser Stichprobe bei Human-Seiten mindestens ebenso häufig
vor wie bei AI-Seiten. Das bestätigt die Entscheidung, sie ausschließlich als
technischen Kontext zu behandeln.

## Nächste To-dos

1. Die gehärtete indicative-Regel und transparenten Marker-Namen deployen.
2. Die 52-URL-Erfassung nach dem Deployment wiederholen.
3. Fehlende AI-Treffer builderweise auf weitere öffentliche Artefakte untersuchen.
4. Einen separaten Blind-Holdout definieren, der nicht zur Regelentwicklung diente.
5. Erst danach Precision/Recall und eine mögliche Kalibrierung berichten.

## Empfohlener nächster Schritt

Die gehärtete indicative-Regel deployen und zuerst `HUM-0014` sowie die fünf
AI-indicative-Fälle erneut prüfen. Erwartung: `HUM-0014` wird unbestimmt; die
fünf AI-Fälle bleiben indikativ, weil sie zusätzlich mehrere Stack-Signale haben.
