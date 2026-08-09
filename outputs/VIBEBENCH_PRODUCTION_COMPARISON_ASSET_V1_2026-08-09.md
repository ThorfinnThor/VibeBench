# VibeBench production comparison: HTML-only vs. Asset v1

Stand: 2026-08-09  
Deployment: `f8052dd`  
Produktion: https://vibe-bench-cyan.vercel.app

## Ergebnis

Der neue begrenzte Same-Origin-Asset-Scan ist in Produktion aktiv und wurde mit
derselben Auswahl von 10 AI-Seiten und 10 Human-Kontrollen wie der Baseline
geprüft. Alle 20 Scans waren erfolgreich.

| Kennzahl | Baseline | Asset v1 | Veränderung |
|---|---:|---:|---:|
| Erfolgreiche Scans | 20 / 20 | 20 / 20 | unverändert |
| AI: direkte Evidenz | 5 / 10 | 5 / 10 | unverändert |
| AI: direkt oder indikativ | 6 / 10 | 6 / 10 | unverändert |
| AI: unbestimmt | 4 / 10 | 4 / 10 | unverändert |
| Human: direkt oder indikativ | 0 / 10 | 0 / 10 | unverändert |
| Human: unbestimmt | 10 / 10 | 10 / 10 | unverändert |
| Geprüfte Assets | — | 68 | +68 |
| Geprüfte Asset-Bytes | — | 5.969.859 | +5.969.859 |
| Asset-Fehler | — | 0 | 0 |
| Nach 300 KB gekürzte Assets | — | 8 | +8 |
| Mittlere beobachtete Scanzeit | 934 ms | 1.294 ms | +360 ms |

Die Scanzeit ist ein beobachteter Produktionswert und kein kontrollierter
Performance-Benchmark. Website- und Netzwerkzustand können zwischen den beiden
Läufen variieren.

## Was sich verbessert hat

- Der Scanner erkennt Stack-Signale nun auch in den begrenzten Asset-Präfixen.
- Die Bolt-Seiten zeigen dadurch mehr erklärbaren Kontext, unter anderem React,
  Tailwind CSS und Lucide, bleiben aber ohne Builder-Marker unbestimmt.
- Die Replit-Seite zeigt nun zusätzlich `Replit runtime`, bleibt jedoch ohne
  direkten Replit-Agent-Marker unbestimmt.
- Die 10 Human-Kontrollen erzeugten durch den tieferen Scan keine neuen direkten
  oder indikativen Treffer.
- Gekürzte Assets und Asset-Fehler sind sichtbar und damit auditierbar.

## Schlussfolgerung

Asset v1 erweitert die technische Beobachtung, ohne die Klassifikation künstlich
aggressiver zu machen. In dieser kleinen Stichprobe steigt die Erklärbarkeit,
während alle Urteile und die Trennung zwischen direkter Evidenz und Kontext
stabil bleiben. Das ist ein positives Sicherheits- und Qualitätsresultat, aber
noch keine allgemeine Accuracy-Aussage.

## Nächste To-dos

1. HTTP-Header als eigene sichtbare Kontextkategorie ergänzen.
2. Verlinkte Web-Manifeste sicher und größenbegrenzt prüfen.
3. Manifest-/Header-Signale ebenfalls zuerst auf den Human-Kontrollen testen.
4. Danach die Evaluation auf alle aktuell erreichbaren gelabelten URLs ausweiten.
5. Einen builderbalancierten, zeitlich späteren Blind-Holdout einfrieren.

## Empfohlener nächster Schritt

Als Nächstes Header- und Manifest-Kontext implementieren. Diese Signale müssen
weiterhin getrennt von direkten Builder-Artefakten angezeigt und getestet werden.
