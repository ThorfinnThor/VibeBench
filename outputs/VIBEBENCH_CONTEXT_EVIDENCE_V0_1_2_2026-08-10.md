# VibeBench context evidence update v0.1.2

Stand: 2026-08-10

## Änderung

Die Oberfläche zeigt zwei zusätzliche, rein technische Kontextsignale:

- `Google Frontend response`, wenn `Server: Google Frontend` zusammen mit
  einem Google-`via`-Header beobachtet wird;
- `Replit-hosted resource`, wenn HTML oder ein begrenzt geprüftes
  Same-Origin-Asset eine `*.replit.app`-Ressource verlinkt.

Diese Signale sind keine Builder-Evidenz. Eine Website kann Google- oder
Replit-Infrastruktur verwenden, ohne mit Replit Agent erzeugt worden zu sein.
Darum bleiben beide Signale in der Kontextsektion, erzeugen keinen
`direct`-Treffer und verändern den Verdict nicht.

## Begründung

Im eingefrorenen Development-v0.2-Set trat die Google-Frontend-Kombination bei
6/10 dokumentierten Replit-Agent-Seiten und bei 0/20 modernen Human-Kontrollen
auf. Eine eingebettete `replit.app`-Ressource trat bei 1/10 Replit-Seiten auf.
Die Stichprobe reicht nicht, um daraus Builder-Attribution abzuleiten; sie
reicht aber, um die beobachtete Infrastruktur transparent anzuzeigen.

## Prüfung

- Unit-Tests sichern ab, dass beide Signale `context` bleiben.
- Der bestehende `direct`-/`indicative`-/`indeterminate`-Entscheidungsweg ist
  unverändert.
- Der abgeschlossene v0.1-Holdout wurde nicht erneut gescannt oder für diese
  Änderung verwendet.

## Nächste To-dos

1. Die neuen Kontextanzeigen nach dem Vercel-Deployment an mindestens einer
   dokumentierten Replit-Custom-Domain prüfen.
2. Portable v0.2-Features getrennt von diesen Hosting-Kontexten erforschen.
3. Vor einer Verdict-Änderung eine Kandidatenregel vorregistrieren und auf
   einem neuen Holdout bestätigen.

## Empfohlener nächster Schritt

Nach dem Push den Produktionsscan von `clearscribehq.com` prüfen. Erwartet wird
`Replit-hosted resource` als Kontext, aber weiterhin kein direkter
Replit-Agent-Treffer.
