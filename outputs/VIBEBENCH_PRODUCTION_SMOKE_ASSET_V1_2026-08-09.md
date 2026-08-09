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
| Assets geprüft | 68 |
| Asset-Bytes geprüft | 5.969.859 |
| Asset-Fehler | 0 |
| Gekürzte Assets | 8 |

## Einzelergebnisse

| Sample | Label | Builder | Verdict | Direkte Evidenz | Technischer Kontext | Assets | Asset-Bytes | ms |
|---|---|---|---|---|---|---:|---:|---:|
| AIN-0001 | AI | Lovable | direct | Lovable | React, Vite, Tailwind CSS | 3 | 484.403 | 1765 |
| AIN-0005 | AI | Lovable | direct | Lovable | React, Vite, Tailwind CSS, Radix UI, Lucide, Lovable hosting | 3 | 394.636 | 1763 |
| AIN-0019 | AI | Lovable | direct | Lovable | React, Vite, Tailwind CSS, Radix UI, Lucide, Lovable hosting | 3 | 379.160 | 1744 |
| AIN-0008 | AI | Bolt | indeterminate | — | React, Vite, Tailwind CSS, Lucide | 2 | 444.382 | 689 |
| AIN-0025 | AI | Bolt | indeterminate | — | React, Vite, Tailwind CSS, Lucide, Netlify | 2 | 323.578 | 975 |
| AIN-0029 | AI | Bolt | indeterminate | — | Tailwind CSS, Lucide, Supabase | 2 | 399.816 | 1489 |
| AIN-0039 | AI | Replit Agent | indeterminate | — | React, Vite, Tailwind CSS, Radix UI, Lucide, Replit hosting, Replit runtime | 2 | 420.634 | 696 |
| AIN-0042 | AI | v0 | direct | v0 | Next.js, React, Tailwind CSS, Lucide, Vercel | 5 | 513.167 | 702 |
| AIN-0044 | AI | v0 | direct | v0 | Next.js, React, Tailwind CSS, Lucide, Vercel | 6 | 589.294 | 708 |
| AIA-0023 | AI | Claude Code | indicative | — | Next.js, Tailwind CSS, Radix UI, Lucide, Supabase | 6 | 415.315 | 6286 |
| HUM-0001 | HUMAN | — | indeterminate | — | — | 5 | 284.495 | 710 |
| HUM-0002 | HUMAN | — | indeterminate | — | — | 2 | 200.527 | 688 |
| HUM-0003 | HUMAN | — | indeterminate | — | — | 4 | 223.573 | 699 |
| HUM-0004 | HUMAN | — | indeterminate | — | — | 6 | 148.068 | 705 |
| HUM-0005 | HUMAN | — | indeterminate | — | — | 1 | 3.101 | 700 |
| HUM-0006 | HUMAN | — | indeterminate | — | — | 4 | 329.688 | 708 |
| HUM-0007 | HUMAN | — | indeterminate | — | — | 2 | 205.183 | 935 |
| HUM-0008 | HUMAN | — | indeterminate | — | — | 2 | 4.645 | 1471 |
| HUM-0009 | HUMAN | — | indeterminate | — | — | 2 | 5.207 | 964 |
| HUM-0010 | HUMAN | — | indeterminate | — | — | 6 | 200.987 | 1482 |

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
