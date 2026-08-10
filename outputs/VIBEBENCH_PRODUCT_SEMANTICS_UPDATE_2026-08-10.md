# VibeBench product semantics update · v0.1.1

Stand: 2026-08-10  
Status: lokal implementiert und geprüft; noch nicht als Produktionsergebnis bestätigt

## Ausgangslage

Der eingefrorene 100-Site-Holdout zeigte, dass die bisherige gemeinsame
Interpretation von `direct` und `indicative` produktseitig zu breit war:

- 28/49 technisch erfolgreiche AI-Sites hatten direkte Builder-Evidenz.
- 0/49 technisch erfolgreiche Human-Kontrollen hatten direkte Builder-Evidenz.
- Der allgemeine `indicative`-Pfad traf zusätzlich 2 AI-Sites, aber auch 9
  Human-Kontrollen.

Die Scanner-v0.1-Regel bleibt als Forschungsbaseline unverändert. v0.1.1
ändert keine Marker, Stack-Signale, Struktur-Schwellen oder Verdict-Bedingungen.
Geändert werden ausschließlich Produktsprache, Ergebnis-Hierarchie und die
Darstellung technischer Fehler.

## Neue Ergebnissemantik

### Direct

- UI-Titel: „Sichtbares Builder-Artefakt“
- Erlaubte Aussage: Der konkrete öffentliche Marker und seine Quelle dürfen
  benannt werden.
- Grenze: Kein Beweis für Autorenschaft und keine Aussage über den AI-Anteil.

### Indicative

- UI-Titel: „Allgemeine Strukturmuster“
- Erlaubte Aussage: Technische Ähnlichkeit als Kontext beschreiben.
- Grenze: Keine AI-, Vibe-Coding- oder Builder-Attribution.
- Stack-, Hosting-, Header-, Manifest- und Struktur-Chips sind sichtbar als
  `Context only`, `Keine Attribution` oder `Generic · non-attributive` markiert.

### Indeterminate

- UI-Titel: „Keine belastbare Zuordnung“
- Erlaubte Aussage: Im begrenzten Scan wurde keine direkte Evidenz gefunden.
- Grenze: Weder Human- noch AI-Zuordnung.

### Technischer Fehler

Technische Probleme erscheinen als eigener vierter Ausgang und nicht als
`indeterminate`. Die API liefert zusätzlich ein strukturiertes
`technicalOutcome` mit Code, Titel, Zusammenfassung, nächstem Schritt,
Retry-Hinweis und passendem API-Status.

Unterstützte Kategorien:

- ungültige URL oder nicht unterstütztes Protokoll,
- private/lokale Adresse,
- HTTP 401/403, 404, 429, sonstige 4xx und 5xx,
- HTML über dem 1,5-MB-Sicherheitslimit,
- Nicht-HTML-Inhalt,
- Weiterleitungsfehler,
- Timeout,
- DNS-Auflösungsfehler,
- generischer technischer Fehler.

## UI- und Interaktionsänderungen

- Hero beschreibt öffentliche Evidenz statt vermeintlicher Autorenschaft.
- Permanenter Holdout-Hinweis: „Ein moderner Stack ist kein AI-Beweis.“
- Ergebnisbanner enthält jeweils eine erlaubte Aussage und ihre Grenze.
- Context-Karten sind visuell von Builder-Evidenz getrennt.
- Nach einem Scan wird der Ergebnisbereich fokussiert und weich eingeblendet.
- Mobile Darstellung nutzt gestapelte Claim-/Boundary- und Ergebniskarten.
- Versionskennzeichnung: `Evidence scanner · v0.1.1`.

## Verifikation

Automatisch:

- 23/23 Node-Tests erfolgreich,
- ESLint erfolgreich,
- Next.js-Production-Build erfolgreich,
- keine Änderung an `lib/analyze-html.mjs`.

Lokaler Browser-Test bei 1.280 × 720:

- Direct: `challengebrew.com` → sichtbares Lovable-Artefakt,
- Indicative: `cardshows.io` → allgemeine Strukturmuster / keine Attribution,
- Indeterminate: `example.com` → keine belastbare Zuordnung,
- Technical error: `127.0.0.1` → private Adresse blockiert,
- keine Browser-Warnungen oder -Fehler.

Responsive Test bei 390 × 844:

- kein horizontaler Overflow,
- Hero, Scanformular, Holdout-Hinweis, Ergebnisgrenzen und Karten lesbar,
- temporärer Viewport nach der Prüfung zurückgesetzt.

## Forschungsgrenze

Die neuen Texte verbessern die wissenschaftlich korrekte Interpretation, aber
nicht die Erkennungsleistung. Recall, Builder-Abdeckung und generische
False-Positive-Probleme bleiben Forschungsaufgaben. Der geöffnete 100er-Holdout
darf nicht zum Tuning von v0.2 verwendet werden.

## Nächste To-dos

1. v0.1.1 pushen und über Vercel deployen.
2. Direct, Indicative, Indeterminate und technische Fehler in Produktion prüfen.
3. Neue Replit- und Human-SaaS-Development-Samples akquirieren.
4. v0.2 ausschließlich auf Development-Daten entwickeln.
5. Einen neuen Bestätigungs-Holdout für v0.2 einfrieren.

## Empfohlener nächster Schritt

Nach dem Push zuerst den Produktions-Deploy von v0.1.1 mit je einem Direct-,
Indicative-, Indeterminate- und Fehlerbeispiel prüfen. Erst danach die neue
Development-only-Forschungsrunde für v0.2 beginnen.
