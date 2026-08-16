"use client";

import { CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { parseScanPayload } from "../lib/scan-contract.mjs";
import release from "../release/v0.4.json";

type Evidence = { type: string; label: string; strength: string; source?: string; marker?: string };
type TechnicalOutcome = { code: string; title: string; summary: string; action: string; retryable: boolean };
type ScoreBand = { id: string; label: string; shortLabel: string; summary: string };
type ScoreDriver = { feature: string; label: string; description: string; contribution: number; direction: "raises" | "lowers"; state: "detected" | "not-detected" | "measured"; unit: string };
type SecurityCheck = { id: string; title: string; status: "pass" | "warn" | "fail"; detail: string; action: string };
type Recommendation = { id: string; category: string; priority: "high" | "medium" | "low"; title: string; why: string; action: string; basis: "observed" | "guidance" };
type EvidenceCoverage = { level: "broad" | "standard" | "limited"; label: string; summary: string; affectsScore: false; scope: { html: string; assetsDiscovered: number; assetsSelected: number; assetCandidates: number; assetsFetched: number; assetErrors: number; truncatedAssets: number; manifestLinked: boolean; manifestFetched: boolean } };
type ScanResult = {
  apiVersion: string;
  ok: boolean;
  requestId?: string;
  error?: string;
  technicalOutcome?: TechnicalOutcome;
  resolvedUrl?: string;
  httpStatus?: number;
  analyzedAt?: string;
  vibeScore?: { score: number; probability: number; band: ScoreBand; threshold: number; aboveValidatedThreshold: boolean; meaning: string; caveat: string };
  scoreDrivers?: { raises: ScoreDriver[]; lowers: ScoreDriver[]; unit: string; baseLogit: number };
  evidenceCoverage?: EvidenceCoverage;
  security?: { score: number; checks: SecurityCheck[] };
  recommendations?: Recommendation[];
  model?: { version: string; independentHoldout: number; precision: number; recall: number; f1: number; confirmationStatus?: string; performanceClaimCurrent?: boolean };
  directEvidence?: Evidence[];
  directBuilderCount?: number;
  contextEvidence?: Evidence[];
  headerEvidence?: Evidence[];
  manifestEvidence?: Evidence[];
  stackSignals?: string[];
  structuralHints?: string[];
  metrics?: Record<string, number>;
  assetScan?: { discovered: number; selected: number; ignoredByCap: number; candidates: number; fetched: number; errors: number; bytes: number; truncated: number };
  warning?: string;
};

type Language = "en" | "de";

const copyByLanguage = {
  en: {
    home: "VibeFootprint home", subtitle: "Website intelligence", scan: "Scan", methodology: "Methodology", beta: "Research Beta",
    heroEyebrow: "Evidence-led website review", heroTitle: <>How much <span>vibe</span> is in your website?</>,
    heroLede: "Get a clear 0–100 footprint, understand the public patterns behind it, and turn the findings into practical security, quality and originality improvements.",
    heroTrust: "Transparent beta model · qualitative orientation with an explicit uncertainty boundary",
    scanTitle: "Analyze a website", scanDescription: "Enter a public URL — most scans finish in a few seconds.", urlLabel: "Website URL", placeholder: "https://your-website.com", startScan: "Start free scan", scanning: "Scanning website …", cancel: "Cancel",
    privacy: "Bounded, peer-pinned GET requests for public HTML and same-origin assets. The target site may log these requests. No login or private source code.",
    low: "Low", light: "Light", medium: "Medium", high: "High", veryHigh: "Very high",
    scaleNote: <>This is an uncalibrated qualitative similarity index — not an AI probability or a percentage of AI-generated code. <a href="#method">Read the methodology</a></>,
    results: "Scan results", previous: "Previous result for", newScan: "A new analysis for", noResult: "No new result created", previousKept: "Previous result remains available", yourFootprint: "Your Vibe-Footprint", analyzed: "Analyzed", whatItMeans: "What this means", seeMethod: "See methodology", scanOverview: "Scan overview", breadth: "Evidence breadth", securityBaseline: "Security baseline", directMarkers: "Direct markers", uniqueBuilders: "Unique builders", noBonus: "No separate score bonus or penalty",
    indexExplained: "Index explained", driversTitle: "What shapes the result?", driversDescription: "Only signals actually observed on the public surface appear here. Order shows relative model influence, not points on the 0–100 scale.", raises: "Raises the score", strongerSimilarity: "stronger similarity", lowers: "Lowers the score", lowerSimilarity: "lower similarity", noPositive: "No individual positive drivers are visible.", noNegative: "No individual negative drivers are visible.",
    improvementEyebrow: "Practical improvement plan", improvementTitle: "What to improve next", improvementDescription: "Prioritized by likely impact. Address the first items, then scan again.", observed: "Observed findings", guidance: "Optional manual checks", doFirst: "Do first", doNext: "Next", optimize: "Optimize", implement: "How to implement", manualCheck: "Manual check", healthy: "No high-confidence issue was found in this area.", noFilter: "This filter has no observed finding or general guidance.",
    security: "Security baseline", headerProtection: "Publicly visible header protection", securityDescription: "Value-based checks of selected main-document headers — not a full penetration test.", limits: "See limits", effective: "Effective", review: "Review", missing: "Missing / ineffective",
    technical: "View technical evidence", technicalDescription: "Builder markers, stack signals, measurements and scan metadata", directEvidence: "Direct markers", noDirect: "No direct builder markers found.", stackContext: "Stack & context", noStack: "No known stack or context signals were visible.", structural: "Structure values", hints: "Hints", loaded: "Assets loaded", selected: "selected", found: "Assets found", model: "Model", time: "Time", viewUrl: "Open resolved URL", importantLimit: "Important boundary", dataProtection: "Data and operation", methodEyebrow: "How VibeFootprint works", methodTitle: "A visible footprint, turned into useful next steps.", methodDescription: "We inspect only what a public website delivers. No login, repository or private source code is required.", methodOneTitle: "Inspect the public surface", methodOneText: "HTML, response headers and a bounded selection of same-origin assets over validated, peer-pinned connections.", methodTwoTitle: "Score visible patterns", methodTwoText: "The frozen model combines public technical and structural signals into an uncalibrated 0–100 similarity index.", methodThreeTitle: "Separate evidence from advice", methodThreeText: "Observed findings stay distinct from optional manual guidance and are ordered by impact.", proofTitle: "Designed for a clear decision", proofText: "Use the footprint to see where a site looks generic, where it needs hardening, and what to improve next — without pretending to know who authored it.", proofPublic: "Public surface only", proofScore: "0–100 qualitative index", proofSecurity: "Separate security baseline", proofPrivacy: "No source access required", footerLine: "Vibe-Footprint & Security-Baseline · Research Beta", backToMethod: "Methodology & limits ↑"
  },
  de: {
    home: "VibeFootprint Startseite", subtitle: "Website-Intelligenz", scan: "Scan", methodology: "Methodik", beta: "Research-Beta", heroEyebrow: "Evidenzbasierte Website-Prüfung", heroTitle: <>Wie viel <span>Vibe</span> steckt in deiner Website?</>, heroLede: "Erhalte einen verständlichen Score von 0 bis 100, erkenne öffentlich sichtbare Muster und finde konkrete Schritte für mehr Sicherheit, Qualität und Eigenständigkeit.", heroTrust: "Transparentes Beta-Modell · qualitative Orientierung mit klarer Unsicherheitsgrenze", scanTitle: "Website analysieren", scanDescription: "Öffentliche URL eingeben – der Scan dauert meist wenige Sekunden.", urlLabel: "Website-URL", placeholder: "https://deine-website.de", startScan: "Kostenlosen Scan starten", scanning: "Website wird untersucht …", cancel: "Abbrechen", privacy: "Begrenzte, IP-gepinnte GET-Abrufe von öffentlichem HTML und gleich-originigen Assets. Die Zielseite kann diese Abrufe protokollieren. Keine Anmeldung, kein privater Quellcode.", low: "Niedrig", light: "Leicht", medium: "Mittel", high: "Hoch", veryHigh: "Sehr hoch", scaleNote: <>Der Index ist eine unkalibrierte, qualitative Ähnlichkeitsorientierung – keine AI-Wahrscheinlichkeit und kein Prozentanteil AI-generierten Codes. <a href="#method">Methodik und Grenzen</a></>, results: "Scan-Ergebnisse", previous: "Vorheriges Ergebnis für", newScan: "Neue Analyse für", noResult: "Kein neues Ergebnis erzeugt", previousKept: "Vorheriges Ergebnis bleibt erhalten", yourFootprint: "Dein Vibe-Footprint", analyzed: "Analysiert", whatItMeans: "Was das bedeutet", seeMethod: "Methodik ansehen", scanOverview: "Scan-Überblick", breadth: "Auswertungsbreite", securityBaseline: "Sicherheits-Baseline", directMarkers: "Direkte Marker", uniqueBuilders: "Eindeutige Builder", noBonus: "Kein separater Bonus oder Abzug", indexExplained: "Index verständlich gemacht", driversTitle: "Was beeinflusst das Ergebnis?", driversDescription: "Nur tatsächlich erkannte Binärsignale erscheinen hier. Die Reihenfolge zeigt relative Modellwirkung, keine Punkte auf der 0–100-Skala.", raises: "Erhöht den Score", strongerSimilarity: "stärkere Ähnlichkeit", lowers: "Senkt den Score", lowerSimilarity: "geringere Ähnlichkeit", noPositive: "Keine einzelnen positiven Treiber sichtbar.", noNegative: "Keine einzelnen negativen Treiber sichtbar.", improvementEyebrow: "Konkreter Verbesserungsplan", improvementTitle: "Was du jetzt verbessern solltest", improvementDescription: "Priorisiert nach Wirkung. Arbeite die ersten Punkte ab und scanne die Website danach erneut.", observed: "Beobachtete Hinweise", guidance: "Optionale manuelle Prüfungen", doFirst: "Zuerst lösen", doNext: "Danach", optimize: "Optimierung", implement: "So setzt du es um", manualCheck: "Manuell prüfen", healthy: "Keine hochkonfidenten Probleme in diesem Bereich erkannt.", noFilter: "Für diesen Filter gibt es weder ein beobachtetes Finding noch allgemeine Guidance.", security: "Security-Baseline", headerProtection: "Öffentlich sichtbarer Headerschutz", securityDescription: "Wertbezogene Prüfung ausgewählter Hauptdokument-Header – kein vollständiger Penetrationstest.", limits: "Grenzen ansehen", effective: "Wirksam", review: "Prüfen", missing: "Fehlt/Unwirksam", technical: "Technische Evidenz ansehen", technicalDescription: "Builder-Marker, Stack, Messwerte und Scan-Metadaten", directEvidence: "Direkte Marker", noDirect: "Keine direkten Builder-Marker gefunden.", stackContext: "Stack & Kontext", noStack: "Keine bekannten Stack- oder Kontextsignale sichtbar.", structural: "Strukturwerte", hints: "Hinweise", loaded: "Assets geladen", selected: "ausgewählt", found: "Assets gefunden", model: "Modell", time: "Zeitpunkt", viewUrl: "Aufgelöste URL öffnen", importantLimit: "Wichtige Grenze", dataProtection: "Datenschutz und Betrieb", methodEyebrow: "So funktioniert VibeFootprint", methodTitle: "Von sichtbaren Mustern zu klaren nächsten Schritten.", methodDescription: "Der Scan untersucht nur das, was eine öffentliche Website ausliefert. Kein Login, kein Repository und kein privater Quellcode werden benötigt.", methodOneTitle: "Öffentliche Oberfläche scannen", methodOneText: "HTML, Response-Header und eine begrenzte Auswahl gleich-originiger Skripte und Stylesheets über geprüfte, IP-gepinnte Verbindungen.", methodTwoTitle: "Sichtbare Muster bewerten", methodTwoText: "Das eingefrorene Modell kombiniert öffentlich sichtbare technische und strukturelle Signale zu einem unkalibrierten Ähnlichkeitsindex von 0 bis 100.", methodThreeTitle: "Evidenz und Hinweise trennen", methodThreeText: "Beobachtete Findings bleiben von optionaler manueller Guidance getrennt und werden nach Wirkung geordnet.", proofTitle: "Für klare Entscheidungen gebaut", proofText: "Nutze den Footprint, um generische Stellen, Härtungsbedarf und nächste Verbesserungen zu erkennen – ohne vorzugeben, wer die Website erstellt hat.", proofPublic: "Nur öffentliche Oberfläche", proofScore: "Qualitativer Index 0–100", proofSecurity: "Separate Security-Baseline", proofPrivacy: "Kein Quellcodezugriff nötig", footerLine: "Vibe-Footprint & Security-Baseline · Research-Beta", backToMethod: "Methodik & Grenzen ↑"
  }
} as const;

const fallbackTechnicalOutcome: TechnicalOutcome = {
  code: "connection_failed",
  title: "Scan-Dienst nicht erreichbar",
  summary: "Die Website konnte gerade nicht vollständig untersucht werden. Es wurde kein Score erzeugt.",
  action: "URL und Verbindung prüfen und den Scan anschließend erneut starten.",
  retryable: true
};

const incompatibleTechnicalOutcome: TechnicalOutcome = {
  code: "incompatible_response",
  title: "Antwort nicht kompatibel",
  summary: "Der Scan-Dienst hat keine vollständig auswertbare Antwort geliefert. Es wurde kein neues Ergebnis übernommen.",
  action: "Seite neu laden und den Scan erneut starten.",
  retryable: true
};

const cancelledTechnicalOutcome: TechnicalOutcome = {
  code: "scan_cancelled",
  title: "Scan abgebrochen",
  summary: "Der laufende Scan wurde beendet. Ein vorheriges Ergebnis bleibt sichtbar.",
  action: "Den Scan erneut starten, wenn du fortfahren möchtest.",
  retryable: true
};

const clientTimeoutTechnicalOutcome: TechnicalOutcome = {
  code: "client_timeout",
  title: "Scan-Zeitlimit erreicht",
  summary: "Der vollständige Scan konnte nicht innerhalb des gemeinsamen Zeitbudgets abgeschlossen werden. Es wurde kein neues Ergebnis übernommen.",
  action: "Später erneut versuchen oder eine direktere Ziel-URL verwenden.",
  retryable: true
};

const categoryIds = ["all", "security", "design", "engineering", "accessibility", "content"] as const;
const categoryLabelsByLanguage = {
  en: { all: "All", security: "Security", design: "Design", engineering: "Engineering", accessibility: "Accessibility", content: "Content" },
  de: { all: "Alle", security: "Sicherheit", design: "Design", engineering: "Engineering", accessibility: "Barrierefreiheit", content: "Inhalt" }
} as const;
const priorityLabelsByLanguage = {
  en: { high: "Do first", medium: "Next", low: "Optimize" },
  de: { high: "Zuerst lösen", medium: "Danach", low: "Optimierung" }
} as const;
const metricLabels: Record<string, string> = {
  htmlBytes: "HTML-Größe", scriptTags: "Skripte", stylesheetLinks: "Stylesheets", inlineStyles: "Inline-Styles",
  dataAttributes: "Data-Attribute", forms: "Formulare", headings: "Überschriften", images: "Bilder",
  sameOriginAssets: "Geprüfte Assets", assetBytes: "Asset-Größe", assetFetchErrors: "Asset-Fehler", truncatedAssets: "Gekürzte Assets"
};

const structuralHintLabels: Record<string, string> = {
  "dense-modern-stack": "viele moderne Stack-Signale",
  "high-data-attribute-density": "hohe Dichte strukturierter Data-Attribute",
  "script-heavy-static-shell": "skriptlastige Oberfläche ohne Formularstruktur"
};

function formatMetric(key: string, value: number) {
  if (["htmlBytes", "assetBytes"].includes(key)) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} MB`;
    if (value >= 1_000) return `${(value / 1_000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} KB`;
    return `${value.toLocaleString("de-DE")} B`;
  }
  return value.toLocaleString("de-DE");
}

function ScoreRing({ score, language }: { score: number; language: Language }) {
  const label = language === "en" ? "out of 100" : "von 100";
  return <div className="score-ring" style={{ "--score-angle": `${score * 3.6}deg` } as CSSProperties} aria-label={`${score} ${label}`}>
    <div className="score-ring-inner"><strong>{score}</strong><span>{label}</span></div>
  </div>;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorResult, setErrorResult] = useState<ScanResult | null>(null);
  const [category, setCategory] = useState("all");
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem("vibefootprint-language");
    return saved === "de" ? "de" : "en";
  });
  const resultsRef = useRef<HTMLElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const scanSequenceRef = useRef(0);
  const loadingRef = useRef(false);
  const copy = copyByLanguage[language];
  const categories = categoryIds.map((id) => ({ id, label: categoryLabelsByLanguage[language][id] }));
  const categoryLabels: Record<string, string> = categoryLabelsByLanguage[language];
  const priorityLabels = priorityLabelsByLanguage[language];

  function changeLanguage(next: Language) {
    setLanguage(next);
    window.localStorage.setItem("vibefootprint-language", next);
  }

  useEffect(() => {
    if ((!result && !errorResult) || !resultsRef.current) return;
    resultsRef.current.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultsRef.current.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [result, errorResult]);

  const visibleRecommendations = useMemo(() => {
    const items = result?.recommendations || [];
    return category === "all" ? items : items.filter((item) => item.category === category);
  }, [category, result]);

  async function runScan() {
    const requestedUrl = url.trim();
    const sequence = ++scanSequenceRef.current;
    controllerRef.current?.abort("superseded");
    const controller = new AbortController();
    controllerRef.current = controller;
    loadingRef.current = true;
    setLoading(true);
    setPendingUrl(requestedUrl);
    setErrorResult(null);
    setCategory("all");
    const timeout = window.setTimeout(() => controller.abort("client-timeout"), 19_000);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: requestedUrl }),
        signal: controller.signal
      });
      const responseRequestId = response.headers.get("x-vibebench-request-id") || undefined;
      const payload = await response.json().catch(() => null);
      const parsed = parseScanPayload(payload) as ScanResult | null;
      if (sequence !== scanSequenceRef.current) return;
      if (!parsed) setErrorResult({ apiVersion: release.apiVersion, ok: false, requestId: responseRequestId, technicalOutcome: incompatibleTechnicalOutcome });
      else if (parsed.ok) setResult(parsed);
      else setErrorResult(parsed);
    } catch {
      if (sequence !== scanSequenceRef.current) return;
      const outcome = controller.signal.aborted
        ? controller.signal.reason === "client-timeout" ? clientTimeoutTechnicalOutcome : cancelledTechnicalOutcome
        : fallbackTechnicalOutcome;
      setErrorResult({ apiVersion: release.apiVersion, ok: false, technicalOutcome: outcome });
    } finally {
      window.clearTimeout(timeout);
      if (sequence === scanSequenceRef.current && controllerRef.current === controller) {
        controllerRef.current = null;
        loadingRef.current = false;
        setLoading(false);
        setPendingUrl(null);
      }
    }
  }

  function scan(event: FormEvent) {
    event.preventDefault();
    if (loadingRef.current) return;
    void runScan();
  }

  function cancelScan() {
    controllerRef.current?.abort("user-cancelled");
  }

  const technicalOutcome = errorResult?.technicalOutcome || null;
  const score = result?.vibeScore?.score ?? 0;
  const observedRecommendations = visibleRecommendations.filter((item) => item.basis !== "guidance");
  const guidanceRecommendations = visibleRecommendations.filter((item) => item.basis === "guidance");
  const resultHost = result?.resolvedUrl ? new URL(result.resolvedUrl).hostname : null;

  return <main id="top">
    <a className="skip-link" href="#scanner">{language === "en" ? "Skip to website scan" : "Direkt zum Website-Scan"}</a>
    <p className="sr-only" role="status" aria-live="polite">{loading ? copy.scanning : errorResult ? technicalOutcome?.title : result ? copy.results : ""}</p>
    <header className="topbar">
      <a className="brand" href="#top" aria-label={copy.home}><span className="brand-mark">V</span><span><strong>VibeFootprint</strong><small>{copy.subtitle}</small></span></a>
      <nav aria-label={language === "en" ? "Primary navigation" : "Seitennavigation"}><a href="#scanner">{copy.scan}</a><a className="method-link" href="#method">{copy.methodology}</a><span className="version">{copy.beta}</span><div className="language-switcher" role="group" aria-label="Language"><button type="button" className={language === "en" ? "active" : ""} onClick={() => changeLanguage("en")} aria-pressed={language === "en"}>🇬🇧 <span>EN</span></button><button type="button" className={language === "de" ? "active" : ""} onClick={() => changeLanguage("de")} aria-pressed={language === "de"}>🇩🇪 <span>DE</span></button></div></nav>
    </header>

    <section className="hero" id="scanner" tabIndex={-1}>
      <div className="hero-copy">
        <p className="eyebrow">{copy.heroEyebrow}</p>
        <h1>{copy.heroTitle}</h1>
        <p className="lede">{copy.heroLede}</p>
        <p className="hero-trust"><span aria-hidden="true">✓</span> {copy.heroTrust}</p>
      </div>

      <form className="scan-panel" onSubmit={scan} aria-busy={loading}>
        <div className="scan-heading"><span>01</span><div><h2>{copy.scanTitle}</h2><p>{copy.scanDescription}</p></div></div>
        <label htmlFor="url">{copy.urlLabel}</label>
        <input id="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder={copy.placeholder} autoComplete="url" inputMode="url" required />
        <div className="scan-actions"><button disabled={loading}><span>{loading ? copy.scanning : copy.startScan}</span><b aria-hidden="true">→</b></button>{loading && <button className="cancel-button" type="button" onClick={cancelScan}>{copy.cancel}</button>}</div>
        <p className="privacy-note"><span aria-hidden="true">✓</span> {copy.privacy}</p>
      </form>
    </section>

    <section className="score-explainer" aria-label={language === "en" ? "Score scale explanation" : "Erklärung der Skala"}>
      <div><strong>0–24</strong><span>{copy.low}</span></div><i />
      <div><strong>25–49</strong><span>{copy.light}</span></div><i />
      <div><strong>50–69</strong><span>{copy.medium}</span></div><i />
      <div><strong>70–84</strong><span>{copy.high}</span></div><i />
      <div><strong>85–100</strong><span>{copy.veryHigh}</span></div>
      <p>{copy.scaleNote}</p>
    </section>

    {(result || errorResult) && <section className="results" aria-label={copy.results} ref={resultsRef} tabIndex={-1}>
      {loading && resultHost && <aside className="stale-note"><strong>{copy.previous} {resultHost}</strong><span>{copy.newScan} {pendingUrl} …</span></aside>}
      {errorResult && technicalOutcome ? <div className="error-card">
        <span className="error-symbol" aria-hidden="true">!</span>
        <div><p className="eyebrow">{resultHost ? `${copy.previous} ${resultHost} · ${copy.previousKept}` : copy.noResult}</p><h2>{technicalOutcome.title}</h2><p>{technicalOutcome.summary}</p><p className="error-action"><strong>{language === "en" ? "Next step:" : "Nächster Schritt:"}</strong> {technicalOutcome.action}</p>{technicalOutcome.retryable && <button className="retry-button" type="button" onClick={() => void runScan()} disabled={loading}>{language === "en" ? "Try again" : "Erneut versuchen"}</button>}{errorResult.requestId && <p className="request-id">Request-ID: <code>{errorResult.requestId}</code></p>}</div>
      </div> : null}
      {result?.ok && result.vibeScore && result.security ? <>
        <div className={`score-hero score-${result.vibeScore.band.id}`}>
          <ScoreRing score={score} language={language} />
          <div className="score-copy">
            <p className="eyebrow">{copy.yourFootprint}</p>
            <h2>{result.vibeScore.band.label}</h2>
            {resultHost && <p className="result-target">{copy.analyzed}: <strong>{resultHost}</strong></p>}
            <p>{result.vibeScore.band.summary}</p>
            <div className="score-boundary"><strong>{copy.whatItMeans}</strong><span>{result.vibeScore.meaning} {result.vibeScore.caveat} <a href="#method">{copy.seeMethod}</a></span></div>
          </div>
          <div className="score-snapshot">
            <p>{copy.scanOverview}</p>
            <div><span>{copy.breadth}</span><strong className={`coverage-${result.evidenceCoverage?.level || "standard"}`}>{result.evidenceCoverage?.label || "Standard"}</strong></div>
            <div><span>{copy.securityBaseline}</span><strong>{result.security.score}<small>/100</small></strong></div>
            <div><span>{copy.directMarkers}</span><strong>{result.directEvidence?.length || 0}</strong></div>
            <div><span>{copy.uniqueBuilders}</span><strong>{result.directBuilderCount ?? new Set(result.directEvidence?.map((item) => item.label)).size}</strong></div>
          </div>
        </div>

        {result.evidenceCoverage && <aside className={`coverage-note coverage-${result.evidenceCoverage.level}`}><div><strong>{copy.breadth}: {result.evidenceCoverage.label}</strong><p>{result.evidenceCoverage.summary}</p></div><span>{copy.noBonus}</span></aside>}

        <div className="score-scale" aria-label={`Score ${score} auf einer Skala von 0 bis 100`}>
          <div className="scale-labels"><span>{language === "en" ? "Lower footprint" : "Niedriger Footprint"}</span><strong>{score}/100</strong><span>{language === "en" ? "Very high footprint" : "Sehr hoher Footprint"}</span></div>
          <div className="scale-track"><i style={{ width: `${score}%` }} /><b style={{ left: `${score}%` }} /></div>
        </div>

        <section className="drivers-section">
          <div className="section-heading"><div><p className="eyebrow">{copy.indexExplained}</p><h2>{copy.driversTitle}</h2></div><p>{copy.driversDescription}</p></div>
          <div className="drivers-grid">
            <article><div className="driver-title raises"><span>↑</span><div><strong>{copy.raises}</strong><small>{copy.strongerSimilarity}</small></div></div>
              {result.scoreDrivers?.raises.length ? <ul>{result.scoreDrivers.raises.map((driver) => <li key={driver.feature}><span>{driver.description}</span></li>)}</ul> : <p className="empty-state">{copy.noPositive}</p>}
            </article>
            <article><div className="driver-title lowers"><span>↓</span><div><strong>{copy.lowers}</strong><small>{copy.lowerSimilarity}</small></div></div>
              {result.scoreDrivers?.lowers.length ? <ul>{result.scoreDrivers.lowers.map((driver) => <li key={driver.feature}><span>{driver.description}</span></li>)}</ul> : <p className="empty-state">{copy.noNegative}</p>}
            </article>
          </div>
        </section>

        <section className="recommendations-section">
          <div className="section-heading"><div><p className="eyebrow">{copy.improvementEyebrow}</p><h2>{copy.improvementTitle}</h2></div><p>{copy.improvementDescription}</p></div>
          <div className="filter-row" role="group" aria-label={language === "en" ? "Filter recommendations" : "Empfehlungen filtern"}>{categories.map((item) => <button key={item.id} type="button" aria-pressed={category === item.id} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}>{item.label}<span>{item.id === "all" ? result.recommendations?.length || 0 : result.recommendations?.filter((recommendation) => recommendation.category === item.id).length || 0}</span></button>)}</div>
          {!observedRecommendations.length && <p className="healthy-state"><strong>{copy.healthy}</strong> {language === "en" ? "The scan is bounded; optional manual checks appear below." : "Der Scan ist begrenzt; optionale manuelle Prüfungen stehen darunter."}</p>}
          {observedRecommendations.length ? <><h3 className="recommendation-group-title">{copy.observed}</h3><div className="recommendation-list">{observedRecommendations.map((item, index) => <article key={item.id}>
            <div className={`priority priority-${item.priority}`}><span>{String(index + 1).padStart(2, "0")}</span><b>{priorityLabels[item.priority]}</b></div>
            <div className="recommendation-copy"><p>{categoryLabels[item.category] || item.category}</p><h3>{item.title}</h3><span>{item.why}</span></div>
            <div className="recommendation-action"><small>{copy.implement}</small><p>{item.action}</p></div>
          </article>)}</div></> : null}
          {guidanceRecommendations.length ? <><h3 className="recommendation-group-title guidance-title">{copy.guidance}</h3><div className="recommendation-list guidance-list">{guidanceRecommendations.map((item, index) => <article key={item.id}>
            <div className={`priority priority-${item.priority}`}><span>{String(index + 1).padStart(2, "0")}</span><b>{copy.guidance}</b></div>
            <div className="recommendation-copy"><p>{categoryLabels[item.category] || item.category}</p><h3>{item.title}</h3><span>{item.why}</span></div>
            <div className="recommendation-action"><small>{copy.manualCheck}</small><p>{item.action}</p></div>
          </article>)}</div></> : null}
          {!visibleRecommendations.length && <p className="empty-filter">{copy.noFilter}</p>}
        </section>

        <section className="security-section">
          <div className="security-score"><p className="eyebrow">{copy.security}</p><strong>{result.security.score}<span>/100</span></strong><h2>{copy.headerProtection}</h2><p>{copy.securityDescription} <a href="#method">{copy.limits}</a></p></div>
          <div className="security-checks">{result.security.checks.map((check) => <details key={check.id} className={`security-${check.status}`}>
            <summary><span aria-hidden="true">{check.status === "pass" ? "✓" : check.status === "warn" ? "!" : "×"}</span><strong>{check.title}</strong><small>{check.status === "pass" ? copy.effective : check.status === "warn" ? copy.review : copy.missing}</small></summary>
            <p>{check.detail}</p>{check.status !== "pass" && <p><b>Empfehlung:</b> {check.action}</p>}
          </details>)}</div>
        </section>

        <details className="technical-details">
          <summary><span><strong>{copy.technical}</strong><small>{copy.technicalDescription}</small></span><b>+</b></summary>
          <div className="technical-grid">
            <article><h3>{copy.directEvidence}</h3>{result.directEvidence?.length ? <ul>{result.directEvidence.map((item) => <li key={`${item.label}-${item.marker}`}>{item.label}{item.marker ? <small>{item.marker}</small> : null}</li>)}</ul> : <p>{copy.noDirect}</p>}</article>
            <article><h3>{copy.stackContext}</h3>{[...(result.stackSignals || []), ...(result.contextEvidence || []).map((item) => item.label), ...(result.headerEvidence || []).map((item) => item.label), ...(result.manifestEvidence || []).map((item) => item.label)].length ? <ul>{[...(result.stackSignals || []), ...(result.contextEvidence || []).map((item) => item.label), ...(result.headerEvidence || []).map((item) => item.label), ...(result.manifestEvidence || []).map((item) => item.label)].map((label, index) => <li key={`${label}-${index}`}>{label}</li>)}</ul> : <p>{copy.noStack}</p>}</article>
            <article><h3>{copy.structural}</h3>{result.structuralHints?.length ? <p><strong>{copy.hints}:</strong> {result.structuralHints.map((hint) => structuralHintLabels[hint] || hint).join(", ")}</p> : null}<dl>{Object.entries(result.metrics || {}).map(([key, value]) => <div key={key}><dt>{metricLabels[key] || key}</dt><dd>{formatMetric(key, value)}</dd></div>)}</dl></article>
            <article><h3>{copy.scan}</h3><dl><div><dt>HTTP</dt><dd>{result.httpStatus}</dd></div><div><dt>{copy.loaded}</dt><dd>{result.assetScan?.fetched || 0}/{result.assetScan?.selected || 0} {copy.selected}</dd></div><div><dt>{copy.found}</dt><dd>{result.assetScan?.discovered || 0}</dd></div><div><dt>{copy.breadth}</dt><dd>{result.evidenceCoverage?.label || "Standard"}</dd></div><div><dt>{copy.model}</dt><dd>{result.model?.version || "v0.4"}</dd></div><div><dt>{copy.time}</dt><dd>{result.analyzedAt ? new Date(result.analyzedAt).toLocaleString(language === "en" ? "en-US" : "de-DE") : "—"}</dd></div></dl></article>
          </div>
          <a className="resolved-url" href={result.resolvedUrl} target="_blank" rel="noreferrer">{copy.viewUrl}: {result.resolvedUrl} ↗</a>
        </details>

        <p className="warning"><strong>{copy.importantLimit}:</strong> {result.warning}</p>
      </> : null}
    </section>}

    <section className="method" id="method">
      <div className="section-heading"><div><p className="eyebrow">{copy.methodEyebrow}</p><h2>{copy.methodTitle}</h2></div><p>{copy.methodDescription}</p></div>
      <div className="method-grid">
        <article><span>01</span><h3>{copy.methodOneTitle}</h3><p>{copy.methodOneText}</p><small className="method-tag">PUBLIC SURFACE</small></article>
        <article><span>02</span><h3>{copy.methodTwoTitle}</h3><p>{copy.methodTwoText}</p><small className="method-tag">QUALITATIVE INDEX</small></article>
        <article><span>03</span><h3>{copy.methodThreeTitle}</h3><p>{copy.methodThreeText}</p><small className="method-tag">ACTIONABLE OUTPUT</small></article>
      </div>
      <div className="method-proof">
        <div className="method-proof-copy"><p className="eyebrow">EVIDENCE BOUNDARY</p><h3>{copy.proofTitle}</h3><p>{copy.proofText}</p></div>
        <div className="method-proof-list">
          <div><span>01</span><strong>{copy.proofPublic}</strong><small>HTML, headers &amp; bounded same-origin assets</small></div>
          <div><span>02</span><strong>{copy.proofScore}</strong><small>No claim of authorship or AI probability</small></div>
          <div><span>03</span><strong>{copy.proofSecurity}</strong><small>Visible header checks stay separate</small></div>
          <div><span>04</span><strong>{copy.proofPrivacy}</strong><small>No login, repository or private source code</small></div>
        </div>
      </div>
    </section>

    <footer><a className="brand footer-brand" href="#top"><span className="brand-mark">V</span><span><strong>VibeFootprint</strong><small>{copy.subtitle}</small></span></a><p>{copy.footerLine} · Product {release.productVersion} · Model {release.displayVersion}</p><a href="#method">{copy.backToMethod}</a></footer>
  </main>;
}

