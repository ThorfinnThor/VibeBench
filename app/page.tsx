"use client";

import { CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Evidence = { type: string; label: string; strength: string; source?: string; marker?: string };
type TechnicalOutcome = { code: string; title: string; summary: string; action: string; retryable: boolean };
type ScoreBand = { id: string; label: string; shortLabel: string; summary: string };
type ScoreDriver = { feature: string; label: string; contribution: number; direction: "raises" | "lowers" };
type SecurityCheck = { id: string; title: string; status: "pass" | "warn" | "fail"; detail: string; action: string };
type Recommendation = { id: string; category: string; priority: "high" | "medium" | "low"; title: string; why: string; action: string };
type ScanResult = {
  ok: boolean;
  error?: string;
  technicalOutcome?: TechnicalOutcome;
  resolvedUrl?: string;
  httpStatus?: number;
  analyzedAt?: string;
  vibeScore?: { score: number; probability: number; band: ScoreBand; threshold: number; aboveValidatedThreshold: boolean; meaning: string; caveat: string };
  scoreDrivers?: { raises: ScoreDriver[]; lowers: ScoreDriver[] };
  security?: { score: number; checks: SecurityCheck[] };
  recommendations?: Recommendation[];
  model?: { version: string; independentHoldout: number; precision: number; recall: number; f1: number };
  directEvidence?: Evidence[];
  contextEvidence?: Evidence[];
  headerEvidence?: Evidence[];
  manifestEvidence?: Evidence[];
  stackSignals?: string[];
  structuralHints?: string[];
  metrics?: Record<string, number>;
  assetScan?: { candidates: number; fetched: number; errors: number; bytes: number; truncated: number };
  warning?: string;
};

const fallbackTechnicalOutcome: TechnicalOutcome = {
  code: "connection_failed",
  title: "Scan-Dienst nicht erreichbar",
  summary: "Die Website konnte gerade nicht vollständig untersucht werden. Es wurde kein Score erzeugt.",
  action: "URL und Verbindung prüfen und den Scan anschließend erneut starten.",
  retryable: true
};

const categories = [
  { id: "all", label: "Alle" },
  { id: "security", label: "Sicherheit" },
  { id: "design", label: "Design" },
  { id: "engineering", label: "Engineering" },
  { id: "accessibility", label: "Barrierefreiheit" },
  { id: "content", label: "Inhalt" }
];

const categoryLabels: Record<string, string> = {
  security: "Sicherheit",
  design: "Design",
  engineering: "Engineering",
  accessibility: "Barrierefreiheit",
  content: "Inhalt"
};

const priorityLabels = { high: "Zuerst lösen", medium: "Danach", low: "Optimierung" };
const metricLabels: Record<string, string> = {
  htmlBytes: "HTML-Größe", scriptTags: "Skripte", stylesheetLinks: "Stylesheets", inlineStyles: "Inline-Styles",
  dataAttributes: "Data-Attribute", forms: "Formulare", headings: "Überschriften", images: "Bilder",
  sameOriginAssets: "Geprüfte Assets", assetBytes: "Asset-Größe", assetFetchErrors: "Asset-Fehler", truncatedAssets: "Gekürzte Assets"
};

function ScoreRing({ score }: { score: number }) {
  return <div className="score-ring" style={{ "--score-angle": `${score * 3.6}deg` } as CSSProperties} aria-label={`${score} von 100`}>
    <div className="score-ring-inner"><strong>{score}</strong><span>von 100</span></div>
  </div>;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [category, setCategory] = useState("all");
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!result || !resultsRef.current) return;
    resultsRef.current.focus({ preventScroll: true });
    resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  const visibleRecommendations = useMemo(() => {
    const items = result?.recommendations || [];
    return category === "all" ? items : items.filter((item) => item.category === category);
  }, [category, result]);

  async function scan(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setCategory("all");
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(35_000)
      });
      const payload = await response.json().catch(() => null);
      setResult(payload?.ok === true || payload?.ok === false ? payload : { ok: false, technicalOutcome: fallbackTechnicalOutcome });
    } catch {
      setResult({ ok: false, technicalOutcome: fallbackTechnicalOutcome });
    } finally {
      setLoading(false);
    }
  }

  const technicalOutcome = result && !result.ok ? result.technicalOutcome || fallbackTechnicalOutcome : null;
  const score = result?.vibeScore?.score ?? 0;

  return <main id="top">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="VibeBench Startseite"><span className="brand-mark">V</span><span><strong>VibeBench</strong><small>Website Forensics</small></span></a>
      <nav aria-label="Seitennavigation"><a href="#scanner">Scan</a><a href="#method">So funktioniert es</a><span className="version">v0.4</span></nav>
    </header>

    <section className="hero" id="scanner">
      <div className="hero-copy">
        <p className="eyebrow">Validierter Website-Check</p>
        <h1>Wie viel <span>Vibe</span> steckt in deiner Website?</h1>
        <p className="lede">Erhalte einen verständlichen Score von 0 bis 100, erkenne öffentlich sichtbare Vibecoding-Muster und finde konkrete Schritte für mehr Sicherheit, Eigenständigkeit und Qualität.</p>
        <div className="validation-row" aria-label="Validierungskennzahlen">
          <div><strong>82,4 %</strong><span>Precision</span></div>
          <div><strong>85,7 %</strong><span>Recall</span></div>
          <div><strong>100</strong><span>unabhängige Holdout-Seiten</span></div>
        </div>
      </div>

      <form className="scan-panel" onSubmit={scan} aria-busy={loading}>
        <div className="scan-heading"><span>01</span><div><h2>Website analysieren</h2><p>Öffentliche URL eingeben – der Scan dauert meist wenige Sekunden.</p></div></div>
        <label htmlFor="url">Website-URL</label>
        <input id="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://deine-website.de" autoComplete="url" inputMode="url" required />
        <button disabled={loading}><span>{loading ? "Website wird untersucht …" : "Kostenlosen Scan starten"}</span><b aria-hidden="true">→</b></button>
        <p className="privacy-note"><span aria-hidden="true">✓</span> Nur öffentliche HTML- und Same-Origin-Assets. Keine Anmeldung, kein Quellcode-Zugriff.</p>
      </form>
    </section>

    <section className="score-explainer" aria-label="Erklärung der Skala">
      <div><strong>0–24</strong><span>Niedrig</span></div><i />
      <div><strong>25–49</strong><span>Leicht</span></div><i />
      <div><strong>50–69</strong><span>Mittel</span></div><i />
      <div><strong>70–84</strong><span>Hoch</span></div><i />
      <div><strong>85–100</strong><span>Sehr hoch</span></div>
      <p>Der Score misst sichtbare Ähnlichkeit – nicht, wie viel Prozent des Codes von AI geschrieben wurden.</p>
    </section>

    {result && <section className="results" aria-live="polite" ref={resultsRef} tabIndex={-1}>
      {!result.ok && technicalOutcome ? <div className="error-card">
        <span className="error-symbol" aria-hidden="true">!</span>
        <div><p className="eyebrow">Kein Ergebnis erzeugt</p><h2>{technicalOutcome.title}</h2><p>{technicalOutcome.summary}</p><p className="error-action"><strong>Nächster Schritt:</strong> {technicalOutcome.action}</p>{result.error && <details><summary>Technisches Detail</summary><code>{result.error}</code></details>}</div>
      </div> : result.ok && result.vibeScore && result.security ? <>
        <div className={`score-hero score-${result.vibeScore.band.id}`}>
          <ScoreRing score={score} />
          <div className="score-copy">
            <p className="eyebrow">Dein Vibe-Footprint</p>
            <h2>{result.vibeScore.band.label}</h2>
            <p>{result.vibeScore.band.summary}</p>
            <div className="score-boundary"><strong>Was das bedeutet</strong><span>{result.vibeScore.meaning} {result.vibeScore.caveat}</span></div>
          </div>
          <div className="score-snapshot">
            <p>Scan-Überblick</p>
            <div><span>Sicherheits-Baseline</span><strong>{result.security.score}<small>/100</small></strong></div>
            <div><span>Direkte Builder-Marker</span><strong>{result.directEvidence?.length || 0}</strong></div>
            <div><span>Erkannte Stack-Signale</span><strong>{result.stackSignals?.length || 0}</strong></div>
          </div>
        </div>

        <div className="score-scale" aria-label={`Score ${score} auf einer Skala von 0 bis 100`}>
          <div className="scale-labels"><span>Niedriger Footprint</span><strong>{score}/100</strong><span>Sehr hoher Footprint</span></div>
          <div className="scale-track"><i style={{ width: `${score}%` }} /><b style={{ left: `${score}%` }} /></div>
        </div>

        <section className="drivers-section">
          <div className="section-heading"><div><p className="eyebrow">Score verständlich gemacht</p><h2>Was beeinflusst das Ergebnis?</h2></div><p>Das Modell kombiniert viele sichtbare Merkmale. Einzelne Frameworks sind kein Beweis – entscheidend ist das gemeinsame Muster.</p></div>
          <div className="drivers-grid">
            <article><div className="driver-title raises"><span>↑</span><div><strong>Erhöht den Score</strong><small>stärkere Ähnlichkeit</small></div></div>
              {result.scoreDrivers?.raises.length ? <ul>{result.scoreDrivers.raises.map((driver) => <li key={driver.feature}><span>{driver.label}</span><b>+{Math.abs(driver.contribution).toFixed(2)}</b></li>)}</ul> : <p className="empty-state">Keine einzelnen starken positiven Treiber sichtbar.</p>}
            </article>
            <article><div className="driver-title lowers"><span>↓</span><div><strong>Senkt den Score</strong><small>geringere Ähnlichkeit</small></div></div>
              {result.scoreDrivers?.lowers.length ? <ul>{result.scoreDrivers.lowers.map((driver) => <li key={driver.feature}><span>{driver.label}</span><b>−{Math.abs(driver.contribution).toFixed(2)}</b></li>)}</ul> : <p className="empty-state">Keine einzelnen starken negativen Treiber sichtbar.</p>}
            </article>
          </div>
        </section>

        <section className="recommendations-section">
          <div className="section-heading"><div><p className="eyebrow">Konkreter Verbesserungsplan</p><h2>Was du jetzt verbessern solltest</h2></div><p>Priorisiert nach Wirkung. Arbeite die ersten Punkte ab und scanne die Website danach erneut.</p></div>
          <div className="filter-row" role="group" aria-label="Empfehlungen filtern">{categories.map((item) => <button key={item.id} type="button" className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}>{item.label}<span>{item.id === "all" ? result.recommendations?.length || 0 : result.recommendations?.filter((recommendation) => recommendation.category === item.id).length || 0}</span></button>)}</div>
          <div className="recommendation-list">{visibleRecommendations.length ? visibleRecommendations.map((item, index) => <article key={item.id}>
            <div className={`priority priority-${item.priority}`}><span>{String(index + 1).padStart(2, "0")}</span><b>{priorityLabels[item.priority]}</b></div>
            <div className="recommendation-copy"><p>{categoryLabels[item.category] || item.category}</p><h3>{item.title}</h3><span>{item.why}</span></div>
            <div className="recommendation-action"><small>So setzt du es um</small><p>{item.action}</p></div>
          </article>) : <p className="empty-filter">Für diesen Bereich gibt es aktuell keine eigene Empfehlung.</p>}</div>
        </section>

        <section className="security-section">
          <div className="security-score"><p className="eyebrow">Security-Baseline</p><strong>{result.security.score}<span>/100</span></strong><h2>Öffentlich sichtbarer Headerschutz</h2><p>Eine schnelle Baseline – kein vollständiger Penetrationstest.</p></div>
          <div className="security-checks">{result.security.checks.map((check) => <details key={check.id} className={`security-${check.status}`}>
            <summary><span aria-hidden="true">{check.status === "pass" ? "✓" : check.status === "warn" ? "!" : "×"}</span><strong>{check.title}</strong><small>{check.status === "pass" ? "Vorhanden" : check.status === "warn" ? "Prüfen" : "Fehlt"}</small></summary>
            <p>{check.detail}</p>{check.status !== "pass" && <p><b>Empfehlung:</b> {check.action}</p>}
          </details>)}</div>
        </section>

        <details className="technical-details">
          <summary><span><strong>Technische Evidenz ansehen</strong><small>Builder-Marker, Stack, Messwerte und Scan-Metadaten</small></span><b>+</b></summary>
          <div className="technical-grid">
            <article><h3>Direkte Marker</h3>{result.directEvidence?.length ? <ul>{result.directEvidence.map((item) => <li key={`${item.label}-${item.marker}`}>{item.label}{item.marker ? <small>{item.marker}</small> : null}</li>)}</ul> : <p>Keine direkten Builder-Marker gefunden.</p>}</article>
            <article><h3>Stack & Kontext</h3>{[...(result.stackSignals || []), ...(result.contextEvidence || []).map((item) => item.label)].length ? <ul>{[...(result.stackSignals || []), ...(result.contextEvidence || []).map((item) => item.label)].map((label) => <li key={label}>{label}</li>)}</ul> : <p>Keine bekannten Stack-Signale sichtbar.</p>}</article>
            <article><h3>Strukturwerte</h3><dl>{Object.entries(result.metrics || {}).map(([key, value]) => <div key={key}><dt>{metricLabels[key] || key}</dt><dd>{value.toLocaleString("de-DE")}</dd></div>)}</dl></article>
            <article><h3>Scan</h3><dl><div><dt>HTTP</dt><dd>{result.httpStatus}</dd></div><div><dt>Assets</dt><dd>{result.assetScan?.fetched || 0}/{result.assetScan?.candidates || 0}</dd></div><div><dt>Modell</dt><dd>{result.model?.version || "v0.4"}</dd></div><div><dt>Zeitpunkt</dt><dd>{result.analyzedAt ? new Date(result.analyzedAt).toLocaleString("de-DE") : "—"}</dd></div></dl></article>
          </div>
          <a className="resolved-url" href={result.resolvedUrl} target="_blank" rel="noreferrer">{result.resolvedUrl} ↗</a>
        </details>

        <p className="warning"><strong>Wichtige Grenze:</strong> {result.warning}</p>
      </> : null}
    </section>}

    <section className="method" id="method">
      <div className="section-heading"><div><p className="eyebrow">So funktioniert VibeBench</p><h2>Von sichtbaren Mustern zu klaren nächsten Schritten.</h2></div><p>Der Scan untersucht nur das, was eine öffentliche Website ausliefert. Kein Login, kein Repository und kein privater Quellcode werden benötigt.</p></div>
      <div className="method-grid">
        <article><span>01</span><h3>Öffentliche Oberfläche scannen</h3><p>HTML, Response-Header und eine begrenzte Auswahl gleich-originiger Skripte und Stylesheets.</p></article>
        <article><span>02</span><h3>Muster mit v0.4 bewerten</h3><p>Das Modell kombiniert technische, strukturelle und Builder-nahe Signale zu einem Score von 0 bis 100.</p></article>
        <article><span>03</span><h3>Risiken priorisieren</h3><p>Security-, Design-, Engineering- und Accessibility-Maßnahmen werden nach Wirkung geordnet.</p></article>
      </div>
      <div className="method-note"><strong>Unabhängig geprüft</strong><p>Das eingefrorene v0.4-Modell erreichte auf 100 zuvor ungesehenen Websites 82,4 % Precision und 85,7 % Recall. Das ist ein belastbarer Benchmark, aber keine Garantie für jede einzelne Website.</p></div>
    </section>

    <footer><a className="brand footer-brand" href="#top"><span className="brand-mark">V</span><span><strong>VibeBench</strong><small>Website Forensics</small></span></a><p>Vibe-Footprint & Security-Baseline · v0.4</p><a href="https://github.com/ThorfinnThor/VibeBench" target="_blank" rel="noreferrer">GitHub ↗</a></footer>
  </main>;
}
