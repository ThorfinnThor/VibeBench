const encoder = new TextEncoder();
const count = (text, pattern) => (text.match(pattern) || []).length;

export function collectProductionExtendedMetrics(html, assetText) {
  const combined = `${html}\n${assetText}`;
  const visible = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = visible.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) || [];
  const classValues = [...html.matchAll(/\sclass=["']([^"']*)["']/gi)].map((match) => match[1]);
  const classTokens = classValues.flatMap((value) => value.split(/\s+/).filter(Boolean));
  const externalHosts = new Set([...combined.matchAll(/(?:https?:)?\/\/([a-z0-9.-]+)(?=[:/"'`\s)])/gi)].map((match) => match[1].toLowerCase().replace(/^www\./, "")));
  const shadcnVariables = ["background", "foreground", "card", "popover", "primary", "secondary", "muted", "accent", "destructive", "border", "input", "ring", "radius"];
  return {
    html_bytes: encoder.encode(html).length,
    visible_text_chars: visible.length,
    visible_words: words.length,
    unique_visible_words: new Set(words).size,
    paragraphs: count(html, /<p\b/gi),
    sections: count(html, /<section\b/gi),
    anchors: count(html, /<a\b/gi),
    navs: count(html, /<nav\b/gi),
    footers: count(html, /<footer\b/gi),
    dialogs: count(html, /<(?:dialog)\b|role=["']dialog/gi),
    tables: count(html, /<table\b/gi),
    code_blocks: count(html, /<(?:pre|code)\b/gi),
    canvases: count(html, /<canvas\b/gi),
    videos: count(html, /<video\b/gi),
    meta_tags: count(html, /<meta\b/gi),
    jsonld_scripts: count(html, /<script\b[^>]*application\/ld\+json/gi),
    comments: count(html, /<!--[\s\S]*?-->/g),
    id_attributes: count(html, /\sid=["']/gi),
    role_attributes: count(html, /\srole=["']/gi),
    alt_attributes: count(html, /\salt=["']/gi),
    custom_elements: count(html, /<[a-z][a-z0-9]*-[a-z0-9-]+\b/gi),
    tailwind_like_tokens: classTokens.filter((token) => /^(?:sm:|md:|lg:|xl:|2xl:|hover:|focus:|dark:|group-|peer-|bg-|text-|p[trblxy]?-|m[trblxy]?-|grid|flex|gap-|rounded|shadow|border|w-|h-|max-w-|min-h-)/.test(token)).length,
    arbitrary_class_tokens: classTokens.filter((token) => /\[[^\]]+\]/.test(token)).length,
    css_variables: count(combined, /--[a-z][a-z0-9-]*\s*:/gi),
    gradients: count(combined, /(?:linear|radial|conic)-gradient\s*\(/gi),
    keyframes: count(assetText, /@keyframes\b/gi),
    external_host_count: externalHosts.size,
    shadcn_variable_coverage: shadcnVariables.filter((name) => new RegExp(`--${name}\\s*:`, "i").test(combined)).length,
    data_slot_attributes: count(combined, /data-slot=/gi),
    radix_fingerprints: count(combined, /(?:data-radix-|radix-ui|@radix-ui)/gi),
    lucide_fingerprints: count(combined, /(?:lucide-react|lucide-|data-lucide)/gi),
    cva_fingerprints: count(combined, /(?:class-variance-authority|cva\()/gi),
    tailwind_merge_fingerprints: count(combined, /(?:tailwind-merge|twMerge)/gi),
    next_themes_fingerprints: count(combined, /next-themes/gi),
    sonner_fingerprints: count(combined, /\bsonner\b/gi),
    cmdk_fingerprints: count(combined, /\bcmdk\b/gi),
    recharts_fingerprints: count(combined, /\brecharts\b/gi),
    embla_fingerprints: count(combined, /embla-carousel/gi),
    tanstack_fingerprints: count(combined, /(?:@tanstack|react-query)/gi),
    react_hook_form_fingerprints: count(combined, /react-hook-form/gi),
    zod_fingerprints: count(combined, /(?:\bzod\b|z\.object\()/gi),
    framer_motion_fingerprints: count(combined, /framer-motion/gi),
    ui_cliche_tokens: count(combined, /(?:bg-gradient-to-|backdrop-blur|rounded-2xl|rounded-3xl|shadow-xl|min-h-screen|max-w-7xl|container mx-auto|animate-pulse|group-hover:|from-primary|to-primary)/gi),
    vite_fingerprints: count(combined, /(?:vite\/client|__vite|vite\.svg)/gi),
    next_fingerprints: count(combined, /(?:__next_data__|_next\/static|next-route-announcer)/gi)
  };
}

export function getScoreBand(score) {
  if (score >= 85) return { id: "very-high", label: "Sehr hoher Vibe-Footprint", shortLabel: "Sehr hoch", summary: "Viele öffentlich sichtbare Muster ähneln Websites aus dem validierten Vibecoding-Korpus." };
  if (score >= 70) return { id: "high", label: "Hoher Vibe-Footprint", shortLabel: "Hoch", summary: "Mehrere starke technische Muster sprechen für einen ausgeprägten Vibecoding-Footprint." };
  if (score >= 50) return { id: "medium", label: "Mittlerer Vibe-Footprint", shortLabel: "Mittel", summary: "Die Website zeigt eine gemischte Signatur aus typischen und unspezifischen Mustern." };
  if (score >= 25) return { id: "light", label: "Leichter Vibe-Footprint", shortLabel: "Leicht", summary: "Einige Muster sind sichtbar, die Gesamtähnlichkeit bleibt jedoch begrenzt." };
  return { id: "low", label: "Niedriger Vibe-Footprint", shortLabel: "Niedrig", summary: "Nur wenige öffentlich sichtbare Muster ähneln dem validierten Vibecoding-Korpus." };
}

const featureLabels = {
  "extended:shadcn_variable_coverage": "shadcn-ähnliche Design-Tokens",
  "extended:data_slot_attributes": "wiederkehrende data-slot-Komponenten",
  "extended:radix_fingerprints": "Radix-Komponenten-Fingerprints",
  "extended:lucide_fingerprints": "Lucide-Icon-Fingerprints",
  "extended:cva_fingerprints": "Class-Variance-Authority-Muster",
  "extended:tailwind_merge_fingerprints": "Tailwind-Merge-Muster",
  "extended:ui_cliche_tokens": "häufige AI-UI-Kompositionsmuster",
  "extended:vite_fingerprints": "Vite-Build-Fingerprints",
  "extended:next_fingerprints": "Next.js-Build-Fingerprints",
  "extended:css_variables": "CSS-Token-Dichte",
  "extended:visible_words": "sichtbare Content-Dichte",
  "extended:html_bytes": "HTML-Strukturgröße",
  "metric:asset_bytes_fetched": "Größe der untersuchten Assets",
  "metric:unique_class_tokens": "Vielfalt der CSS-Klassen",
  "metric:data_attributes": "Dichte der data-Attribute",
  "metric:aria_attributes": "Dichte der ARIA-Attribute",
  "artifact:any_direct": "direkter Builder-Marker",
  "hint:count": "kombinierte Strukturhinweise"
};

function readableFeature(name) {
  if (featureLabels[name]) return featureLabels[name];
  if (name.startsWith("stack:")) return `${name.slice(6)}-Stack`;
  return name.split(":").at(-1).replaceAll("_", " ");
}

export function explainScore(model, features) {
  return model.feature_names
    .map((name) => {
      const stat = model.standardization[name];
      const contribution = model.coefficients[name] * ((features[name] - stat.mean) / stat.standard_deviation);
      return { feature: name, label: readableFeature(name), contribution, direction: contribution >= 0 ? "raises" : "lowers" };
    })
    .filter((item) => Math.abs(item.contribution) >= 0.08)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
}

export function auditSecurity(url, headers) {
  const get = (name) => String(headers[name] || headers[name.toLowerCase()] || "");
  const csp = get("content-security-policy");
  const checks = [
    { id: "https", title: "HTTPS transport", status: new URL(url).protocol === "https:" ? "pass" : "fail", detail: new URL(url).protocol === "https:" ? "Die untersuchte Seite wurde verschlüsselt ausgeliefert." : "Die finale URL verwendet kein HTTPS.", action: "HTTPS erzwingen und HTTP dauerhaft auf HTTPS umleiten." },
    { id: "csp", title: "Content Security Policy", status: csp ? "pass" : "fail", detail: csp ? "Eine Content-Security-Policy ist gesetzt." : "Keine Content-Security-Policy im Hauptdokument gefunden.", action: "Eine restriktive CSP zunächst im Report-Only-Modus entwickeln und anschließend erzwingen." },
    { id: "hsts", title: "Strict Transport Security", status: get("strict-transport-security") ? "pass" : "warn", detail: get("strict-transport-security") ? "HSTS ist aktiv." : "Kein HSTS-Header gefunden.", action: "Nach vollständiger HTTPS-Migration HSTS mit einer vorsichtigen max-age aktivieren." },
    { id: "frame", title: "Clickjacking-Schutz", status: get("x-frame-options") || /frame-ancestors/i.test(csp) ? "pass" : "fail", detail: get("x-frame-options") || /frame-ancestors/i.test(csp) ? "Framing ist über Header oder CSP eingeschränkt." : "Kein sichtbarer Frame-Schutz gefunden.", action: "CSP frame-ancestors oder X-Frame-Options passend zur Einbettungsstrategie setzen." },
    { id: "nosniff", title: "MIME-Sniffing-Schutz", status: /nosniff/i.test(get("x-content-type-options")) ? "pass" : "warn", detail: /nosniff/i.test(get("x-content-type-options")) ? "X-Content-Type-Options ist korrekt gesetzt." : "X-Content-Type-Options: nosniff fehlt.", action: "X-Content-Type-Options auf nosniff setzen." },
    { id: "referrer", title: "Referrer Policy", status: get("referrer-policy") ? "pass" : "warn", detail: get("referrer-policy") ? "Eine Referrer-Policy ist gesetzt." : "Keine Referrer-Policy gefunden.", action: "Eine Policy wie strict-origin-when-cross-origin definieren." },
    { id: "permissions", title: "Permissions Policy", status: get("permissions-policy") ? "pass" : "warn", detail: get("permissions-policy") ? "Browser-Funktionen werden über Permissions-Policy begrenzt." : "Keine Permissions-Policy gefunden.", action: "Nicht benötigte Kamera-, Mikrofon-, Standort- und Sensorrechte explizit deaktivieren." }
  ];
  const weights = { pass: 1, warn: 0.45, fail: 0 };
  return { score: Math.round(100 * checks.reduce((sum, check) => sum + weights[check.status], 0) / checks.length), checks };
}

export function buildRecommendations({ analysis, pageMetrics, extendedMetrics, security }) {
  const recommendations = [];
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const add = (category, priority, title, why, action) => recommendations.push({ id: `${category}-${recommendations.length + 1}`, category, priority, title, why, action });
  for (const check of security.checks.filter((item) => item.status !== "pass")) {
    add("security", check.status === "fail" ? "high" : "medium", check.title, check.detail, check.action);
  }
  if (analysis.directEvidence.length) add("design", "high", "Builder-Artefakte aus dem Release entfernen", "Direkte Builder-Marker machen die Entstehungsweise öffentlich sichtbar.", "Tagger, Badges und Generator-Metadaten aus dem Produktions-Build entfernen und anschließend Assets neu erzeugen.");
  if (extendedMetrics.shadcn_variable_coverage >= 8 || extendedMetrics.data_slot_attributes >= 4) add("design", "high", "Das Standard-Component-System individualisieren", "Die ausgelieferten Design-Tokens und Komponenten ähneln stark verbreiteten Starter-Systemen.", "Eigene Typografie, Radien, Spacing, Zustände und Komponenten-Anatomie definieren – nicht nur Farben austauschen.");
  if (extendedMetrics.ui_cliche_tokens >= 8) add("design", "medium", "Generische AI-UI-Muster reduzieren", "Viele wiederkehrende Gradient-, Blur-, Shadow- und Rounded-Patterns erzeugen einen austauschbaren Eindruck.", "Pro Screen eine klare visuelle Idee wählen und dekorative Effekte entfernen, die keine Hierarchie oder Funktion tragen.");
  if (pageMetrics.asset_bytes_fetched > 900_000) add("engineering", "high", "JavaScript- und CSS-Payload verkleinern", "Die begrenzt untersuchten Same-Origin-Assets sind bereits groß und erhöhen Ladezeit sowie Angriffsfläche.", "Bundle-Analyse durchführen, unbenutzte Libraries entfernen, Routen splitten und schwere Komponenten lazy laden.");
  if (pageMetrics.inline_script_bytes > 80_000) add("engineering", "medium", "Inline-JavaScript reduzieren", "Große Inline-Skripte erschweren CSP, Caching und Wartbarkeit.", "Skripte in versionierte Module verschieben und eine nonce-/hash-basierte CSP einführen.");
  if ((pageMetrics.buttons + pageMetrics.inputs) > 4 && pageMetrics.aria_attributes < 2) add("accessibility", "high", "Interaktionen semantisch und zugänglich machen", "Die Seite enthält mehrere Controls, aber nur wenige sichtbare ARIA-Hinweise.", "Tastaturführung, Labels, Fokuszustände, Fehlermeldungen und Screenreader-Namen komponentenweise testen.");
  if (pageMetrics.headings < 2 || extendedMetrics.sections < 1) add("content", "medium", "Informationshierarchie schärfen", "Wenige semantische Überschriften oder Bereiche erschweren Orientierung und wirken wie ein unstrukturierter App-Shell.", "Eine klare H1–H3-Struktur, benannte Bereiche und kurze handlungsorientierte Texte ergänzen.");
  if (extendedMetrics.external_host_count > 20) add("security", "medium", "Drittanbieter-Abhängigkeiten begrenzen", "Viele externe Hosts vergrößern Datenschutz-, Supply-Chain- und CSP-Aufwand.", "Jeden Drittanbieter begründen, nicht benötigte Integrationen entfernen und erlaubte Origins in der CSP einschränken.");
  if (!recommendations.some((item) => item.category === "design")) add("design", "low", "Visuelle Sprache gegen Starter-Defaults prüfen", "Auch ohne starken Einzelmarker können Standard-Layouts, austauschbare Texte und unveränderte Komponenten eine Website generisch wirken lassen.", "Drei zentrale Screens manuell prüfen: eigene Typografie-Hierarchie, charakteristische Komponenten-Anatomie, konsistentes Spacing und eine klare visuelle Leitidee dokumentieren.");
  if (!recommendations.some((item) => item.category === "engineering")) add("engineering", "low", "Release-Hygiene als festen Check etablieren", "Ein öffentlicher Oberflächenscan kann Tests, Secrets, Abhängigkeiten und Fehlerpfade im Repository nicht vollständig beurteilen.", "Vor jedem Release Dependency-Audit, Secret-Scan, Typecheck, Tests, Bundle-Budget und eine kontrollierte Fehleransicht automatisiert ausführen.");
  if (!recommendations.some((item) => item.category === "accessibility")) add("accessibility", "low", "Accessibility-Smoke-Test durchführen", "Semantische Attribute allein belegen noch keine gute Bedienbarkeit mit Tastatur oder Screenreader.", "Kernflow nur mit Tastatur durchlaufen, Fokus sichtbar halten, Kontraste prüfen und Formulare mit einem Screenreader testen.");
  if (recommendations.length < 5) add("design", "low", "Manuellen Design- und Code-Review einplanen", "Automatische Signale erkennen Muster, aber keine Produktabsicht oder Codequalität vollständig.", "Kernflows mit Designer:in und erfahrenem Engineer prüfen: Hierarchie, Edge Cases, Security und wartbare Komponenten.");
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 10);
}
