# VibeBench Blind Holdout 100 – Abschluss der Akquisition

Stand: 2026-08-10
Status: 100/100 READY und eingefroren, noch nicht durch den VibeBench-Scanner ausgewertet

## Ergebnis

Alle vorab vorgesehenen Holdout-Slots sind vollständig befüllt:

| Label / Stratum | READY |
|---|---:|
| AI – Lovable | 10 |
| AI – Bolt | 10 |
| AI – Replit Agent | 10 |
| AI – v0 | 10 |
| AI – andere agentische Builder | 10 |
| Human – moderne Web-App | 10 |
| Human – SaaS/Product | 10 |
| Human – Portfolio/Agency | 10 |
| Human – Content/Docs | 10 |
| Human – Pre-AI-Ursprung | 10 |
| **Gesamt** | **100** |

## Was geprüft wurde

- Jede Zeile besitzt eine konkrete öffentliche HTTPS-Ziel-URL.
- Jede AI-Zeile besitzt einen projektbezogenen Builder-Nachweis; eine reine
  Repository-Zuordnung reicht für ein AI-Label nicht aus.
- Jede Human-Zeile besitzt eine öffentliche Repository-/Deployment-Zuordnung
  mit auditierbarer Human-Entwicklungshistorie.
- Ziel- und Provenienzseite liegen auf unterschiedlichen Hosts.
- Ziel-URL, Domain-Gruppe und Projekt-Gruppe sind innerhalb des Holdouts eindeutig.
- Exakte URL-, Host- und Domain-Gruppen-Überschneidungen mit dem 63er
  Development-Manifest werden automatisiert abgewiesen.
- Jedes Stratum verwendet mindestens sechs unterschiedliche Provenienz-URLs.
- Am 2026-08-10 antworteten alle 100 Ziel- und alle 100 Provenienz-URLs
  erfolgreich bei einer unabhängigen HTTPS-Prüfung.

## Reproduzierbare Artefakte

- `data/holdout-samples-v0_1.mjs`: versionierte Quelldaten für alle 100 Zeilen
- `scripts/build-holdout-workbook.mjs`: deterministischer CSV-/XLSX-Builder
- `scripts/audit-holdout-reachability.mjs`: reine Erreichbarkeitsprüfung ohne Scanner
- `scripts/validate-holdout.mjs`: Schema-, Leakage-, Evidenz- und Freeze-Gates
- `vibebench_blind_holdout_100_v0_1.csv`: maschinenlesbares Manifest
- `vibebench_blind_holdout_100_v0_1.xlsx`: visuell prüfbares Arbeitsbuch
- `vibebench_holdout_reachability_audit_2026-08-10.json`: 200 Abrufbelege
- `vibebench_blind_holdout_100_v0_1.csv.freeze.json`: Hash- und Scanner-Lock

## Bewusste Grenzen

Die zehn Replit-Kandidaten verwenden stabile Custom Domains oder weiterhin
aktive Replit-Deployments. Früh recherchierte kurzlebige `replit.app`-
Hackathon-Deployments wurden nach 404-Antworten verworfen. Bei den Human-
Kontrollen bezeichnet `HUMAN_PRE_AI_SNAPSHOT` einen nachweislich vor 2021
begonnenen Projektursprung mit aktueller öffentlicher Deployment-URL; es handelt
sich nicht in jedem Fall um eine unveränderliche Archivkopie.

Mehrere Projekte dürfen dieselbe Sammelquelle verwenden, sofern die Quelle jedes
Projekt einzeln und mit exakter Ziel-URL belegt. Diese Quellencluster bleiben als
Validator-Warnungen sichtbar und werden durch die Mindestzahl verschiedener
Quellen pro Stratum begrenzt.

## Nächste To-dos

1. Scanzeitfenster, Timeout und einmalige Retry-Regel vor dem Lauf festhalten.
2. Den Blindlauf genau einmal ausführen, ohne vorher Verdicts einzelner URLs anzusehen.
3. Technische Erfolgsquote und Klassifikationsmetriken getrennt berichten.
4. Bootstrap-Konfidenzintervalle und builder-spezifische Coverage berechnen.
5. Jede spätere Scanneränderung nur gegen einen neuen Holdout bewerten.

## Empfohlener nächster Schritt

Jetzt das Scanprotokoll finalisieren und danach den einmaligen Blindlauf der
100 URLs gegen den im Freeze-Lock gebundenen Scanner-Commit starten.
