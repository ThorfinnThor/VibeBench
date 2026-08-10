# VibeBench v0.2 confirmation holdout plan

Status: Entwurf nach Development-Gate · noch nicht akquiriert oder ausgeführt

## Ziel

Der eingefrorene v0.2-Kandidat soll auf vollständig neuen Projekten genau
einmal geprüft werden. Das Bestätigungsgate lautet:

- Precision ≥ 80 %
- Recall ≥ 80 %
- technische Fehler separat, nicht als Klassifikationsfehler

Die 85/85-Development-Cross-Validation ist kein Ersatz für diesen Holdout.

## Vorgeschlagener Umfang

200 unabhängige Projektfamilien:

| Stratum | n |
|---|---:|
| AI · Replit Agent | 25 |
| AI · Bolt | 25 |
| AI · Lovable | 25 |
| AI · v0 oder anderer vorab definierter Builder | 25 |
| Human · Modern SaaS | 50 |
| Human · Modern App/Site | 50 |

## Ausschlüsse

- kein Ziel aus Development v0.1 oder v0.2;
- kein Ziel aus dem abgeschlossenen v0.1-Holdout;
- keine Schwesterprojekte derselben `project_family_id`;
- Shared-Platform-Tenants werden plattformweit auf Overlap geprüft;
- keine Seite, deren Label erst nach Sichtung des Kandidatenscores gewählt wurde;
- keine Parking-, For-sale-, Login-only- oder technisch nicht prüfbare Seite im
  finalen Freeze.

## Ablauf

1. Kandidatenmodell und Featurecode bleiben auf dem Hashstand des
   `vibebench_development_v0_2_candidate.freeze.json`.
2. Alle 200 Labels, Provenienzquellen, Projektfamilien und URLs werden geprüft.
3. Manifest, Retry-Regel, Fehlerbehandlung, Modellhash und Auswertungsskript
   werden vor dem ersten Scan eingefroren.
4. Der Lauf erfolgt genau einmal mit Checkpoint-Fortsetzung nur bei technischer
   Unterbrechung.
5. Primär berichtet werden Precision, Recall, Specificity, F1, Confusion Matrix
   und Bootstrap-Konfidenzintervalle auf technisch erfolgreichen Scans.
6. Schlägt eines der 80-%-Gates fehl, wird das Modell nicht nachträglich auf
   diesem Holdout angepasst. Eine weitere Version braucht neue Development-
   Daten und später wiederum einen neuen Holdout.

## Nächste To-dos

1. Umfang von 200 Projekten bestätigen.
2. Provenienz- und Matching-Schema als maschinenlesbare Vorlage anlegen.
3. Akquisition beginnen, ohne Scores der Kandidaten vor der Aufnahme zu lesen.
4. Erst bei 200/200 READY das Manifest und Protokoll einfrieren.

## Empfohlener nächster Schritt

Den 200er-Umfang bestätigen und anschließend zuerst die 100 AI-Projekte
akquirieren. Das ist der arbeitsintensivste Teil und entscheidet, ob 85/85 auch
außerhalb des Development-Satzes Bestand hat.
