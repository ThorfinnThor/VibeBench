"use client";

import { CSSProperties, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { parseScanPayload } from "../lib/scan-contract.mjs";
import { parseAdminReport } from "../lib/admin-report-contract.mjs";
import { adminReportFilename, buildAdminReportMarkdown } from "../lib/admin-report-export.mjs";
import { localizeScanPayload, localizeTechnicalOutcome } from "../lib/scan-localization.mjs";
import { automaticRetryDelayMs, MAX_CLIENT_SCAN_ATTEMPTS, shouldAutomaticallyRetry } from "../lib/client-scan-retry.mjs";
import { buildDistinctivenessReviewPrompt } from "../lib/protected-report-enhancements.mjs";
import { buildCustomerReport, customerReportFilename } from "../lib/customer-report.mjs";
import { clearLocalScanHost, compareLocalScans, LOCAL_SCAN_HISTORY_KEY, parseLocalScanHistory, previousLocalScan, recordLocalScan, toLocalScanSnapshot } from "../lib/local-scan-history.mjs";
import { premiumReportSections } from "../lib/premium-report-structure.mjs";
import { estimatedScanProgress, remainingRevealDelay, REPORT_READY_HOLD_MS, scanStageIndex } from "../lib/scan-progress.mjs";
import { buildScanUsageProperties, SCAN_USAGE_EVENT } from "../lib/scan-usage-event.mjs";
import release from "../release/v0.4.json";

type TechnicalOutcome = { code: string; title: string; summary: string; action: string; retryable: boolean };
type ScoreBand = { id: string; label: string; shortLabel: string; summary: string };
type EvidenceCoverage = { level: "broad" | "standard" | "limited"; label: string; summary: string; affectsScore: false; scope: { html: string; assetsDiscovered: number; assetsSelected: number; assetCandidates: number; assetsFetched: number; assetErrors: number; truncatedAssets: number; manifestLinked: boolean; manifestFetched: boolean } };
type CategoryId = "security" | "design" | "engineering" | "accessibility" | "content";
type CategoryOverview = { id: CategoryId; issueCount: number; status: "attention" | "review" | "no-observed-issue" };
type LocalScanSnapshot = { id: string; host: string; analyzedAt: string; footprint: number; security: number; evidenceBreadth: string; categories: Record<CategoryId, number> };
type ScoreDriver = { feature: string; label: string; description: string; contribution: number; direction: "raises" | "lowers"; rawValue: number; trainingBaseline: number; featureType: "binary" | "continuous"; state: string };
type Finding = { id: string; category: CategoryId; priority: "high" | "medium" | "low"; title: string; why: string; action: string; basis: "observed" | "guidance" | "context" };
type SecurityCheck = { id: string; title: string; status: "pass" | "warn" | "fail"; detail: string; action: string };
type LaunchCheck = { id: string; status: "pass" | "review" | "attention"; label: string; detail: string };
type AdminReport = {
  schemaVersion: "admin-report-v1";
  generatedAt: string;
  target: string;
  scoreDrivers: { raises: ScoreDriver[]; lowers: ScoreDriver[] };
  recommendations: Finding[];
  security: { score: number; checks: SecurityCheck[] };
  fixPacks: { en: { id: string; taxonomy: string; prompt: string }[]; de: { id: string; taxonomy: string; prompt: string }[] };
  launchCheck: { status: "pass" | "review" | "attention"; counts: { pass: number; review: number; attention: number }; checks: LaunchCheck[]; boundary: string };
  evidence: {
    directEvidence: unknown[];
    contextEvidence: unknown[];
    headerEvidence: unknown[];
    manifestEvidence: unknown[];
    stackSignals: unknown[];
    structuralHints: unknown[];
    scanMetrics: Record<string, number>;
    pageMetrics: Record<string, number>;
    extendedMetrics: Record<string, number>;
    assetScan: { discovered: number; selected: number; fetched: number; failed: number };
    manifestScan: { linked: boolean; fetched: boolean };
  };
  boundary: { source: string; rawSourceIncluded: false; affectsAuthorship: false; note: string };
};
type ScanResult = {
  apiVersion: string;
  ok: boolean;
  requestId?: string;
  error?: string;
  technicalOutcome?: TechnicalOutcome;
  resolvedUrl?: string;
  httpStatus?: number;
  analyzedAt?: string;
  vibeScore?: { score: number; band: ScoreBand; meaning: string; caveat: string };
  evidenceCoverage?: EvidenceCoverage;
  security?: { score: number; counts: { pass: number; review: number; missing: number } };
  categoryOverview?: CategoryOverview[];
  reportAccess?:
    | { status: "locked"; previewOnly: true; entitlementRequired: true }
    | { status: "testing"; previewOnly: false; entitlementRequired: false };
};

type Language = "en" | "de";

const germanLaunchCopy: Record<string, { label: string; pass: string; review: string; attention: string }> = {
  "VF-LAUNCH-INDEXING": { label: "Indexierungsanweisung", pass: "Keine öffentliche noindex-Anweisung beobachtet.", review: "Indexierungsanweisungen sollten geprüft werden.", attention: "Eine öffentliche noindex-Anweisung wurde beobachtet." },
  "VF-LAUNCH-TITLE": { label: "Dokumenttitel", pass: "Ein Dokumenttitel wurde beobachtet.", review: "Kein Dokumenttitel wurde beobachtet.", attention: "Kein Dokumenttitel wurde beobachtet." },
  "VF-LAUNCH-DESCRIPTION": { label: "Meta-Beschreibung", pass: "Eine Meta-Beschreibung wurde beobachtet.", review: "Keine Meta-Beschreibung wurde beobachtet.", attention: "Keine Meta-Beschreibung wurde beobachtet." },
  "VF-LAUNCH-LANGUAGE": { label: "Dokumentsprache", pass: "Das Dokument deklariert eine Sprache.", review: "Keine Dokumentsprache wurde beobachtet.", attention: "Keine Dokumentsprache wurde beobachtet." },
  "VF-LAUNCH-VIEWPORT": { label: "Viewport-Metadaten", pass: "Viewport-Metadaten wurden beobachtet.", review: "Keine Viewport-Metadaten wurden beobachtet.", attention: "Keine Viewport-Metadaten wurden beobachtet." },
  "VF-LAUNCH-CANONICAL": { label: "Kanonische URL", pass: "Eine gültige kanonische URL wurde beobachtet.", review: "Keine gültige kanonische URL wurde beobachtet.", attention: "Keine gültige kanonische URL wurde beobachtet." },
  "VF-LAUNCH-H1": { label: "Primäre Überschrift", pass: "Eine nicht leere primäre Überschrift wurde beobachtet.", review: "Keine nicht leere H1 wurde im ausgelieferten HTML beobachtet.", attention: "Keine nicht leere H1 wurde im ausgelieferten HTML beobachtet." },
  "VF-LAUNCH-OPEN-GRAPH": { label: "Open-Graph-Metadaten", pass: "Grundlegende Open-Graph-Metadaten wurden beobachtet.", review: "Grundlegende Open-Graph-Metadaten sind unvollständig.", attention: "Grundlegende Open-Graph-Metadaten sind unvollständig." }
};

function presentLaunchCheck(check: LaunchCheck, language: Language) {
  if (language === "en") return check;
  const translated = germanLaunchCopy[check.id];
  if (!translated) return check;
  return { ...check, label: translated.label, detail: translated[check.status] };
}

function AccessibleDialog({ labelledBy, className, backdropClassName = "", onClose, children }: { labelledBy: string; className: string; backdropClassName?: string; onClose: () => void; children: ReactNode }) {
  const dialogRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!dialogRef.current) return;
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const main = document.querySelector("main");
    const wasInert = main instanceof HTMLElement ? main.inert : false;
    const previousOverflow = document.body.style.overflow;
    if (main instanceof HTMLElement) main.inert = true;
    document.body.style.overflow = "hidden";
    const focusable = () => [...dialogRef.current!.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((item) => !item.hasAttribute("hidden"));
    focusable()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) { event.preventDefault(); dialogRef.current?.focus(); return; }
      const first = items[0];
      const last = items.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      if (main instanceof HTMLElement) main.inert = wasInert;
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, []);

  return createPortal(<div className={`sample-report-backdrop ${backdropClassName}`.trim()} role="presentation">
    <section ref={dialogRef} className={className} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}>{children}</section>
  </div>, document.body);
}

const copyByLanguage = {
  en: {
    home: "VibeFootprint home", subtitle: "Website intelligence", scan: "Scan", methodology: "Methodology",
    heroEyebrow: "Evidence-led website review", heroTitle: <>How much <span>vibe</span> is in your website?</>,
    heroLede: "Get a clear 0–100 footprint, understand the public patterns behind it, and turn the findings into practical security, quality and originality improvements.",
    heroTrust: "Transparent model · qualitative orientation with an explicit uncertainty boundary",
    scanTitle: "Analyze a website", scanDescription: "Enter a public URL — the secure scan and report preparation take about 10 seconds.", urlLabel: "Website URL", placeholder: "https://your-website.com", startScan: "Start free scan", scanning: "Scanning website …", cancel: "Cancel",
    privacy: "Bounded, peer-pinned GET requests for public HTML and same-origin assets. The target site may log these requests. No login or private source code.",
    low: "Low", light: "Light", medium: "Medium", high: "High", veryHigh: "Very high",
    scaleNote: <>This qualitative index compares public website patterns with the reference corpus. It does not estimate code origin, generated-code share or authorship. <a href="#method">Read the methodology</a></>,
    results: "Scan results", previous: "Previous result for", newScan: "A new analysis for", noResult: "No new result created", previousKept: "Previous result remains available", yourFootprint: "Your Vibe-Footprint", analyzed: "Analyzed", whatItMeans: "What this means", seeMethod: "See methodology", scanOverview: "Free overview", breadth: "Evidence breadth", securityBaseline: "Security baseline", categoriesFlagged: "Categories with observations", directMarkers: "Direct markers", uniqueBuilders: "Unique builders", noBonus: "No separate score bonus or penalty", footprintScoreType: "Public-pattern similarity", footprintSeparate: "Security findings do not change this score.", securityScoreType: "Public header protection", securitySeparate: "This is independent from the Vibe-Footprint.",
    indexExplained: "Index explained", driversTitle: "What shapes the result?", driversDescription: "Only signals actually observed on the public surface appear here. Order shows relative model influence, not points on the 0–100 scale.", raises: "Raises the score", strongerSimilarity: "stronger similarity", lowers: "Lowers the score", lowerSimilarity: "lower similarity", noPositive: "No individual positive drivers are visible.", noNegative: "No individual negative drivers are visible.",
    improvementEyebrow: "Practical improvement plan", improvementTitle: "What to improve next", improvementDescription: "Prioritized by likely impact. Address the first items, then scan again.", observed: "Observed findings", guidance: "Optional manual checks", doFirst: "Do first", doNext: "Next", optimize: "Optimize", implement: "How to implement", manualCheck: "Manual check", healthy: "No high-confidence issue was found in this area.", noFilter: "This filter has no observed finding or general guidance.",
    security: "Security baseline", headerProtection: "Publicly visible header protection", securityDescription: "Value-based checks of selected main-document headers — not a full penetration test.", limits: "See limits", effective: "Effective", review: "Review", missing: "Missing / ineffective", recommendationLabel: "Recommendation:",
    reportEyebrow: "Free scan summary", reportTitle: "Your decision-ready overview", reportDescription: "The free result shows both independent scores and the categories that need attention. The complete report is available below during product testing.", reportFootprint: "Pattern similarity", reportSecurity: "Header protection", reportIndependent: "Independent assessments — neither score changes the other.", shareReport: "Share summary", copyReport: "Copy summary", downloadReport: "Download summary", printReport: "Print summary", reportShared: "Summary shared", reportCopied: "Summary copied", reportDownloaded: "Summary downloaded", retrying: "The first attempt did not complete. One automatic retry is running …", comparisonEyebrow: "Local scan comparison", comparisonTitle: "What changed since your last scan", comparisonDescription: "Stored only in this browser, limited to the latest three summaries for this hostname.", comparisonEmpty: "Run this hostname again to see a descriptive before-and-after comparison here.", comparisonFootprint: "Footprint change", comparisonSecurity: "Security change", comparisonIssues: "Observed-issue change", comparisonCaveat: "Changes show two public-surface observations. They are not proof of causality, authorship or a calibrated improvement.", comparisonBreadthChanged: "Evidence breadth differed between the scans, so interpret changes cautiously.", previousScanAt: "Previous scan", clearHistory: "Clear local history", historyCleared: "Local history cleared.",
    categoriesEyebrow: "Free category overview", categoriesTitle: "Where attention is needed", categoriesDescription: "Counts summarize observed issues. Open the full testing report below for evidence, reasoning and implementation steps.", attention: "Needs attention", reviewCategory: "Review", clearCategory: "No issue observed", issue: "observed issue", issues: "observed issues",
    lockedEyebrow: "Full diagnostic report", lockedTitle: "Unlock the evidence behind the score", lockedDescription: "Get the exact score drivers, prioritized findings, security checks and implementation steps in a client-ready report.", unlock: "Unlock full report", lockedBadge: "Detailed report locked", lockedIncludes: "Included in the full report", lockedItems: ["Score drivers and signal evidence", "Prioritized design and engineering findings", "Security-header details and remediation", "Three copy-ready coding-agent fix prompts", "Public launch check and technical appendix"], checkoutPending: "Checkout is not connected yet. Pricing and payment setup are the next product decision.", previewReport: "Preview full report design", sampleLabel: "Report design sample", sampleNotice: "Illustrative content only — this preview shows the complete report format, not protected findings from this scan.", closePreview: "Close report preview", sampleExecutive: "The report opens with a concise decision summary and keeps pattern similarity separate from public header protection.", sampleDriverUp: "Example: repeated component patterns increase visual similarity.", sampleDriverDown: "Example: distinctive content structure reduces genericness.", sampleFindingOne: "Example priority finding", sampleFindingOneText: "The report explains the observed public evidence, why it matters and the smallest safe improvement direction.", sampleFindingTwo: "Example security finding", sampleFindingTwoText: "Header findings include status, impact and implementation guidance without changing the Vibe-Footprint.", samplePlan: ["Address the highest-impact observed finding", "Validate the change in the repository and browser", "Deploy, rescan and compare the public surface"], sampleAppendix: "The appendix records scope, evidence breadth, timestamp and interpretation boundaries.", adminAccess: "Admin test access", adminDescription: "Run this target again with the server-protected test key to view its real full report.", adminKey: "Admin preview key", adminPlaceholder: "Enter the temporary admin key", adminRun: "Run protected admin scan", adminRunning: "Generating real admin report …", adminPrivacy: "The key stays in this browser tab, is sent only to this server and is never stored locally.", adminOpen: "Open real full report", adminAuthorized: "Protected admin report · actual scan data", adminClose: "Close admin report", testReportEyebrow: "Free testing version", testReportTitle: "Full report enabled for feedback", testReportDescription: "During this testing phase, the complete real report is available without checkout or an access key. Please review the findings, prompts and exports and share what is unclear or missing.", testReportOpen: "Open full report", testReportNotice: "Free test report · actual scan data", reportWhy: "Why it matters", reportAction: "Recommended action", reportObserved: "Observed", reportGuidance: "Manual guidance", reportFixPrompts: "Coding-agent fix prompts", reportLaunch: "Public launch check", reportEvidence: "Technical evidence", reportNoDrivers: "No visible driver in this direction met the reporting threshold.", reportNoFindings: "No finding was produced for this scan.",
    technical: "View technical evidence", technicalDescription: "Builder markers, stack signals, measurements and scan metadata", directEvidence: "Direct markers", noDirect: "No direct builder markers found.", stackContext: "Stack & context", noStack: "No known stack or context signals were visible.", structural: "Structure values", hints: "Hints", loaded: "Assets loaded", selected: "selected", found: "Assets found", model: "Model", time: "Time", viewUrl: "Open resolved URL", importantLimit: "Important boundary", dataProtection: "Data and operation", methodEyebrow: "How VibeFootprint works", methodTitle: "A visible footprint, turned into useful next steps.", methodDescription: "We inspect only what a public website delivers. No login, repository or private source code is required.", methodOneTitle: "Inspect the public surface", methodOneText: "HTML, response headers and a bounded selection of same-origin assets over validated, peer-pinned connections.", methodTwoTitle: "Score visible patterns", methodTwoText: "The frozen model combines public technical and structural signals into an uncalibrated 0–100 similarity index.", methodThreeTitle: "Separate evidence from advice", methodThreeText: "Observed findings stay distinct from optional manual guidance and are ordered by impact.", limitationsTitle: "What this scan does not test", limitationsIntro: "The public-surface scan is intentionally bounded. It does not replace product, repository or specialist testing.", limitations: ["Functionality, login flows, forms, payments, backend logic or databases", "Secrets, dependencies, repository tests or runtime JavaScript behavior", "Core Web Vitals, full performance analysis or responsive screenshot review", "Keyboard navigation, screen readers or a complete accessibility audit"], proofTitle: "Designed for a clear decision", proofText: "Use the footprint to see where a site looks generic, where it needs hardening, and what to improve next — without pretending to know who authored it.", proofPublic: "Public surface only", proofScore: "0–100 qualitative index", proofSecurity: "Separate security baseline", proofPrivacy: "No source access required", footerLine: "Vibe-Footprint & Security-Baseline", backToMethod: "Methodology & limits ↑"
  },
  de: {
    home: "VibeFootprint Startseite", subtitle: "Website-Intelligenz", scan: "Scan", methodology: "Methodik", heroEyebrow: "Evidenzbasierte Website-Prüfung", heroTitle: <>Wie viel <span>Vibe</span> steckt in deiner Website?</>, heroLede: "Erhalte einen verständlichen Score von 0 bis 100, erkenne öffentlich sichtbare Muster und finde konkrete Schritte für mehr Sicherheit, Qualität und Eigenständigkeit.", heroTrust: "Transparentes Modell · qualitative Orientierung mit klarer Unsicherheitsgrenze", scanTitle: "Website analysieren", scanDescription: "Öffentliche URL eingeben – der sichere Scan und die Report-Aufbereitung dauern etwa 10 Sekunden.", urlLabel: "Website-URL", placeholder: "https://deine-website.de", startScan: "Kostenlosen Scan starten", scanning: "Website wird untersucht …", cancel: "Abbrechen", privacy: "Begrenzte, IP-gepinnte GET-Abrufe von öffentlichem HTML und gleich-originigen Assets. Die Zielseite kann diese Abrufe protokollieren. Keine Anmeldung, kein privater Quellcode.", low: "Niedrig", light: "Leicht", medium: "Mittel", high: "Hoch", veryHigh: "Sehr hoch", scaleNote: <>Der qualitative Index vergleicht öffentliche Website-Muster mit dem Referenzkorpus. Er misst weder Codeherkunft, Anteil generierten Codes noch Autorenschaft. <a href="#method">Methodik und Grenzen</a></>, results: "Scan-Ergebnisse", previous: "Vorheriges Ergebnis für", newScan: "Neue Analyse für", noResult: "Kein neues Ergebnis erzeugt", previousKept: "Vorheriges Ergebnis bleibt erhalten", yourFootprint: "Dein Vibe-Footprint", analyzed: "Analysiert", whatItMeans: "Was das bedeutet", seeMethod: "Methodik ansehen", scanOverview: "Footprint-Evidenz", breadth: "Auswertungsbreite", securityBaseline: "Sicherheits-Baseline", directMarkers: "Direkte Marker", uniqueBuilders: "Eindeutige Builder", noBonus: "Kein separater Bonus oder Abzug", footprintScoreType: "Ähnlichkeit öffentlicher Muster", footprintSeparate: "Security-Findings verändern diesen Score nicht.", securityScoreType: "Öffentlicher Headerschutz", securitySeparate: "Diese Bewertung ist unabhängig vom Vibe-Footprint.", indexExplained: "Index verständlich gemacht", driversTitle: "Was beeinflusst das Ergebnis?", driversDescription: "Nur tatsächlich erkannte Signale erscheinen hier. Die Reihenfolge zeigt relative Modellwirkung, keine Punkte auf der 0–100-Skala.", raises: "Erhöht den Score", strongerSimilarity: "stärkere Ähnlichkeit", lowers: "Senkt den Score", lowerSimilarity: "geringere Ähnlichkeit", noPositive: "Keine einzelnen positiven Treiber sichtbar.", noNegative: "Keine einzelnen negativen Treiber sichtbar.", improvementEyebrow: "Konkreter Verbesserungsplan", improvementTitle: "Was du jetzt verbessern solltest", improvementDescription: "Priorisiert nach Wirkung. Arbeite die ersten Punkte ab und scanne die Website danach erneut.", observed: "Beobachtete Hinweise", guidance: "Optionale manuelle Prüfungen", doFirst: "Zuerst lösen", doNext: "Danach", optimize: "Optimierung", implement: "So setzt du es um", manualCheck: "Manuell prüfen", healthy: "Keine hochkonfidenten Probleme in diesem Bereich erkannt.", noFilter: "Für diesen Filter gibt es weder ein beobachtetes Finding noch allgemeine Guidance.", security: "Security-Baseline", headerProtection: "Öffentlich sichtbarer Headerschutz", securityDescription: "Wertbezogene Prüfung ausgewählter Hauptdokument-Header – kein vollständiger Penetrationstest.", limits: "Grenzen ansehen", effective: "Wirksam", review: "Prüfen", missing: "Fehlt/Unwirksam", recommendationLabel: "Empfehlung:", reportEyebrow: "Kostenlose Scan-Zusammenfassung", reportTitle: "Deine klare Entscheidungsübersicht", reportDescription: "Das kostenlose Ergebnis zeigt die beiden unabhängigen Scores und betroffene Oberkategorien. Detaillierte Evidenz bleibt geschützt.", reportFootprint: "Musterähnlichkeit", reportSecurity: "Headerschutz", reportIndependent: "Unabhängige Bewertungen – kein Score verändert den anderen.", shareReport: "Zusammenfassung teilen", copyReport: "Zusammenfassung kopieren", downloadReport: "Zusammenfassung laden", printReport: "Zusammenfassung drucken", reportShared: "Zusammenfassung geteilt", reportCopied: "Zusammenfassung kopiert", reportDownloaded: "Zusammenfassung heruntergeladen", retrying: "Der erste Versuch war nicht vollständig. Ein automatischer Wiederholungsversuch läuft …", comparisonEyebrow: "Lokaler Scan-Vergleich", comparisonTitle: "Was sich seit dem letzten Scan verändert hat", comparisonDescription: "Nur in diesem Browser gespeichert, begrenzt auf die letzten drei Zusammenfassungen dieses Hostnamens.", comparisonEmpty: "Scanne diesen Hostnamen erneut, um hier einen beschreibenden Vorher-Nachher-Vergleich zu sehen.", comparisonFootprint: "Footprint-Veränderung", comparisonSecurity: "Security-Veränderung", comparisonIssues: "Veränderung beobachteter Hinweise", comparisonCaveat: "Die Unterschiede vergleichen zwei Beobachtungen der öffentlichen Oberfläche. Sie beweisen weder Kausalität noch Autorenschaft und sind keine kalibrierte Verbesserung.", comparisonBreadthChanged: "Die Auswertungsbreite unterschied sich zwischen den Scans; Veränderungen daher vorsichtig interpretieren.", previousScanAt: "Vorheriger Scan", clearHistory: "Lokalen Verlauf löschen", historyCleared: "Lokaler Verlauf gelöscht.", categoriesEyebrow: "Kostenlose Kategorieübersicht", categoriesTitle: "Wo Handlungsbedarf besteht", categoriesDescription: "Die Zahlen fassen beobachtete Hinweise zusammen. Evidenz, Begründung und Umsetzungsschritte sind nicht Teil der kostenlosen Antwort.", attention: "Handlungsbedarf", reviewCategory: "Prüfen", clearCategory: "Kein Problem beobachtet", issue: "beobachteter Hinweis", issues: "beobachtete Hinweise", lockedEyebrow: "Vollständiger Diagnosebericht", lockedTitle: "Evidenz hinter dem Score freischalten", lockedDescription: "Erhalte exakte Score-Treiber, priorisierte Findings, Sicherheitsprüfungen und Umsetzungsschritte in einem kundenfertigen Report.", unlock: "Vollständigen Report freischalten", lockedBadge: "Detailreport gesperrt", lockedIncludes: "Im vollständigen Report enthalten", lockedItems: ["Score-Treiber und Signal-Evidenz", "Priorisierte Design- und Engineering-Findings", "Security-Header-Details und Maßnahmen", "Drei kopierfertige Coding-Agent-Fix-Prompts", "Öffentlicher Launch-Check und technischer Anhang"], checkoutPending: "Der Checkout ist noch nicht verbunden. Preis und Zahlungsabwicklung sind die nächste Produktentscheidung.", previewReport: "Vollständiges Report-Design ansehen", sampleLabel: "Muster des Report-Designs", sampleNotice: "Nur beispielhafte Inhalte – diese Vorschau zeigt das vollständige Report-Format, nicht die geschützten Findings dieses Scans.", closePreview: "Report-Vorschau schließen", sampleExecutive: "Der Report beginnt mit einer kompakten Entscheidungsübersicht und trennt Musterähnlichkeit klar vom öffentlichen Headerschutz.", sampleDriverUp: "Beispiel: Wiederholte Komponenten-Muster erhöhen die visuelle Ähnlichkeit.", sampleDriverDown: "Beispiel: Eine eigenständige Inhaltsstruktur reduziert generische Wirkung.", sampleFindingOne: "Beispiel für ein priorisiertes Finding", sampleFindingOneText: "Der Report erklärt die beobachtete öffentliche Evidenz, ihre Bedeutung und die kleinste sichere Verbesserungsrichtung.", sampleFindingTwo: "Beispiel für ein Security-Finding", sampleFindingTwoText: "Header-Findings enthalten Status, Wirkung und Umsetzungshinweise, ohne den Vibe-Footprint zu verändern.", samplePlan: ["Finding mit der höchsten Wirkung bearbeiten", "Änderung im Repository und Browser validieren", "Deployen, erneut scannen und öffentliche Oberfläche vergleichen"], sampleAppendix: "Der Anhang dokumentiert Umfang, Auswertungsbreite, Zeitpunkt und Interpretationsgrenzen.", adminAccess: "Admin-Testzugang", adminDescription: "Scanne das aktuelle Ziel mit dem serverseitig geschützten Testschlüssel erneut, um den echten vollständigen Report zu sehen.", adminKey: "Admin-Vorschau-Schlüssel", adminPlaceholder: "Temporären Admin-Schlüssel eingeben", adminRun: "Geschützten Admin-Scan starten", adminRunning: "Echter Admin-Report wird erstellt …", adminPrivacy: "Der Schlüssel bleibt in diesem Browser-Tab, wird nur an diesen Server gesendet und nie lokal gespeichert.", adminOpen: "Echten vollständigen Report öffnen", adminAuthorized: "Geschützter Admin-Report · echte Scan-Daten", adminClose: "Admin-Report schließen", reportWhy: "Warum es relevant ist", reportAction: "Empfohlene Maßnahme", reportObserved: "Beobachtet", reportGuidance: "Manuelle Guidance", reportFixPrompts: "Coding-Agent-Fix-Prompts", reportLaunch: "Öffentlicher Launch-Check", reportEvidence: "Technische Evidenz", reportNoDrivers: "In dieser Richtung überschreitet kein sichtbarer Treiber die Berichtsschwelle.", reportNoFindings: "Für diesen Scan wurde kein Finding erzeugt.", technical: "Technische Evidenz ansehen", technicalDescription: "Builder-Marker, Stack, Messwerte und Scan-Metadaten", directEvidence: "Direkte Marker", noDirect: "Keine direkten Builder-Marker gefunden.", stackContext: "Stack & Kontext", noStack: "Keine bekannten Stack- oder Kontextsignale sichtbar.", structural: "Strukturwerte", hints: "Hinweise", loaded: "Assets geladen", selected: "ausgewählt", found: "Assets gefunden", model: "Modell", time: "Zeitpunkt", viewUrl: "Aufgelöste URL öffnen", importantLimit: "Wichtige Grenze", dataProtection: "Datenschutz und Betrieb", methodEyebrow: "So funktioniert VibeFootprint", methodTitle: "Von sichtbaren Mustern zu klaren nächsten Schritten.", methodDescription: "Der Scan untersucht nur das, was eine öffentliche Website ausliefert. Kein Login, kein Repository und kein privater Quellcode werden benötigt.", methodOneTitle: "Öffentliche Oberfläche scannen", methodOneText: "HTML, Response-Header und eine begrenzte Auswahl gleich-originiger Skripte und Stylesheets über geprüfte, IP-gepinnte Verbindungen.", methodTwoTitle: "Sichtbare Muster bewerten", methodTwoText: "Das eingefrorene Modell kombiniert öffentlich sichtbare technische und strukturelle Signale zu einem unkalibrierten Ähnlichkeitsindex von 0 bis 100.", methodThreeTitle: "Evidenz und Hinweise trennen", methodThreeText: "Beobachtete Findings bleiben von optionaler manueller Guidance getrennt und werden nach Wirkung geordnet.", limitationsTitle: "Was dieser Scan nicht testet", limitationsIntro: "Der Public-Surface-Scan ist bewusst begrenzt und ersetzt keine Produkt-, Repository- oder Spezialprüfung.", limitations: ["Funktionalität, Login-Flows, Formulare, Zahlungen, Backend-Logik oder Datenbanken", "Secrets, Dependencies, Repository-Tests oder JavaScript-Laufzeitverhalten", "Core Web Vitals, vollständige Performance-Analyse oder Responsive-Screenshot-Prüfung", "Tastaturbedienung, Screenreader oder ein vollständiges Accessibility-Audit"], proofTitle: "Für klare Entscheidungen gebaut", proofText: "Nutze den Footprint, um generische Stellen, Härtungsbedarf und nächste Verbesserungen zu erkennen – ohne vorzugeben, wer die Website erstellt hat.", proofPublic: "Nur öffentliche Oberfläche", proofScore: "Qualitativer Index 0–100", proofSecurity: "Separate Security-Baseline", proofPrivacy: "Kein Quellcodezugriff nötig", footerLine: "Vibe-Footprint & Security-Baseline", backToMethod: "Methodik & Grenzen ↑"
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

const categoryIds: CategoryId[] = ["security", "design", "engineering", "accessibility", "content"];
const categoryLabelsByLanguage = {
  en: { security: "Security", design: "Design", engineering: "Engineering", accessibility: "Accessibility", content: "Content" },
  de: { security: "Sicherheit", design: "Design", engineering: "Engineering", accessibility: "Barrierefreiheit", content: "Inhalt" }
} as const;

function footprintTone(bandId = "medium") {
  return `tone-footprint-${["low", "light", "medium", "high", "very-high"].includes(bandId) ? bandId : "medium"}`;
}

function securityTone(score: number) {
  if (score >= 85) return "tone-security-strong";
  if (score >= 70) return "tone-security-good";
  if (score >= 50) return "tone-security-review";
  return "tone-security-risk";
}

const scanProgressCopyByLanguage = {
  en: {
    title: "Scan progress",
    estimated: "The percentage reflects the complete scan and report-preparation flow.",
    preparing: "Analysis complete — preparing your report",
    retrying: "Retrying the secure public request",
    stages: ["Establishing a secure connection", "Reading the public website surface", "Inspecting bounded same-origin assets", "Reviewing public security headers", "Comparing visible patterns", "Preparing the report"],
    completeStages: ["Organizing the collected evidence", "Separating the Vibe-Footprint and security baseline", "Grouping observed issues into categories", "Applying the interpretation boundary", "Protecting detailed report evidence", "Finalizing your free summary"]
  },
  de: {
    title: "Scan-Fortschritt",
    estimated: "Der Prozentwert bildet den vollständigen Scan- und Aufbereitungsprozess ab.",
    preparing: "Analyse abgeschlossen – dein Report wird aufbereitet",
    retrying: "Sicherer öffentlicher Abruf wird wiederholt",
    stages: ["Sichere Verbindung herstellen", "Öffentliche Website-Oberfläche lesen", "Begrenzte Same-Origin-Assets prüfen", "Öffentliche Security-Header bewerten", "Sichtbare Muster vergleichen", "Report aufbereiten"],
    completeStages: ["Gesammelte Evidenz ordnen", "Vibe-Footprint und Sicherheits-Baseline trennen", "Beobachtete Hinweise nach Kategorien gruppieren", "Interpretationsgrenze anwenden", "Detaillierte Report-Evidenz schützen", "Kostenlose Zusammenfassung finalisieren"]
  }
} as const;

function waitForDelay(ms: number, signal: AbortSignal) {
  if (ms <= 0) return Promise.resolve(!signal.aborted);
  if (signal.aborted) return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    const timer = window.setTimeout(() => { signal.removeEventListener("abort", onAbort); resolve(true); }, ms);
    const onAbort = () => { window.clearTimeout(timer); signal.removeEventListener("abort", onAbort); resolve(false); };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function ScoreRing({ score, language }: { score: number; language: Language }) {
  const label = language === "en" ? "out of 100" : "von 100";
  return <div className="score-ring" style={{ "--score-angle": `${score * 3.6}deg` } as CSSProperties} aria-label={`${score} ${label}`}>
    <div className="score-ring-inner"><strong>{score}</strong><span>{label}</span></div>
  </div>;
}

export default function VibeFootprintHome({ initialLanguage = "en" }: { initialLanguage?: Language }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [rawResult, setRawResult] = useState<ScanResult | null>(null);
  const [errorResult, setErrorResult] = useState<ScanResult | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [technicalScanComplete, setTechnicalScanComplete] = useState(false);
  const [reportStatus, setReportStatus] = useState("");
  const [purchaseNotice, setPurchaseNotice] = useState("");
  const [sampleReportOpen, setSampleReportOpen] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [rawAdminReport, setRawAdminReport] = useState<AdminReport | null>(null);
  const [adminReportOpen, setAdminReportOpen] = useState(false);
  const [adminReportStatus, setAdminReportStatus] = useState("");
  const [currentLocalScan, setCurrentLocalScan] = useState<LocalScanSnapshot | null>(null);
  const [previousLocalResult, setPreviousLocalResult] = useState<LocalScanSnapshot | null>(null);
  const [historyStatus, setHistoryStatus] = useState("");
  const language = initialLanguage;
  const resultsRef = useRef<HTMLElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const scanSequenceRef = useRef(0);
  const loadingRef = useRef(false);
  const copy = copyByLanguage[language];
  const categoryLabels = categoryLabelsByLanguage[language];
  const scanProgressCopy = scanProgressCopyByLanguage[language];
  const premiumSections = premiumReportSections(language);
  const result = useMemo(() => localizeScanPayload(rawResult, language) as ScanResult | null, [rawResult, language]);
  const adminReport = useMemo(() => localizeScanPayload(rawAdminReport, language) as AdminReport | null, [rawAdminReport, language]);
  const freeTestingReport = result?.reportAccess?.status === "testing";
  const adminReportMarkdown = useMemo(() => adminReport && result?.vibeScore ? buildAdminReportMarkdown({ report: adminReport, footprintScore: result.vibeScore.score, footprintBand: result.vibeScore.band.label, evidenceLabel: result.evidenceCoverage?.label || "Standard", locale: language }) : "", [adminReport, language, result]);
  const localComparison = useMemo(() => compareLocalScans(currentLocalScan, previousLocalResult), [currentLocalScan, previousLocalResult]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if ((!result && !errorResult) || !resultsRef.current) return;
    resultsRef.current.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultsRef.current.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [result, errorResult]);

  const reportText = useMemo(() => result?.ok ? buildCustomerReport(result, language) : "", [language, result]);

  function recordSuccessfulScan(parsed: ScanResult) {
    const snapshot = toLocalScanSnapshot(parsed) as LocalScanSnapshot | null;
    if (!snapshot) return;
    setCurrentLocalScan(snapshot);
    try {
      const history = parseLocalScanHistory(window.localStorage.getItem(LOCAL_SCAN_HISTORY_KEY)) as LocalScanSnapshot[];
      setPreviousLocalResult(previousLocalScan(history, snapshot) as LocalScanSnapshot | null);
      setHistoryStatus("");
      window.localStorage.setItem(LOCAL_SCAN_HISTORY_KEY, JSON.stringify(recordLocalScan(history, snapshot)));
    } catch {
      setPreviousLocalResult(null);
      setHistoryStatus(language === "de" ? "Lokaler Vergleich ist in diesem Browser nicht verfügbar." : "Local comparison is unavailable in this browser.");
    }
  }

  async function runScan(options: { adminKey?: string; requestedUrl?: string } = {}) {
    const requestedUrl = (options.requestedUrl || url).trim();
    const requestedAdminKey = options.adminKey?.trim() || "";
    const sequence = ++scanSequenceRef.current;
    const scanStartedAt = Date.now();
    controllerRef.current?.abort("superseded");
    loadingRef.current = true;
    setLoading(true);
    setPendingUrl(requestedUrl);
    setErrorResult(null);
    setRetryAttempt(0);
    setScanProgress(0);
    setTechnicalScanComplete(false);
    setReportStatus("");
    setPurchaseNotice("");
    setSampleReportOpen(false);
    setAdminReportOpen(false);
    setAdminReportStatus("");
    setRawAdminReport(null);
    const progressTimer = window.setInterval(() => setScanProgress((current) => Math.max(current, estimatedScanProgress(Date.now() - scanStartedAt))), 120);
    try {
      for (let attempt = 1; attempt <= MAX_CLIENT_SCAN_ATTEMPTS; attempt += 1) {
        const controller = new AbortController();
        controllerRef.current = controller;
        const timeout = window.setTimeout(() => controller.abort("client-timeout"), 19_000);
        let failedResult: ScanResult | null = null;
        try {
          const requestHeaders: Record<string, string> = { "content-type": "application/json" };
          if (requestedAdminKey) requestHeaders["x-vibefootprint-admin-preview-key"] = requestedAdminKey;
          const response = await fetch("/api/scan", {
            method: "POST",
            headers: requestHeaders,
            body: JSON.stringify({ url: requestedUrl }),
            signal: controller.signal
          });
          const responseRequestId = response.headers.get("x-vibebench-request-id") || undefined;
          const payload = await response.json().catch(() => null);
          const protectedReport = parseAdminReport(payload?.adminReport) as AdminReport | null;
          const publicPayload = protectedReport ? { ...payload } : payload;
          if (protectedReport) delete publicPayload.adminReport;
          const parsed = parseScanPayload(publicPayload) as ScanResult | null;
          if (sequence !== scanSequenceRef.current) return;
          if (!parsed || (requestedAdminKey && parsed.ok && !protectedReport)) failedResult = { apiVersion: release.apiVersion, ok: false, requestId: responseRequestId, technicalOutcome: incompatibleTechnicalOutcome };
          else if (parsed.ok) {
            if (!requestedAdminKey) {
              track(SCAN_USAGE_EVENT, buildScanUsageProperties({
                outcome: "success",
                durationMs: Date.now() - scanStartedAt,
                evidenceBreadth: parsed.evidenceCoverage?.level
              }));
            }
            setTechnicalScanComplete(true);
            const revealReady = await waitForDelay(remainingRevealDelay(scanStartedAt), controller.signal);
            if (!revealReady || sequence !== scanSequenceRef.current) {
              if (sequence === scanSequenceRef.current) setErrorResult({ apiVersion: release.apiVersion, ok: false, technicalOutcome: cancelledTechnicalOutcome });
              return;
            }
            setScanProgress(100);
            if (!await waitForDelay(REPORT_READY_HOLD_MS, controller.signal) || sequence !== scanSequenceRef.current) return;
            setRawResult(parsed);
            if (!requestedAdminKey) recordSuccessfulScan(parsed);
            if (protectedReport) {
              setRawAdminReport(protectedReport);
              setAdminReportOpen(true);
            }
            setErrorResult(null);
            return;
          } else failedResult = parsed;
        } catch {
          if (sequence !== scanSequenceRef.current) return;
          const outcome = controller.signal.aborted
            ? controller.signal.reason === "client-timeout" ? clientTimeoutTechnicalOutcome : cancelledTechnicalOutcome
            : fallbackTechnicalOutcome;
          failedResult = { apiVersion: release.apiVersion, ok: false, technicalOutcome: outcome };
        } finally {
          window.clearTimeout(timeout);
        }

        if (sequence !== scanSequenceRef.current || !failedResult?.technicalOutcome) return;
        if (controller.signal.reason === "user-cancelled") {
          setErrorResult(failedResult);
          return;
        }
        if (shouldAutomaticallyRetry(failedResult.technicalOutcome, attempt)) {
          setRetryAttempt(attempt + 1);
          await new Promise((resolve) => window.setTimeout(resolve, automaticRetryDelayMs(failedResult?.technicalOutcome?.code)));
          if (sequence !== scanSequenceRef.current || controller.signal.aborted) {
            if (sequence !== scanSequenceRef.current) return;
            setErrorResult({ apiVersion: release.apiVersion, ok: false, technicalOutcome: cancelledTechnicalOutcome });
            return;
          }
          continue;
        }
        if (!requestedAdminKey) {
          track(SCAN_USAGE_EVENT, buildScanUsageProperties({
            outcome: "failed",
            durationMs: Date.now() - scanStartedAt,
            errorCode: failedResult.technicalOutcome.code,
            retryable: failedResult.technicalOutcome.retryable
          }));
        }
        setErrorResult(failedResult);
        return;
      }
    } finally {
      window.clearInterval(progressTimer);
      if (sequence === scanSequenceRef.current) {
        controllerRef.current = null;
        loadingRef.current = false;
        setLoading(false);
        setPendingUrl(null);
        setRetryAttempt(0);
        setTechnicalScanComplete(false);
      }
    }
  }

  function scan(event: FormEvent) {
    event.preventDefault();
    if (loadingRef.current) return;
    void runScan();
  }

  function runAdminScan(event: FormEvent) {
    event.preventDefault();
    if (loadingRef.current || !adminKey.trim() || !result?.resolvedUrl) return;
    void runScan({ adminKey, requestedUrl: result.resolvedUrl });
  }

  function cancelScan() {
    controllerRef.current?.abort("user-cancelled");
  }

  async function copyCustomerReport() {
    if (!reportText) return;
    try {
      await navigator.clipboard.writeText(reportText);
      setReportStatus(copy.reportCopied);
    } catch {
      setReportStatus(language === "en" ? "Copying is not available in this browser." : "Kopieren ist in diesem Browser nicht verfügbar.");
    }
  }

  async function shareCustomerReport() {
    if (!reportText || !result) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: copy.reportTitle, text: reportText });
        setReportStatus(copy.reportShared);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyCustomerReport();
  }

  function downloadCustomerReport() {
    if (!reportText || !result) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([reportText], { type: "text/markdown;charset=utf-8" }));
    link.download = customerReportFilename(result, language);
    link.click();
    URL.revokeObjectURL(link.href);
    setReportStatus(copy.reportDownloaded);
  }

  async function copyAdminPrompt(prompt: string, id: string) {
    try {
      await navigator.clipboard.writeText(prompt);
      setAdminReportStatus(language === "en" ? `${id} prompt copied.` : `${id}-Prompt kopiert.`);
    } catch {
      setAdminReportStatus(language === "en" ? "Copying is not available in this browser." : "Kopieren ist in diesem Browser nicht verfügbar.");
    }
  }

  function downloadAdminMarkdown() {
    if (!adminReport || !adminReportMarkdown) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([adminReportMarkdown], { type: "text/markdown;charset=utf-8" }));
    link.download = adminReportFilename(adminReport.target, language);
    link.click();
    URL.revokeObjectURL(link.href);
    setAdminReportStatus(language === "en" ? "Full Markdown report downloaded." : "Vollständiger Markdown-Report heruntergeladen.");
  }

  function printAdminReport() {
    setAdminReportStatus(language === "en" ? "Print dialog opened — choose Save as PDF." : "Druckdialog geöffnet – dort Als PDF sichern wählen.");
    window.setTimeout(() => window.print(), 50);
  }

  function clearCurrentHostHistory() {
    if (!currentLocalScan) return;
    try {
      const history = parseLocalScanHistory(window.localStorage.getItem(LOCAL_SCAN_HISTORY_KEY));
      window.localStorage.setItem(LOCAL_SCAN_HISTORY_KEY, JSON.stringify(clearLocalScanHost(history, currentLocalScan.host)));
      setPreviousLocalResult(null);
      setHistoryStatus(copy.historyCleared);
    } catch {
      setHistoryStatus(language === "de" ? "Lokaler Verlauf ist in diesem Browser nicht verfügbar." : "Local history is unavailable in this browser.");
    }
  }

  function signed(value: number) {
    return value > 0 ? `+${value}` : String(value);
  }

  const technicalOutcome = localizeTechnicalOutcome(errorResult?.technicalOutcome || null, language);
  const score = result?.vibeScore?.score ?? 0;
  const resultHost = result?.resolvedUrl ? new URL(result.resolvedUrl).hostname : null;
  const observedIssueCount = result?.categoryOverview?.reduce((total, item) => total + item.issueCount, 0) || 0;
  const reportedDriverCount = (adminReport?.scoreDrivers.raises.length || 0) + (adminReport?.scoreDrivers.lowers.length || 0);
  const observedFindingCount = adminReport?.recommendations.filter((finding) => finding.basis === "observed").length || 0;
  const guidanceFindingCount = adminReport?.recommendations.filter((finding) => finding.basis !== "observed").length || 0;
  const distinctivenessPrompt = adminReport && result?.vibeScore ? buildDistinctivenessReviewPrompt({ score, scoreBand: result.vibeScore.band.label, scoreDrivers: adminReport.scoreDrivers, target: adminReport.target, analyzedAt: adminReport.generatedAt, locale: language }) : null;
  const activeScanStage = retryAttempt ? scanProgressCopy.retrying : technicalScanComplete ? scanProgressCopy.completeStages[scanStageIndex(scanProgress)] : scanProgressCopy.stages[scanStageIndex(scanProgress)];

  return <main id="top">
    <a className="skip-link" href="#scanner">{language === "en" ? "Skip to website scan" : "Direkt zum Website-Scan"}</a>
    <p className="sr-only" role="status" aria-live="polite">{loading ? copy.scanning : errorResult ? technicalOutcome?.title : result ? copy.results : ""}</p>
    <header className="topbar">
      <a className="brand" href="#top" aria-label={copy.home}><span className="brand-mark">V</span><span><strong>VibeFootprint</strong><small>{copy.subtitle}</small></span></a>
      <nav aria-label="Primary navigation"><a href="#scanner">{copy.scan}</a><Link href="/insights">Insights</Link><Link href="/guides">Guides</Link><Link className="method-link" href="/methodology">{copy.methodology}</Link></nav>
    </header>

    <section className="hero" id="scanner" tabIndex={-1}>
      <div className="hero-copy">
        <p className="eyebrow">{copy.heroEyebrow}</p>
        <h1>{copy.heroTitle}</h1>
        <p className="lede">{copy.heroLede}</p>
        <p className="hero-trust"><span aria-hidden="true">✓</span> {copy.heroTrust}</p>
      </div>

      <form className="scan-panel" onSubmit={scan} aria-busy={loading}>
        <div className="scan-heading"><span>01</span><div><h2>{copy.scanTitle}</h2><p>{language === "de" ? "Öffentliche URL eingeben – der sichere Scan und die Report-Aufbereitung dauern etwa 10 Sekunden." : copy.scanDescription}</p></div></div>
        <label htmlFor="url">{copy.urlLabel}</label>
        <input id="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder={copy.placeholder} autoComplete="url" inputMode="url" required />
        <div className="scan-actions"><button disabled={loading}><span>{loading ? retryAttempt ? copy.retrying : copy.scanning : copy.startScan}</span><b aria-hidden="true">→</b></button>{loading && <button className="cancel-button" type="button" onClick={cancelScan}>{copy.cancel}</button>}</div>
        {loading && <div className="scan-progress" role="status" aria-live="polite">
          <div className="scan-progress-heading"><strong>{scanProgressCopy.title}</strong><span>{scanProgress}%</span></div>
          <div className="scan-progress-track" aria-hidden="true"><i style={{ width: `${scanProgress}%` }} /></div>
          <p>{activeScanStage}</p>
          <small>{scanProgressCopy.estimated}</small>
        </div>}
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
            <p className="score-kind">{copy.footprintScoreType} · <span>{copy.footprintSeparate}</span></p>
            <h2>{result.vibeScore.band.label}</h2>
            {resultHost && <p className="result-target">{copy.analyzed}: <strong>{resultHost}</strong></p>}
            <p>{result.vibeScore.band.summary}</p>
            <div className="score-boundary"><strong>{copy.whatItMeans}</strong><span>{result.vibeScore.meaning} {result.vibeScore.caveat} <a href="#method">{copy.seeMethod}</a></span></div>
          </div>
          <div className="score-snapshot">
            <p>{copy.scanOverview}</p>
            <div><span>{copy.breadth}</span><strong className={`coverage-${result.evidenceCoverage?.level || "standard"}`}>{result.evidenceCoverage?.label || "Standard"}</strong></div>
            <div><span>{copy.securityBaseline}</span><strong className={securityTone(result.security.score)}>{result.security.score}<small>/100</small></strong></div>
            <div><span>{language === "en" ? "Categories with observations" : "Kategorien mit Hinweisen"}</span><strong>{result.categoryOverview?.filter((item) => item.issueCount > 0).length || 0}<small>/5</small></strong></div>
          </div>
        </div>

        {result.evidenceCoverage && <aside className={`coverage-note coverage-${result.evidenceCoverage.level}`}><div><strong>{copy.breadth}: {result.evidenceCoverage.label}</strong><p>{result.evidenceCoverage.summary}</p></div><span>{copy.noBonus}</span></aside>}

        <div className="score-scale" aria-label={language === "en" ? `Score ${score} on a scale from 0 to 100` : `Score ${score} auf einer Skala von 0 bis 100`}>
          <div className="scale-labels"><span>{language === "en" ? "Lower footprint" : "Niedriger Footprint"}</span><strong>{score}/100</strong><span>{language === "en" ? "Very high footprint" : "Sehr hoher Footprint"}</span></div>
          <div className="scale-track"><i style={{ width: `${score}%` }} /><b style={{ left: `${score}%` }} /></div>
        </div>

        <section className="customer-report" aria-labelledby="customer-report-title">
          <div className="report-heading"><div><p className="eyebrow">{copy.reportEyebrow}</p><h2 id="customer-report-title">{copy.reportTitle}</h2></div><p>{freeTestingReport ? (language === "en" ? "The free result shows both independent scores and the categories that need attention. The complete report is available below during product testing." : "Das kostenlose Ergebnis zeigt beide unabhängigen Scores und betroffene Oberkategorien. Während des Produkttests ist der vollständige Report unten verfügbar.") : copy.reportDescription}</p></div>
          <div className="report-score-pair">
            <article className={footprintTone(result.vibeScore.band.id)}><span>01 · {copy.reportFootprint}</span><strong>{score}<small>/100</small></strong><p>{result.vibeScore.band.label} · {language === "en" ? "higher means more similarity" : "höher bedeutet mehr Ähnlichkeit"}</p></article>
            <div className="report-score-separator" aria-hidden="true"><span>{language === "en" ? "Separate scores" : "Getrennte Scores"}</span></div>
            <article className={securityTone(result.security.score)}><span>02 · {copy.reportSecurity}</span><strong>{result.security.score}<small>/100</small></strong><p>{copy.headerProtection} · {language === "en" ? "higher is better" : "höher ist besser"}</p></article>
          </div>
          <p className="report-independence"><span aria-hidden="true">✓</span>{copy.reportIndependent}</p>
          <div className="report-actions">
            <button type="button" onClick={() => void shareCustomerReport()}>{copy.shareReport}</button>
            <button type="button" onClick={() => void copyCustomerReport()}>{copy.copyReport}</button>
            <button type="button" onClick={downloadCustomerReport}>{copy.downloadReport}</button>
            <button type="button" onClick={() => window.print()}>{copy.printReport}</button>
          </div>
          <p className="report-status" role="status" aria-live="polite">{reportStatus}</p>
        </section>

        <section className="local-comparison" aria-labelledby="local-comparison-title">
          <div className="local-comparison-heading"><div><p className="eyebrow">{copy.comparisonEyebrow}</p><h2 id="local-comparison-title">{copy.comparisonTitle}</h2></div><p>{copy.comparisonDescription}</p></div>
          {localComparison ? <>
            <div className="comparison-grid">
              <article><span>{copy.comparisonFootprint}</span><strong>{signed(localComparison.footprintChange)}</strong><small>/100</small></article>
              <article><span>{copy.comparisonSecurity}</span><strong>{signed(localComparison.securityChange)}</strong><small>/100</small></article>
              <article><span>{copy.comparisonIssues}</span><strong>{signed(localComparison.observedIssueChange)}</strong><small>{language === "en" ? "count" : "Anzahl"}</small></article>
            </div>
            <p className="comparison-meta">{copy.previousScanAt}: {new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(localComparison.previousAnalyzedAt))}</p>
            {!localComparison.sameEvidenceBreadth && <p className="comparison-warning"><span aria-hidden="true">!</span>{copy.comparisonBreadthChanged}</p>}
            <p className="comparison-caveat">{copy.comparisonCaveat}</p>
          </> : <p className="comparison-empty">{copy.comparisonEmpty}</p>}
          <button type="button" className="clear-history-button" onClick={clearCurrentHostHistory}>{copy.clearHistory}</button>
          <p className="report-status" role="status" aria-live="polite">{historyStatus}</p>
        </section>

        <section className="category-overview" aria-labelledby="category-overview-title">
          <div className="section-heading"><div><p className="eyebrow">{language === "en" ? "Actionable findings" : "Handlungsorientierte Findings"}</p><h2 id="category-overview-title">{language === "en" ? "Quality and security issues" : "Qualitäts- und Sicherheitsprobleme"}</h2></div><p>{language === "en" ? "These counts show concrete public-surface findings. They are independent from the pattern-similarity score." : "Diese Zahlen zeigen konkrete Findings der öffentlichen Oberfläche. Sie sind unabhängig vom Musterähnlichkeits-Score."}</p></div>
          <aside className="score-findings-boundary">
            <div className={footprintTone(result.vibeScore.band.id)}><span>{score}/100</span><p><strong>{language === "en" ? "Pattern similarity" : "Musterähnlichkeit"}</strong>{language === "en" ? `${reportedDriverCount || "Multiple"} visible model influences explain why the site resembles the reference corpus. This is not a defect count.` : `${reportedDriverCount || "Mehrere"} sichtbare Modelltreiber erklären die Ähnlichkeit mit dem Referenzkorpus. Dies ist keine Fehleranzahl.`}</p></div>
            <div className={observedIssueCount ? "tone-findings-review" : "tone-findings-clear"}><span>{observedIssueCount}</span><p><strong>{language === "en" ? "Observed issues" : "Beobachtete Probleme"}</strong>{language === "en" ? "Only concrete quality or security findings appear in the categories below. A high footprint does not automatically create more issues." : "Unten erscheinen nur konkrete Qualitäts- oder Security-Findings. Ein hoher Footprint erzeugt nicht automatisch mehr Probleme."}</p></div>
          </aside>
          <div className="category-overview-grid">
            {categoryIds.map((id, index) => {
              const item = result.categoryOverview?.find((entry) => entry.id === id) || { id, issueCount: 0, status: "no-observed-issue" as const };
              const statusLabel = item.status === "attention" ? copy.attention : item.status === "review" ? copy.reviewCategory : copy.clearCategory;
              return <article key={id} className={`category-card category-${item.status}`}>
                <div><span>{String(index + 1).padStart(2, "0")}</span><b>{statusLabel}</b></div>
                <h3>{categoryLabels[id]}</h3>
                <p>{item.issueCount ? <><strong>{item.issueCount}</strong> {item.issueCount === 1 ? copy.issue : copy.issues}</> : copy.clearCategory}</p>
              </article>;
            })}
          </div>
        </section>

        {freeTestingReport ? <section className="testing-report" aria-labelledby="testing-report-title">
          <div>
            <p className="eyebrow">{language === "en" ? "Free testing version" : "Kostenlose Testversion"}</p>
            <span className="testing-report-badge"><i aria-hidden="true">✓</i>{language === "en" ? "Full report included" : "Vollständiger Report enthalten"}</span>
            <h2 id="testing-report-title">{language === "en" ? "Full report enabled for feedback" : "Vollständiger Report für Feedback freigeschaltet"}</h2>
            <p>{language === "en" ? "During this testing phase, the complete real report is available without checkout or an access key. Please review the findings, prompts and exports and share what is unclear or missing." : "Während dieser Testphase ist der echte vollständige Report ohne Checkout oder Zugangsschlüssel verfügbar. Bitte prüfe Findings, Prompts und Exporte und teile uns mit, was unklar ist oder fehlt."}</p>
          </div>
          <button type="button" disabled={!adminReport} onClick={() => setAdminReportOpen(true)}>{language === "en" ? "Open full report" : "Vollständigen Report öffnen"}<span aria-hidden="true">↗</span></button>
        </section> : <section className="locked-report" aria-labelledby="locked-report-title">
          <div className="locked-report-copy">
            <p className="eyebrow">{copy.lockedEyebrow}</p>
            <span className="locked-badge"><i aria-hidden="true">!</i>{copy.lockedBadge}</span>
            <h2 id="locked-report-title">{copy.lockedTitle}</h2>
            <p>{copy.lockedDescription}</p>
            <strong>{copy.lockedIncludes}</strong>
            <ul>{copy.lockedItems.map((item) => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}</ul>
            <div className="locked-actions"><button className="preview-report-button" type="button" onClick={() => setSampleReportOpen(true)}>{copy.previewReport}<span aria-hidden="true">↗</span></button><button type="button" onClick={() => setPurchaseNotice(copy.checkoutPending)}>{copy.unlock}<span aria-hidden="true">→</span></button></div>
            <p className="purchase-notice" role="status" aria-live="polite">{purchaseNotice}</p>
            <details className="admin-report-access">
              <summary>{copy.adminAccess}<span aria-hidden="true">+</span></summary>
              <form onSubmit={runAdminScan}>
                <p>{copy.adminDescription}</p>
                <label htmlFor="admin-preview-key">{copy.adminKey}</label>
                <div className="admin-key-row"><input id="admin-preview-key" type="password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} placeholder={copy.adminPlaceholder} autoComplete="off" minLength={24} required /><button type="submit" disabled={loading || adminKey.trim().length < 24}>{loading && adminKey ? copy.adminRunning : copy.adminRun}</button></div>
                <small>{copy.adminPrivacy}</small>
                {adminReport && <button className="admin-open-report" type="button" onClick={() => setAdminReportOpen(true)}>{copy.adminOpen}<span aria-hidden="true">↗</span></button>}
              </form>
            </details>
          </div>
          <div className="locked-preview" aria-label={copy.lockedBadge}>
            <div className="locked-preview-document" aria-hidden="true">
              <header className="preview-report-header"><div><span>V</span><p>VibeFootprint<strong>{language === "en" ? "Full diagnostic report" : "Vollständiger Diagnosebericht"}</strong></p></div><small>{resultHost}</small></header>
              <section className="preview-report-summary">
                <div className="preview-section-heading"><span>{premiumSections[0].number}</span><strong>{premiumSections[0].label}</strong></div>
                <div className="preview-score-cards"><article><small>VIBE-FOOTPRINT</small><strong>{score}<i>/100</i></strong><span className="preview-line preview-line-medium" /></article><article><small>SECURITY BASELINE</small><strong>{result.security.score}<i>/100</i></strong><span className="preview-line preview-line-short" /></article></div>
              </section>
              <section className="preview-report-section preview-report-findings">
                <div className="preview-section-heading"><span>{premiumSections[1].number}</span><strong>{premiumSections[1].label}</strong></div>
                <div className="preview-finding"><b>!</b><div><i className="preview-line preview-line-medium" /><i className="preview-line preview-line-long" /></div><em>CRITICAL</em></div>
                <div className="preview-finding preview-finding-warning"><b>!</b><div><i className="preview-line preview-line-long" /><i className="preview-line preview-line-medium" /></div><em>REVIEW</em></div>
              </section>
              <section className="preview-report-section preview-report-drivers">
                <div className="preview-section-heading"><span>{premiumSections[2].number}</span><strong>{premiumSections[2].label}</strong></div>
                <div className="preview-driver-columns"><div><b>✓</b><i className="preview-line preview-line-long" /><i className="preview-line preview-line-medium" /><i className="preview-line preview-line-long" /></div><div><b>!</b><i className="preview-line preview-line-medium" /><i className="preview-line preview-line-long" /><i className="preview-line preview-line-short" /></div></div>
              </section>
              <footer className="preview-report-index">{premiumSections.slice(3).map((section) => <div key={section.id}><span>{section.number}</span><strong>{section.label}</strong></div>)}</footer>
            </div>
            <div className="locked-preview-overlay"><span aria-hidden="true">🔒</span><strong>{copy.lockedBadge}</strong></div>
          </div>
        </section>}

        {sampleReportOpen && <AccessibleDialog labelledBy="sample-report-title" className="sample-report-modal" onClose={() => setSampleReportOpen(false)}>
            <header className="sample-report-topbar"><div><span>V</span><p>VibeFootprint<strong id="sample-report-title">{language === "en" ? "Full diagnostic report" : "Vollständiger Diagnosebericht"}</strong></p></div><button type="button" onClick={() => setSampleReportOpen(false)} aria-label={copy.closePreview}>×</button></header>
            <aside className="sample-report-notice"><strong>{copy.sampleLabel}</strong><span>{copy.sampleNotice}</span></aside>
            <div className="sample-report-body">
              <section className="sample-report-block sample-report-executive"><div className="sample-report-section-title"><span>{premiumSections[0].number}</span><h2>{premiumSections[0].label}</h2></div><p>{copy.sampleExecutive}</p><div className="sample-report-scores"><article className={footprintTone(result.vibeScore.band.id)}><small>VIBE-FOOTPRINT</small><strong>{score}<i>/100</i></strong><span>{result.vibeScore.band.label}</span></article><article className={securityTone(result.security.score)}><small>SECURITY BASELINE</small><strong>{result.security.score}<i>/100</i></strong><span>{copy.headerProtection}</span></article></div></section>
              <section className="sample-report-block"><div className="sample-report-section-title"><span>{premiumSections[1].number}</span><h2>{premiumSections[1].label}</h2></div><div className="sample-report-findings"><article><span>01</span><div><small>DESIGN · EXAMPLE</small><h3>{copy.sampleFindingOne}</h3><p>{copy.sampleFindingOneText}</p></div><b>{language === "en" ? "PRIORITY" : "PRIORITÄT"}</b></article><article><span>02</span><div><small>SECURITY · EXAMPLE</small><h3>{copy.sampleFindingTwo}</h3><p>{copy.sampleFindingTwoText}</p></div><b>{language === "en" ? "REVIEW" : "PRÜFEN"}</b></article></div></section>
              <div className="sample-report-lower-grid">
                <section className="sample-report-block"><div className="sample-report-section-title"><span>{premiumSections[2].number}</span><h2>{premiumSections[2].label}</h2></div><p>{copy.sampleFindingTwoText}</p><div className="sample-status-row"><span>HTTPS</span><b>{language === "en" ? "Effective" : "Wirksam"}</b></div><div className="sample-status-row"><span>Content Security Policy</span><b>{language === "en" ? "Review" : "Prüfen"}</b></div></section>
                <section className="sample-report-block"><div className="sample-report-section-title"><span>{premiumSections[3].number}</span><h2>{premiumSections[3].label}</h2></div><ol>{copy.samplePlan.map((item) => <li key={item}>{item}</li>)}</ol></section>
              </div>
              <section className="sample-report-block"><div className="sample-report-section-title"><span>{premiumSections[4].number}</span><h2>{premiumSections[4].label}</h2></div><div className="sample-report-driver-grid"><article><b>↑</b><div><strong>{language === "en" ? "Raises similarity" : "Erhöht Ähnlichkeit"}</strong><p>{copy.sampleDriverUp}</p></div></article><article><b>↓</b><div><strong>{language === "en" ? "Lowers similarity" : "Senkt Ähnlichkeit"}</strong><p>{copy.sampleDriverDown}</p></div></article></div></section>
              <section className="sample-report-block"><div className="sample-report-section-title"><span>{premiumSections[5].number}</span><h2>{premiumSections[5].label}</h2></div><div className="sample-status-row"><span>{language === "en" ? "Document title" : "Dokumenttitel"}</span><b>{language === "en" ? "Observed" : "Beobachtet"}</b></div><div className="sample-status-row"><span>{language === "en" ? "Open Graph metadata" : "Open-Graph-Metadaten"}</span><b>{language === "en" ? "Review" : "Prüfen"}</b></div></section>
              <section className="sample-report-block sample-report-appendix"><div className="sample-report-section-title"><span>{premiumSections[6].number}</span><h2>{premiumSections[6].label}</h2></div><p>{copy.sampleAppendix}</p><dl><div><dt>{copy.breadth}</dt><dd>{result.evidenceCoverage?.label || "Standard"}</dd></div><div><dt>{language === "en" ? "Source" : "Quelle"}</dt><dd>{language === "en" ? "Public surface only" : "Nur öffentliche Oberfläche"}</dd></div><div><dt>{language === "en" ? "Score relationship" : "Score-Beziehung"}</dt><dd>{language === "en" ? "Independent" : "Unabhängig"}</dd></div></dl></section>
            </div>
            <footer className="sample-report-footer"><span>{resultHost}</span><button type="button" onClick={() => setSampleReportOpen(false)}>{copy.closePreview}</button></footer>
        </AccessibleDialog>}

        {adminReportOpen && adminReport && <AccessibleDialog labelledBy="admin-report-title" className="sample-report-modal admin-full-report" backdropClassName="admin-report-backdrop" onClose={() => setAdminReportOpen(false)}>
            <header className="sample-report-topbar"><div><span>V</span><p>VibeFootprint<strong id="admin-report-title">{language === "en" ? "Full diagnostic report" : "Vollständiger Diagnosebericht"}</strong></p></div><button type="button" onClick={() => setAdminReportOpen(false)} aria-label={freeTestingReport ? (language === "en" ? "Close full report" : "Vollständigen Report schließen") : copy.adminClose}>×</button></header>
            <aside className="sample-report-notice admin-report-notice"><strong>{freeTestingReport ? (language === "en" ? "Free test report · actual scan data" : "Kostenloser Testreport · echte Scan-Daten") : copy.adminAuthorized}</strong><span>{adminReport.target}</span></aside>
            <div className="admin-report-export-bar"><div><button type="button" onClick={downloadAdminMarkdown}>{language === "en" ? "Download Markdown" : "Markdown herunterladen"}</button><button type="button" onClick={printAdminReport}>{language === "en" ? "Print / Save PDF" : "Drucken / Als PDF sichern"}</button></div><p role="status" aria-live="polite">{adminReportStatus}</p></div>
            <div className="sample-report-body">
              <section className="sample-report-block sample-report-executive">
                <div className="sample-report-section-title"><span>{premiumSections[0].number}</span><h2>{premiumSections[0].label}</h2></div>
                <p>{result.vibeScore.band.summary}</p>
                <div className="sample-report-scores">
                  <article className={footprintTone(result.vibeScore.band.id)}><small>VIBE-FOOTPRINT · {language === "en" ? "MORE SIMILARITY" : "MEHR ÄHNLICHKEIT"}</small><strong>{score}<i>/100</i></strong><span>{result.vibeScore.band.label} · {language === "en" ? "not a defect count" : "keine Fehleranzahl"}</span></article>
                  <article className={securityTone(adminReport.security.score)}><small>SECURITY BASELINE · {language === "en" ? "HIGHER IS BETTER" : "HÖHER IST BESSER"}</small><strong>{adminReport.security.score}<i>/100</i></strong><span>{copy.headerProtection}</span></article>
                </div>
                <div className="admin-score-explanation">
                  <article><strong>{language === "en" ? `Why is the footprint ${score}?` : `Warum liegt der Footprint bei ${score}?`}</strong><p>{language === "en" ? `${reportedDriverCount} reported model influences shape the similarity result. The strongest upward influences are shown here; the complete two-sided explanation remains in section 05.` : `${reportedDriverCount} ausgewiesene Modelltreiber prägen das Ähnlichkeitsergebnis. Die stärksten Treiber nach oben stehen hier; die vollständige Erklärung in beide Richtungen folgt in Abschnitt 05.`}</p><ul>{adminReport.scoreDrivers.raises.slice(0, 3).map((driver) => <li key={driver.feature}>{driver.label}</li>)}</ul></article>
                  <article><strong>{language === "en" ? `Why only ${observedFindingCount} actionable issue${observedFindingCount === 1 ? "" : "s"}?` : `Warum nur ${observedFindingCount} konkrete${observedFindingCount === 1 ? "s" : ""} Finding${observedFindingCount === 1 ? "" : "s"}?`}</strong><p>{language === "en" ? `Score drivers measure similarity. Findings require separate, concrete public evidence. The report found ${observedFindingCount} actionable finding${observedFindingCount === 1 ? "" : "s"} and ${guidanceFindingCount} optional manual review${guidanceFindingCount === 1 ? "" : "s"}; it does not invent defects to match a high score.` : `Score-Treiber messen Ähnlichkeit. Findings benötigen separate konkrete öffentliche Evidenz. Der Report enthält ${observedFindingCount} konkrete Findings und ${guidanceFindingCount} optionale manuelle Prüfungen; er erfindet keine Probleme passend zu einem hohen Score.`}</p></article>
                </div>
                <p className="admin-report-boundary">{language === "en" ? adminReport.boundary.note : "Dieser Diagnosebericht belegt weder Codeherkunft, Anteil generierten Codes, Autorenschaft noch Kausalität."}</p>
              </section>

              <section className="sample-report-block"><div className="sample-report-section-title"><span>{premiumSections[1].number}</span><h2>{premiumSections[1].label}</h2></div><p>{language === "en" ? `This section contains ${observedFindingCount} evidence-backed action item${observedFindingCount === 1 ? "" : "s"} plus ${guidanceFindingCount} optional manual review${guidanceFindingCount === 1 ? "" : "s"}. It is deliberately independent from the ${score}/100 similarity score.` : `Dieser Abschnitt enthält ${observedFindingCount} evidenzbasierte Maßnahmen und ${guidanceFindingCount} optionale manuelle Prüfungen. Er ist bewusst unabhängig vom Ähnlichkeits-Score von ${score}/100.`}</p><div className="admin-findings">{adminReport.recommendations.length ? adminReport.recommendations.map((finding, index) => <article className={`admin-finding priority-${finding.priority} basis-${finding.basis}`} key={finding.id}><div className="admin-finding-index">{String(index + 1).padStart(2, "0")}</div><div><small>{categoryLabels[finding.category]} · {finding.id} · {finding.basis === "observed" ? copy.reportObserved : copy.reportGuidance}</small><h3>{finding.title}</h3><p><strong>{copy.reportWhy}:</strong> {finding.why}</p><p><strong>{copy.reportAction}:</strong> {finding.action}</p></div><b>{finding.basis === "observed" ? finding.priority.toUpperCase() : language === "en" ? "OPTIONAL" : "OPTIONAL"}</b></article>) : <p>{copy.reportNoFindings}</p>}</div></section>

              <section className="sample-report-block"><div className="sample-report-section-title"><span>{premiumSections[2].number}</span><h2>{premiumSections[2].label}</h2></div><div className="admin-security-grid">{adminReport.security.checks.map((check) => <article className={`admin-security-check status-${check.status}`} key={check.id}><div><span aria-hidden="true">{check.status === "pass" ? "✓" : "!"}</span><h3>{check.title}</h3><b>{check.status === "pass" ? copy.effective : check.status === "warn" ? copy.review : copy.missing}</b></div><p>{check.detail}</p><small><strong>{copy.reportAction}:</strong> {check.action}</small></article>)}</div></section>

              <section className="sample-report-block"><div className="sample-report-section-title"><span>{premiumSections[3].number}</span><h2>{premiumSections[3].label}</h2></div><h3 className="admin-subheading">{copy.reportFixPrompts}</h3><p>{language === "en" ? `${adminReport.fixPacks[language].length} remediation prompt${adminReport.fixPacks[language].length === 1 ? " was" : "s were"} generated from ${observedFindingCount} observed actionable finding${observedFindingCount === 1 ? "" : "s"}. We do not fabricate fixes for categories without evidence.` : `${adminReport.fixPacks[language].length} Behebungs-Prompts wurden aus ${observedFindingCount} beobachteten konkreten Findings erzeugt. Für Kategorien ohne Evidenz werden keine Fixes erfunden.`}</p><div className="admin-fix-prompts">{adminReport.fixPacks[language].map((item, index) => <article className="admin-prompt-card" key={item.id}><header><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.id}</strong><button type="button" onClick={() => void copyAdminPrompt(item.prompt, item.id)}>{language === "en" ? "Copy prompt" : "Prompt kopieren"}</button></header><details><summary><span>{language === "en" ? "View full prompt" : "Vollständigen Prompt ansehen"}</span><b>+</b></summary><pre>{item.prompt}</pre></details></article>)}</div>{distinctivenessPrompt && <div className="admin-optional-review"><h3>{language === "en" ? "Optional distinctiveness review" : "Optionale Eigenständigkeitsprüfung"}</h3><p>{language === "en" ? `Because the footprint is ${score}/100, this separate review prompt turns the strongest score drivers into a brand and usability review. It is not a defect fix and must not be used to hide evidence.` : `Weil der Footprint bei ${score}/100 liegt, überführt dieser separate Prüf-Prompt die stärksten Score-Treiber in eine Brand- und Usability-Prüfung. Er ist kein Fehler-Fix und darf nicht zum Verbergen von Evidenz dienen.`}</p><article className="admin-prompt-card optional-review-card"><header><span>R</span><strong>VF-REVIEW-DISTINCTIVENESS</strong><button type="button" onClick={() => void copyAdminPrompt(distinctivenessPrompt, "VF-REVIEW-DISTINCTIVENESS")}>{language === "en" ? "Copy review prompt" : "Prüf-Prompt kopieren"}</button></header><details><summary><span>{language === "en" ? "View full review prompt" : "Vollständigen Prüf-Prompt ansehen"}</span><b>+</b></summary><pre>{distinctivenessPrompt}</pre></details></article></div>}</section>

              <section className="sample-report-block"><div className="sample-report-section-title"><span>{premiumSections[4].number}</span><h2>{premiumSections[4].label}</h2></div><p>{language === "en" ? "These are relative model influences, not points on the 0–100 scale. They appear after the actionable report as an explanation of how the score was shaped." : "Dies sind relative Modelleinflüsse, keine Punkte auf der 0–100-Skala. Sie stehen nach dem handlungsorientierten Report als Erklärung dafür, wie der Score geprägt wurde."}</p><div className="admin-driver-columns"><article><h3><b aria-hidden="true">↑</b>{copy.raises}</h3>{adminReport.scoreDrivers.raises.length ? adminReport.scoreDrivers.raises.map((driver) => <div className="admin-driver" key={driver.feature}><strong>{driver.label}</strong><p>{driver.description}</p><small>{language === "en" ? "Relative model influence" : "Relative Modellwirkung"}: {Math.abs(driver.contribution).toFixed(2)}</small></div>) : <p>{copy.reportNoDrivers}</p>}</article><article><h3><b aria-hidden="true">↓</b>{copy.lowers}</h3>{adminReport.scoreDrivers.lowers.length ? adminReport.scoreDrivers.lowers.map((driver) => <div className="admin-driver" key={driver.feature}><strong>{driver.label}</strong><p>{driver.description}</p><small>{language === "en" ? "Relative model influence" : "Relative Modellwirkung"}: {Math.abs(driver.contribution).toFixed(2)}</small></div>) : <p>{copy.reportNoDrivers}</p>}</article></div></section>

              <section className="sample-report-block"><div className="sample-report-section-title"><span>{premiumSections[5].number}</span><h2>{premiumSections[5].label}</h2></div><div className="admin-launch-grid">{adminReport.launchCheck.checks.map((rawCheck) => { const check = presentLaunchCheck(rawCheck, language); return <article className={`status-${check.status === "attention" ? "fail" : check.status === "review" ? "warn" : "pass"}`} key={check.id}><b>{check.status === "pass" ? "✓" : "!"}</b><div><strong>{check.label}</strong><p>{check.detail}</p></div></article>; })}</div></section>

              <section className="sample-report-block sample-report-appendix"><div className="sample-report-section-title"><span>{premiumSections[6].number}</span><h2>{premiumSections[6].label}</h2></div><p>{copy.reportEvidence}</p><dl><div><dt>{copy.breadth}</dt><dd>{result.evidenceCoverage?.label || "Standard"}</dd></div><div><dt>{copy.directEvidence}</dt><dd>{adminReport.evidence.directEvidence.length}</dd></div><div><dt>{copy.stackContext}</dt><dd>{adminReport.evidence.stackSignals.length + adminReport.evidence.contextEvidence.length}</dd></div><div><dt>{copy.loaded}</dt><dd>{adminReport.evidence.assetScan.fetched}/{adminReport.evidence.assetScan.selected}</dd></div><div><dt>{language === "en" ? "Launch checks" : "Launch-Prüfungen"}</dt><dd>{adminReport.launchCheck.counts.pass}/{adminReport.launchCheck.checks.length} {language === "en" ? "passed" : "wirksam"}</dd></div><div><dt>{copy.time}</dt><dd>{new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(adminReport.generatedAt))}</dd></div></dl><details className="admin-technical-details"><summary>{language === "en" ? "View metric snapshot" : "Messwert-Snapshot ansehen"}</summary><pre>{JSON.stringify({ pageMetrics: adminReport.evidence.pageMetrics, extendedMetrics: adminReport.evidence.extendedMetrics, scanMetrics: adminReport.evidence.scanMetrics }, null, 2)}</pre></details></section>
            </div>
            <footer className="sample-report-footer"><span>{resultHost}</span><button type="button" onClick={() => setAdminReportOpen(false)}>{freeTestingReport ? (language === "en" ? "Close full report" : "Vollständigen Report schließen") : copy.adminClose}</button></footer>
        </AccessibleDialog>}
      </> : null}
    </section>}

    <section className="method" id="method">
      <div className="section-heading"><div><p className="eyebrow">{copy.methodEyebrow}</p><h2>{copy.methodTitle}</h2></div><p>{copy.methodDescription}</p></div>
      <div className="method-grid">
        <article><span>01</span><h3>{copy.methodOneTitle}</h3><p>{copy.methodOneText}</p><small className="method-tag">PUBLIC SURFACE</small></article>
        <article><span>02</span><h3>{copy.methodTwoTitle}</h3><p>{copy.methodTwoText}</p><small className="method-tag">QUALITATIVE INDEX</small></article>
        <article><span>03</span><h3>{copy.methodThreeTitle}</h3><p>{copy.methodThreeText}</p><small className="method-tag">ACTIONABLE OUTPUT</small></article>
      </div>
      <details className="method-limitations">
        <summary><span>{copy.limitationsTitle}</span><b aria-hidden="true">+</b></summary>
        <div><p>{copy.limitationsIntro}</p><ul>{copy.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </details>
      <aside className="method-evaluation-boundary">
        <strong>Evaluation boundary</strong>
        <p>VibeFootprint uses the frozen v0.4 reference corpus. It measures public-pattern similarity—not authorship or generated-code share. Historical metrics remain documented for provenance and are not a current performance claim.</p>
      </aside>
      <nav className="seo-discovery-links" aria-label="VibeFootprint guides">
        <Link className="guide-library-link" href="/guides"><span><small>Guide library</small><strong>95 practical website guides</strong></span><b aria-hidden="true">→</b></Link>
        <Link href="/guides/security"><span><small>01</small><strong>Website security</strong></span><b aria-hidden="true">→</b></Link>
        <Link href="/guides/design"><span><small>02</small><strong>Design distinctiveness</strong></span><b aria-hidden="true">→</b></Link>
        <Link href="/guides/engineering"><span><small>03</small><strong>Frontend engineering</strong></span><b aria-hidden="true">→</b></Link>
      </nav>
    </section>

    <footer><Link className="brand footer-brand" href="/"><span className="brand-mark">V</span><span><strong>VibeFootprint</strong><small>{copy.subtitle}</small></span></Link><p>{copy.footerLine} · Product {release.productVersion} · Model {release.displayVersion}</p><nav aria-label="Footer navigation"><Link href="/about">About</Link><Link href="/insights">Insights</Link><Link href="/guides">Guides</Link><Link href="/methodology">Methodology & limits</Link></nav></footer>
  </main>;
}
