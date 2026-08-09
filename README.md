# VibeBench

VibeBench untersucht, ob eine öffentlich erreichbare Website wahrscheinlich mit
AI-gestütztem Vibe-Coding erstellt wurde. Das Ergebnis ist eine probabilistische
Einschätzung auf Basis sichtbarer Deployment-Artefakte und struktureller
Merkmale – kein Beweis für Autorenschaft.

## Was VibeBench unterscheidet

- **Builder-Evidenz:** direkte Artefakte von Lovable, Bolt, v0, Replit Agent
  und weiteren AI-Buildern.
- **Portable Signale:** Merkmale jenseits konkreter Hosting- und
  Builder-Fingerprints.
- **Struktur-Signale:** DOM-, Asset-, SEO- und Layout-Merkmale ohne
  Framework- oder Builder-Erkennung.
- **Unsicherheit:** nicht scanbare oder mehrdeutige Websites werden nicht als
  sichere Klassifikation ausgegeben.

## Aktueller Forschungsstand

- Master-Dataset: 2.000 Samples in vier Kohorten.
- URL-Scan-Queue: 63 Websites, davon 52 erfolgreich gescannt.
- Trainings-Merge: 81 eindeutige, erfolgreiche und gelabelte Samples.
- Evaluation: Full, Portable, Structure und Leave-one-builder-out.
- Alle veröffentlichten Kennzahlen sind explorative Pilotdiagnostik.

Der vollständige Stand, Einschränkungen und die nächsten Forschungsaufgaben
stehen in [`outputs/VIBEBENCH_HANDOVER_V0_9.md`](outputs/VIBEBENCH_HANDOVER_V0_9.md).

## Einzelne URL untersuchen

Web-App lokal starten:

```bash
npm install
npm run dev
```

Anschließend `http://localhost:3000` öffnen. Die App scannt nur öffentlich
auflösbare HTTP(S)-Seiten, validiert auch Weiterleitungsziele und begrenzt den
HTML-Download auf 1,5 MB.

CLI-Extractor:

```bash
python3 vibebench_forensics_extractor_v0_9.py https://example.com
```

Der transparente `rule_score` ist nur ein technischer Sanity-Check und keine
kalibrierte AI-Wahrscheinlichkeit.

## Pipeline

```bash
./run_vibebench_url_training_pipeline_v0_9.sh
```

Der Standardlauf führt auf dem Host nur sichere statische Snapshot-Schritte
aus. Fremde Node-, Jekyll-, Hugo-, Hexo- und PHP-Projekte gehören ausschließlich
in den isolierten Container-Runner. Details:
[`outputs/VIBEBENCH_ISOLATED_RUNNER_README.md`](outputs/VIBEBENCH_ISOLATED_RUNNER_README.md).

## Produkt-Richtung

Die erste Web-App nimmt eine öffentliche URL entgegen und zeigt getrennt:

1. direkte Builder-Indikatoren,
2. allgemeine AI-/Vibe-Coding-Wahrscheinlichkeit,
3. Unsicherheit und Datenqualität,
4. die wichtigsten beobachteten technischen Signale.

Sie zeigt bewusst noch keinen Prozentwert. Vor einem öffentlichen
Wahrscheinlichkeitswert fehlen ein eingefrorener Blind-Holdout, belastbare
Kalibrierung und mehr builderunabhängige Ground Truth.

## Nächste To-dos

1. Eigenständiges Repository `ThorfinnThor/VibeBench` veröffentlichen.
2. Web-App über das neue Repository auf Vercel deployen.
3. Live-Scanner mit bekannten AI-, Human- und nicht erreichbaren URLs testen.
4. Einen zeitlich späteren Blind-Holdout einfrieren und Kalibrierung messen.
5. Erst danach einen modellbasierten Wahrscheinlichkeitswert ergänzen.
