# VibeBench asset evidence update

Stand: 2026-08-09  
Status: lokal implementiert und geprüft; Deployment nach Push

## Ziel

Der Produktions-Smoke-Test zeigte direkte Evidenz für Lovable und v0, aber
keine direkte Zuordnung der untersuchten Bolt- und Replit-Agent-Seiten. Dieser
Schritt prüft, ob relevante Builder-Marker außerhalb des initialen HTML in den
geladenen JavaScript- oder CSS-Dateien erhalten geblieben sind.

## Beobachtete Produktions-Assets

| Sample | Provenance | Beobachtete technische Oberfläche | Direkte Builder-Evidenz |
|---|---|---|---|
| `prilo.ai` | Bolt | Vite-Bundle `assets/index-*.js`; zusätzliche Analytics-Skripte | keine |
| `zingy-cannoli-9cacce.netlify.app` | Bolt | ein Vite-JS-Bundle, ein Same-Origin-CSS-Bundle, Netlify-Hosting | keine |
| `promptbuilder.cloud` | Bolt | Vite-Bundles, Supabase-Chunk | keine |
| `reaction-master-devthedev01.replit.app` | Replit Agent | Vite-Bundle, Replit-Hosting, Replit-Feedback-Widget | keine Agent-Evidenz |

Die fehlenden direkten Treffer werden daher nicht künstlich in positive
Zuordnungen umgewandelt. Vite, Netlify, Replit-Hosting, Replit-CDN,
StackBlitz oder WebContainer bleiben Kontextsignale. Ein direkter Treffer
erfordert weiterhin einen Builder-spezifischen Marker wie `made with Bolt`,
`bolt.new`, `replit-agent` oder `built with Replit Agent`.

## Implementierte Änderung

- Extraktion von höchstens vier Same-Origin-JS- und zwei Same-Origin-CSS-URLs.
- Parallel begrenzter Download von maximal 300 KB je Asset; größere Dateien
  werden nach dem Präfix abgebrochen und als gekürzt ausgewiesen.
- Erneute DNS-/Private-IP-Prüfung vor jedem Asset-Abruf.
- Blockierung fremder Assets, Cross-Origin-Weiterleitungen, Credentials und
  nicht unterstützter Protokolle.
- Builder- und Stack-Analyse über HTML, Header und geprüfte Asset-Präfixe.
- Kennzeichnung, ob direkte Evidenz von der Seite oder aus einem Asset stammt.
- Sichtbare Metriken für gescannte, gekürzte und fehlgeschlagene Assets.

## Tests

- ESLint: erfolgreich.
- Unit-Tests: 7/7 erfolgreich.
- Next.js-Produktionsbuild: erfolgreich.
- Bundle-Verifikation: erfolgreich.
- Git-Diff-Prüfung: erfolgreich.

## Erwartete Wirkung

Die vier untersuchten Bolt-/Replit-Samples bleiben nach aktuellem Kenntnisstand
voraussichtlich unbestimmt. Das ist kein Fehler: Ihre öffentlich sichtbaren
Deployments enthalten derzeit keine belastbare direkte Builder-Evidenz. Andere
Seiten können nun jedoch erkannt werden, wenn Builder-Marker nur im
Same-Origin-Bundle und nicht im initialen HTML stehen.

## Nächste To-dos

1. Änderung pushen und über Vercel deployen.
2. Den 20-URL-Smoke-Test gegen die neue Produktion erneut ausführen.
3. Vorher-/Nachher-Ergebnisse vergleichen; neue direkte Treffer einzeln prüfen.
4. HTTP-Header- und Manifest-Kontext transparent in der Oberfläche ausgeben.
5. Einen größeren, builderbalancierten Holdout aufbauen.

## Empfohlener nächster Schritt

Nach dem Push den Produktions-Smoke-Test erneut erfassen. Erst dessen Ergebnisse
entscheiden, ob weitere Marker ergänzt oder die betroffenen Seiten bewusst als
`indeterminate` dokumentiert werden.
