# VibeBench v0.5 · Forschungsstand zum 90/90-Ziel · 2026-08-11

## Ziel

Precision und Recall sollen jeweils mindestens 90 % erreichen. Diese Aussage
darf erst nach einem neuen, vor dem Lauf eingefrorenen unabhängigen Holdout als
Produktkennzahl verwendet werden. Der geöffnete v0.4-Holdout wurde weder als
Trainingsmatrix noch zur Auswahl einzelner Trainingszeilen verwendet.

## Produktänderung

Precision, Recall und Holdout-Größe wurden aus dem Hero der Website entfernt.
Im Hero steht nur noch ein kurzer Hinweis auf das validierte Modell. Die
vollständigen Benchmarkwerte stehen jetzt im Methodenbereich und werden dort
laienverständlich erklärt.

## Neue Daten

Vor dem Scoring wurde eine neue Development-Erweiterung festgelegt:

- 120 neue Websites,
- 60 AI und 60 Human,
- AI-Verteilung über Cursor, Claude Code, Windsurf, Codex und native Builder,
- Human-Kontrollen aus öffentlichen Source-Repositories, die vor dem
  30. November 2022 angelegt wurden,
- Auswahl ohne Modellscore,
- separate Project-Family-Hash-Partition für spätere Confirmation-Kandidaten.

Akquisitionspool:

- 251 noch nicht verwendete AI-Kandidaten in der Development-Partition,
- 98 davon auf Reichweite geprüft, 90 technisch und inhaltlich geeignet,
- 31 geeignete, zuvor akquirierte Human-Kandidaten,
- 83 neue Human-Kandidaten, 69 davon geeignet.

Ein technisch dauerhaft fehlgeschlagener Human-Kandidat wurde nach einer
vorhersehbaren rein technischen Ersatzregel durch den nächsten geeigneten,
noch nicht verwendeten Kandidaten ersetzt. Bei der Ersatzwahl wurde kein Score
verwendet.

## Development-Matrix

Die bestehende v0.4-Matrix mit 246 Zeilen wurde um 120 neue Zeilen erweitert:

- 366 Zeilen,
- 183 AI / 183 Human,
- 97 bestehende portable Features.

Für die erweiterte v0.5-Messschicht wurden alle 366 Development-Websites neu
gescannt. 365 waren nach dem festen Retry technisch erfolgreich. Nach dem
score-blinden Balancing enthält die erweiterte Matrix:

- 364 Zeilen,
- 182 AI / 182 Human,
- 180 Features.

Die neuen Features messen unter anderem:

- weitere Component- und Designsysteme,
- responsive, gradient-, blur-, rounding-, shadow- und animation-basierte
  Utility-Muster,
- CTA-, Pricing-, FAQ-, Testimonial- und Marketing-Sprachmuster,
- SEO- und Semantik-Reife,
- CSS-/JavaScript-Build-Fingerprints,
- Asset- und Layout-Verhältnisse.

## Ergebnisse

### Bestehende 97 Features auf 366 Seiten

Wiederholte target-group-stratifizierte 5-Fold-CV, zehn Zuordnungen:

| Kennzahl | Minimum/P10 | Median | Maximum |
|---|---:|---:|---:|
| Precision | 83,8 % | 85,0 % | 87,0 % |
| Recall | 83,1 % | 85,8 % | 87,4 % |

Keine der zehn Zuordnungen erreichte gleichzeitig 90/90.

### Erweiterte 180 Features auf 364 Seiten

Beste lineare Konfiguration: L2 = 10, Schwelle = 0,51.

| Kennzahl | Minimum/P10 | Median | P90 | Maximum |
|---|---:|---:|---:|---:|
| Precision | 86,5 % | 88,4 % | 90,1 % | 90,4 % |
| Recall | 85,2 % | 88,5 % | 90,1 % | 90,7 % |

Eine von zehn Zuordnungen erreichte gleichzeitig 90/90. Das Stability-Gate ist
damit nicht bestanden.

### Weitere Modellversuche

- Extra Random Forest: schwächer, Median ungefähr 82,7 % Precision und
  84,2 % Recall.
- Fold-lokale Feature-Auswahl: keine stabile Verbesserung; eine von acht
  Zuordnungen erreichte 90/90.

Diese negativen Ergebnisse wurden beibehalten und nicht durch selektive
Berichterstattung entfernt.

## Zentrale Diagnose

Die aktuelle positive Klasse bedeutet: In der öffentlichen Provenienz wurde
ein AI-Builder oder Code-Assistent genannt. Das ist nicht dasselbe wie:
„Der öffentlich sichtbare Website-Footprint wurde überwiegend durch
Vibecoding erzeugt.“

Ein Cursor-, Claude-Code- oder Codex-Eintrag kann einen kleinen Bugfix, einzelne
Komponenten oder fast das gesamte Produkt bedeuten. Dieser Anteil ist aus
öffentlichem HTML, CSS und JavaScript nicht zuverlässig rekonstruierbar.
Gleichzeitig können etablierte, eindeutig vor der generativen AI-Ära begonnene
Human-Projekte dieselben modernen Frameworks und Designsysteme verwenden.

Damit enthält das aktuelle binäre Label eine nicht direkt beobachtbare
Intensitätsdimension. Mehr Websites reduzieren Varianz, lösen diese
Zieldefinition aber nicht vollständig.

## Größere methodische Entscheidung

### Option A: bisherige Klasse beibehalten

Positive Klasse bleibt „irgendeine öffentlich belegte AI-Unterstützung“.

- Vorteil: breit und einfach zu akquirieren.
- Nachteil: Der sichtbare Scanner soll eine Intensität erkennen, während das
  Label nur Tool-Nutzung belegt.
- Folge: 90/90 ist möglicherweise mit öffentlichen Oberflächenmerkmalen nicht
  belastbar erreichbar.

### Option B: primäre Klasse auf starken Vibe-Footprint ausrichten

Empfohlene Definition:

- positiv: Builder-first oder explizit überwiegend prompt-basiert erzeugte
  öffentliche Website mit konkreter Provenienz,
- negativ: stabile, nachweislich vor der generativen AI-Ära entstandene
  Human-Website,
- ambig: bloße Nennung eines Code-Assistenten ohne belegte Intensität; diese
  Kohorte bleibt für Score-Kalibrierung und Grenzfalltests erhalten, zählt aber
  nicht als harter positiver Goldstandard.

Diese Definition passt zum Produktversprechen „Wie stark ist der sichtbare
Vibe-Footprint?“ und ist voraussichtlich besser beobachtbar. Sie ist jedoch eine
inhaltliche Änderung des Goldstandards und muss vor weiterer Optimierung
explizit freigegeben werden.

## Nächste Schritte nach Freigabe von Option B

1. eindeutige Builder-first- und Human-stable-Kriterien vorregistrieren,
2. Development-Matrix nach diesen Regeln neu labeln, ohne Scores anzusehen,
3. ambige Code-Assistant-Kohorte separat evaluieren,
4. v0.5-Kandidat nur bei stabilem Development-90/90-Gate einfrieren,
5. neuen 100er-Holdout aus der unangetasteten Hash-Partition auswählen,
6. Manifest, Scanner, Feature-Code, Modell und Schwelle vor dem Lauf hashen,
7. Precision und Recall nur bei unabhängigem 90/90-Ergebnis aktualisieren.
