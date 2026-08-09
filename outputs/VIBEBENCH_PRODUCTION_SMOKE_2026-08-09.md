# VibeBench production smoke evaluation

Stand: 2026-08-09  
API: https://vibe-bench-cyan.vercel.app/api/scan  
Erfassung: Produktions-UI im Browser; anschließend reproduzierbar importiert

## Zweck

Dieser kleine Produktionstest prüft, ob der veröffentlichte Evidence Scanner auf
einer festgehaltenen Auswahl aus dem v0.9-Datensatz technisch stabil arbeitet.
Er ist **keine Accuracy- oder Kalibrierungsbehauptung**. Die aktuelle App trennt
direkte Builder-Artefakte, allgemeine Hinweise und unbestimmte Ergebnisse.

## Auswahl

- 10 zuvor erfolgreich scanbare, provenance-gelabelte AI-Seiten.
- 10 zuvor erfolgreich scanbare Human-Kontrollen.
- Die Auswahl deckt Lovable, Bolt, Replit Agent, v0 und Claude Code ab.

## Ergebnis

| Kennzahl | Wert |
|---|---:|
| API erfolgreich | 20 / 20 |
| AI: direkte Evidenz | 5 / 10 (50.0 %) |
| AI: direkte oder indikative Evidenz | 6 / 10 (60.0 %) |
| AI: unbestimmt | 4 / 10 |
| Human: direkte Evidenz | 0 / 10 |
| Human: indikative Evidenz | 0 / 10 |
| Human: unbestimmt | 10 / 10 |
| Scanfehler | 0 |

## Einzelergebnisse

| Sample | Label | Builder | Verdict | Direkte Evidenz | Technischer Kontext | ms |
|---|---|---|---|---|---|---:|
| AIN-0001 | AI | Lovable | direct | Lovable | Vite | 1888 |
| AIN-0005 | AI | Lovable | direct | Lovable | Vite, Lovable hosting | 1171 |
| AIN-0019 | AI | Lovable | direct | Lovable | Vite, Lovable hosting | 1115 |
| AIN-0008 | AI | Bolt | indeterminate | — | Vite | 573 |
| AIN-0025 | AI | Bolt | indeterminate | — | Vite, Netlify | 869 |
| AIN-0029 | AI | Bolt | indeterminate | — | Supabase | 1104 |
| AIN-0039 | AI | Replit Agent | indeterminate | — | Vite, Replit hosting | 3771 |
| AIN-0042 | AI | v0 | direct | v0 | Next.js, Lucide, Vercel | 594 |
| AIN-0044 | AI | v0 | direct | v0 | Next.js, Lucide, Vercel | 604 |
| AIA-0023 | AI | Claude Code | indicative | — | Next.js, Radix UI, Lucide, Supabase | 646 |
| HUM-0001 | HUMAN | — | indeterminate | — | — | 582 |
| HUM-0002 | HUMAN | — | indeterminate | — | — | 569 |
| HUM-0003 | HUMAN | — | indeterminate | — | — | 624 |
| HUM-0004 | HUMAN | — | indeterminate | — | — | 574 |
| HUM-0005 | HUMAN | — | indeterminate | — | — | 839 |
| HUM-0006 | HUMAN | — | indeterminate | — | — | 559 |
| HUM-0007 | HUMAN | — | indeterminate | — | — | 594 |
| HUM-0008 | HUMAN | — | indeterminate | — | — | 840 |
| HUM-0009 | HUMAN | — | indeterminate | — | — | 579 |
| HUM-0010 | HUMAN | — | indeterminate | — | — | 578 |

## Interpretation

- `direct` bedeutet, dass ein builder-spezifisches Deployment-Artefakt sichtbar war.
- `indicative` bündelt mehrere allgemeine Struktur-/Stack-Hinweise und ist keine Builder-Zuordnung.
- `indeterminate` ist ein erwartetes, ehrliches Ergebnis, wenn sichtbare Evidenz fehlt.
- Hosting wie Vercel, Netlify oder Replit wird allein nicht als direkte AI-Evidenz gewertet.

## Nächste To-dos

1. Fehlende AI-Treffer nach Builder gruppieren und die zugehörigen JS-/CSS-Assets untersuchen.
2. Header-, Manifest- und Source-Map-Signale aus dem Python-Extractor in die Web-API übernehmen.
3. Die Produktionsevaluation auf alle aktuell erreichbaren gelabelten URLs ausweiten.
4. Scan-Ausfälle getrennt von Klassifikationsfehlern berichten.
5. Erst nach einem Blind-Holdout und Kalibrierung einen Wahrscheinlichkeitswert ergänzen.
