# VibeBench header and manifest context update

Stand: 2026-08-09  
Status: lokal implementiert und geprüft; Deployment nach Push

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
- Insgesamt 10/10 Unit-Tests erfolgreich.
- ESLint, Next.js-Produktionsbuild, Bundle-Verifikation und Diff-Prüfung erfolgreich.

## Nächste To-dos

1. Commit über GitHub Desktop pushen und Vercel-Deployment abwarten.
2. Bekannte Lovable-, Bolt-, Replit-, v0- und Human-Seiten erneut scannen.
3. Header-/Manifest-Kontext zwischen AI- und Human-Kontrollen vergleichen.
4. Sicherstellen, dass die zusätzliche Anzeige keine neuen direkten Treffer erzeugt.
5. Danach die URL-Evaluation auf alle aktuell erreichbaren Samples ausweiten.

## Empfohlener nächster Schritt

Nach dem Deployment denselben 20-URL-Smoke-Test erneut ausführen. Header und
Manifest sollen die Erklärung verbessern; die direkten Urteile müssen stabil
bleiben, solange keine neuen Builder-Artefakte sichtbar sind.
