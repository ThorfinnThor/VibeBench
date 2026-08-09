# VibeBench production evidence evaluation

Stand: 2026-08-09  
API: https://vibe-bench-cyan.vercel.app/api/scan  
Erfassung: Produktions-UI im Browser; anschließend reproduzierbar importiert

## Zweck

Dieser Produktionstest prüft, ob der veröffentlichte Evidence Scanner auf
einer festgehaltenen Auswahl aus dem v0.9-Datensatz technisch stabil arbeitet.
Er ist **keine Accuracy- oder Kalibrierungsbehauptung**. Die aktuelle App trennt
direkte Builder-Artefakte, allgemeine Hinweise und unbestimmte Ergebnisse.

## Auswahl

- 52 browser-captured, previously scanable provenance-labelled samples from the v0.9 live dataset.
- AI: 36; Human: 16.
- Erfasste Builder: Lovable, Bolt, Replit Agent, v0, Claude Code.

## Ergebnis

| Kennzahl | Wert |
|---|---:|
| API erfolgreich | 51 / 52 |
| AI: direkte Evidenz | 13 / 36 (36.1 %) |
| AI: direkte oder indikative Evidenz | 18 / 36 (50.0 %) |
| AI: unbestimmt | 17 / 36 |
| Human: direkte Evidenz | 0 / 16 |
| Human: indikative Evidenz | 1 / 16 |
| Human: unbestimmt | 15 / 16 |
| Scanfehler | 1 |
| Assets geprüft | 172 |
| Asset-Bytes geprüft | 16.479.135 |
| Asset-Fehler | 0 |
| Gekürzte Assets | 22 |
| Seiten mit Infrastruktur-Headern | 37 / 52 |
| Seiten mit gültigem verlinktem Manifest | 8 / 52 |
| AI mit Headern / Manifest | 32 / 3 |
| Human mit Headern / Manifest | 5 / 5 |

## Einzelergebnisse

| Sample | Label | Builder | Verdict | Direkte Evidenz | Technischer Kontext | Header | Manifest | Assets | Asset-Bytes | ms |
|---|---|---|---|---|---|---|---|---:|---:|---:|
| AIN-0001 | AI | Lovable | direct | Lovable | React, Vite, Tailwind CSS | Cloudflare edge | — | 3 | 484.403 | 1774 |
| AIN-0005 | AI | Lovable | direct | Lovable | React, Vite, Tailwind CSS, Radix UI, Lucide, Lovable hosting | Cloudflare edge | — | 3 | 394.636 | 2003 |
| AIN-0019 | AI | Lovable | direct | Lovable | React, Vite, Tailwind CSS, Radix UI, Lucide, Lovable hosting | Cloudflare edge | — | 3 | 379.160 | 971 |
| AIN-0008 | AI | Bolt | indeterminate | — | React, Vite, Tailwind CSS, Lucide | Cloudflare edge | — | 2 | 444.382 | 1241 |
| AIN-0025 | AI | Bolt | indeterminate | — | React, Vite, Tailwind CSS, Lucide, Netlify | Netlify response | — | 2 | 323.578 | 1235 |
| AIN-0029 | AI | Bolt | indeterminate | — | Tailwind CSS, Lucide, Supabase | Netlify response | — | 2 | 399.816 | 1277 |
| AIN-0039 | AI | Replit Agent | indeterminate | — | React, Vite, Tailwind CSS, Radix UI, Lucide, Replit hosting, Replit runtime | — | — | 2 | 420.634 | 706 |
| AIN-0042 | AI | v0 | direct | v0 | Next.js, React, Tailwind CSS, Lucide, Vercel | Vercel response, Next.js response | — | 5 | 513.167 | 710 |
| AIN-0044 | AI | v0 | direct | v0 | Next.js, React, Tailwind CSS, Lucide, Vercel | Vercel response | — | 6 | 589.294 | 701 |
| AIA-0023 | AI | Claude Code | indicative | — | Next.js, Tailwind CSS, Radix UI, Lucide, Supabase | Vercel response, Next.js response | — | 6 | 415.315 | 709 |
| HUM-0001 | HUMAN | — | indeterminate | — | — | Cloudflare edge | Web app manifest, Installable display mode, Manifest icons | 5 | 284.495 | 718 |
| HUM-0002 | HUMAN | — | indeterminate | — | — | — | — | 2 | 200.527 | 711 |
| HUM-0003 | HUMAN | — | indeterminate | — | — | — | Web app manifest, Manifest icons | 4 | 223.573 | 701 |
| HUM-0004 | HUMAN | — | indeterminate | — | — | — | — | 6 | 148.068 | 696 |
| HUM-0005 | HUMAN | — | indeterminate | — | — | Netlify response | Web app manifest, Manifest icons | 1 | 3.101 | 696 |
| HUM-0006 | HUMAN | — | indeterminate | — | — | — | — | 4 | 329.688 | 755 |
| HUM-0007 | HUMAN | — | indeterminate | — | — | — | Web app manifest, Manifest icons | 2 | 205.183 | 965 |
| HUM-0008 | HUMAN | — | indeterminate | — | — | — | — | 2 | 4.645 | 1465 |
| HUM-0009 | HUMAN | — | indeterminate | — | — | — | — | 2 | 5.207 | 1011 |
| HUM-0010 | HUMAN | — | indeterminate | — | — | — | Web app manifest, Installable display mode, Manifest icons | 6 | 200.987 | 1209 |
| AIN-0002 | AI | Lovable | indeterminate | — | React, Vite, Tailwind CSS, Lucide | Netlify response | — | 2 | 411.666 | 1529 |
| AIN-0003 | AI | Lovable | direct | Lovable | React, Vite, Tailwind CSS, Radix UI, Lucide | Cloudflare edge | — | 3 | 390.884 | 1232 |
| AIN-0004 | AI | Lovable | error | — | — | — | — | — | — | 655 |
| AIN-0006 | AI | Lovable | direct | Lovable | Vite, Tailwind CSS, Radix UI, Lucide, Supabase | Cloudflare edge | Web app manifest, Installable display mode, Manifest icons | 3 | 566.108 | 1750 |
| AIN-0007 | AI | Lovable | direct | Lovable | React, Vite, Tailwind CSS, Radix UI, Lucide, Lovable hosting | Cloudflare edge | — | 3 | 392.066 | 1759 |
| AIN-0010 | AI | Bolt | indeterminate | — | React, Vite, Tailwind CSS, Lucide | Cloudflare edge | — | 2 | 355.315 | 703 |
| AIN-0011 | AI | Bolt | indeterminate | — | React, Vite, Tailwind CSS, Lucide | Netlify response | — | 2 | 157.261 | 706 |
| AIN-0012 | AI | Bolt | indeterminate | — | React, Tailwind CSS, Radix UI, Lucide, Supabase | Netlify response | — | 3 | 518.320 | 693 |
| AIN-0013 | AI | Bolt | indicative | — | Vite, Tailwind CSS, Lucide, Supabase | Netlify response | — | 1 | 29.370 | 2282 |
| AIA-0026 | AI | Claude Code | indeterminate | — | — | Cloudflare edge | — | 2 | 105.524 | 946 |
| HUM-0012 | HUMAN | — | indeterminate | — | — | — | — | 6 | 290.023 | 1453 |
| HUM-0013 | HUMAN | — | indeterminate | — | — | — | — | 3 | 19.342 | 692 |
| HUM-0014 | HUMAN | — | indicative | — | — | Cloudflare edge | — | 6 | 202.444 | 1733 |
| HUM-0015 | HUMAN | — | indeterminate | — | — | Cloudflare edge | — | 2 | 70.631 | 984 |
| HUM-0016 | HUMAN | — | indeterminate | — | — | Cloudflare edge | — | 3 | 49.997 | 731 |
| HIS-0024 | HUMAN | — | indeterminate | — | — | — | — | 1 | 8.923 | 694 |
| AIN-0017 | AI | Lovable | indeterminate | — | React, Vite, Tailwind CSS, Radix UI, Lucide | Cloudflare edge | — | 3 | 397.229 | 3125 |
| AIN-0018 | AI | Lovable | indeterminate | — | Next.js, React, Tailwind CSS, Lucide | — | — | 6 | 417.717 | 968 |
| AIN-0020 | AI | Lovable | indeterminate | — | React, Vite, Tailwind CSS, Radix UI | Cloudflare edge | — | 3 | 414.858 | 1771 |
| AIN-0021 | AI | Lovable | direct | Lovable | React, Vite, Tailwind CSS, Radix UI, Lovable hosting | Cloudflare edge | — | 3 | 522.983 | 1213 |
| AIN-0022 | AI | Lovable | direct | Lovable | React, Vite, Tailwind CSS, Radix UI, Lucide, Lovable hosting | Cloudflare edge | — | 3 | 387.297 | 2232 |
| AIN-0026 | AI | Bolt | indicative | — | Next.js, React, Tailwind CSS, Radix UI, Lucide | Netlify response | — | 6 | 586.914 | 939 |
| AIN-0027 | AI | Bolt | indeterminate | — | React, Vite, Tailwind CSS, Framer Motion, Lucide, Netlify | Netlify response | — | 2 | 320.972 | 1221 |
| AIN-0028 | AI | Bolt | direct | Bolt | React, Vite, Tailwind CSS, Lucide, Supabase | Netlify response | — | 2 | 371.304 | 1483 |
| AIN-0030 | AI | Bolt | indicative | — | Next.js, React, Tailwind CSS, Lucide, Supabase | Netlify response | Web app manifest, Installable display mode, Manifest icons | 5 | 447.097 | 893 |
| AIN-0033 | AI | Bolt | indeterminate | — | Vite, Tailwind CSS | Netlify response | — | 2 | 321.855 | 1692 |
| AIN-0035 | AI | Bolt | indeterminate | — | Vite, Tailwind CSS, Lucide, Supabase | Netlify response | Web app manifest, Installable display mode, Manifest icons | 2 | 284.918 | 854 |
| AIN-0040 | AI | Replit Agent | indeterminate | — | React, Vite, Tailwind CSS, Replit hosting | — | — | 2 | 340.832 | 8044 |
| AIN-0043 | AI | v0 | indeterminate | — | Next.js, React, Tailwind CSS, Vercel | Vercel response | — | 6 | 560.357 | 723 |
| AIN-0045 | AI | v0 | direct | v0 | Next.js, React, Tailwind CSS, Lucide, Vercel | Vercel response | — | 6 | 535.874 | 704 |
| AIN-0046 | AI | v0 | direct | v0 | Next.js, React, Tailwind CSS, Lucide, Vercel | Vercel response | — | 6 | 570.549 | 709 |
| AIN-0047 | AI | v0 | indicative | — | Next.js, React, Tailwind CSS, Lucide, Vercel | Vercel response | — | 5 | 460.646 | 710 |

## Interpretation

- `direct` bedeutet, dass ein builder-spezifisches Deployment-Artefakt sichtbar war.
- `indicative` bündelt mehrere allgemeine Struktur-/Stack-Hinweise und ist keine Builder-Zuordnung.
- `indeterminate` ist ein erwartetes, ehrliches Ergebnis, wenn sichtbare Evidenz fehlt.
- Hosting wie Vercel, Netlify oder Replit wird allein nicht als direkte AI-Evidenz gewertet.
- Header und Web-App-Manifeste liefern technischen Kontext, aber keine direkte Builder-Zuordnung.

## Nächste To-dos

1. Die gehärtete indicative-Regel deployen und denselben Capture erneut auswerten.
2. Fehlende AI-Treffer nach Builder gruppieren und die zugehörigen JS-/CSS-Artefakte untersuchen.
3. Einen noch nie zur Regelentwicklung verwendeten Blind-Holdout definieren.
4. Scan-Ausfälle getrennt von Klassifikationsfehlern berichten.
5. Erst nach Blind-Holdout und Kalibrierung einen Wahrscheinlichkeitswert ergänzen.
