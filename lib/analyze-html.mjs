const count = (html, pattern) => (html.match(pattern) || []).length;
const includesAny = (value, patterns) => patterns.some((pattern) => pattern.test(value));

const stackRules = [
  { name: "Next.js", patterns: [/_next\/static/i, /__next_data__/i, /x-powered-by:next\.?js/i] },
  { name: "React", patterns: [/data-reactroot/i, /react-dom/i, /react\.production/i] },
  { name: "Vite", patterns: [/\/assets\/index-[a-z0-9_-]+\.js/i, /vite\/client/i] },
  { name: "Tailwind CSS", patterns: [/--tw-/i, /tailwind/i] },
  { name: "Framer Motion", patterns: [/framer-motion/i, /data-framer-/i] },
  { name: "Radix UI", patterns: [/data-radix-/i, /radix-ui/i] },
  { name: "Lucide", patterns: [/lucide-/i, /data-lucide/i] },
  { name: "Supabase", patterns: [/supabase/i] },
  { name: "Firebase", patterns: [/firebase(app)?\.com/i, /firebaseapp\.com/i] }
];

function hasHeader(headers, name) {
  return Boolean(headers[name] || headers[name.toLowerCase()]);
}

function headerValue(headers, name) {
  return String(headers[name] || headers[name.toLowerCase()] || "");
}

function attributeValue(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, "i"));
  return match ? match[1] ?? match[2] ?? match[3] ?? "" : "";
}

function addEvidence(evidence, builder, source, marker) {
  if (!evidence.some((item) => item.label === builder && item.source === source && item.marker === marker)) {
    evidence.push({ type: "builder-artifact", label: builder, strength: "direct", source, marker });
  }
}

function evidenceMarkup(html) {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|textarea|template|pre|code)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ");
}

const builderBadgeHosts = {
  Lovable: ["lovable.dev", "lovable.app"],
  Bolt: ["bolt.new"],
  v0: ["v0.dev", "v0.app"],
  "Replit Agent": ["replit.com", "replit.app"],
  Base44: ["base44.com", "base44.app"]
};

function badgeHostMatches(href, baseUrl, builder) {
  try {
    const parsed = new URL(href, baseUrl);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) return false;
    const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
    return builderBadgeHosts[builder].some((allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

function analyzeStructuredBuilderEvidence(html, baseUrl) {
  const evidence = [];
  const markup = evidenceMarkup(html);
  const tags = markup.match(/<[a-z][^>]*>/gi) || [];
  for (const tag of tags) {
    if (/\sdata-lov-id(?:\s*=|\s|>)/i.test(tag)) addEvidence(evidence, "Lovable", "dom-attribute", "data-lov-id");
    if (/\s(?:data-bolt-(?:id|generated)|data-builder\s*=\s*["']bolt["'])/i.test(tag)) addEvidence(evidence, "Bolt", "dom-attribute", "Bolt data attribute");
    if (/\sdata-v0-[\w-]+(?:\s*=|\s|>)/i.test(tag)) addEvidence(evidence, "v0", "dom-attribute", "data-v0 attribute");
    if (/\s(?:data-replit-agent|generated-by-replit)(?:\s*=|\s|>)/i.test(tag)) addEvidence(evidence, "Replit Agent", "dom-attribute", "Replit Agent attribute");
    if (/\s(?:data-base44|generated-by-base44)(?:\s*=|\s|>)/i.test(tag)) addEvidence(evidence, "Base44", "dom-attribute", "Base44 attribute");
    if (/\blovable-tagger\b/i.test(`${attributeValue(tag, "id")} ${attributeValue(tag, "class")} ${attributeValue(tag, "src")}`)) {
      addEvidence(evidence, "Lovable", "dom-attribute", "lovable-tagger");
    }
    if (/^<meta\b/i.test(tag) && /generator/i.test(attributeValue(tag, "name"))) {
      const generator = attributeValue(tag, "content");
      if (/\blovable\b/i.test(generator)) addEvidence(evidence, "Lovable", "meta-generator", "Lovable generator");
      if (/\bbolt(?:\.new)?\b/i.test(generator)) addEvidence(evidence, "Bolt", "meta-generator", "Bolt generator");
      if (/\bv0(?:\.dev)?\b/i.test(generator)) addEvidence(evidence, "v0", "meta-generator", "v0 generator");
      if (/\breplit agent\b/i.test(generator)) addEvidence(evidence, "Replit Agent", "meta-generator", "Replit Agent generator");
      if (/\bbase44\b/i.test(generator)) addEvidence(evidence, "Base44", "meta-generator", "Base44 generator");
    }
  }

  for (const match of markup.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const tag = `<a ${match[1]}>`;
    const href = attributeValue(tag, "href");
    const label = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const badge = (builder) => new RegExp(`^(?:made|built|generated)\\s+(?:by|with)\\s+${builder}(?:[.!]|\\s*↗)?$`, "i").test(label);
    if (badgeHostMatches(href, baseUrl, "Lovable") && badge("lovable")) addEvidence(evidence, "Lovable", "badge-link", "Lovable badge");
    if (badgeHostMatches(href, baseUrl, "Bolt") && badge("bolt")) addEvidence(evidence, "Bolt", "badge-link", "Bolt badge");
    if (badgeHostMatches(href, baseUrl, "v0") && badge("v0")) addEvidence(evidence, "v0", "badge-link", "v0 badge");
    if (badgeHostMatches(href, baseUrl, "Replit Agent") && badge("replit agent")) addEvidence(evidence, "Replit Agent", "badge-link", "Replit Agent badge");
    if (badgeHostMatches(href, baseUrl, "Base44") && badge("base44")) addEvidence(evidence, "Base44", "badge-link", "Base44 badge");
  }

  return evidence;
}

export function analyzeHeaders(headers = {}) {
  const evidence = [];
  const add = (label) => {
    if (!evidence.some((item) => item.label === label)) {
      evidence.push({ type: "response-header", label, strength: "context" });
    }
  };
  const server = headerValue(headers, "server");
  const poweredBy = headerValue(headers, "x-powered-by");
  const via = headerValue(headers, "via");
  if (hasHeader(headers, "x-vercel-id") || /vercel/i.test(server)) add("Vercel response");
  if (hasHeader(headers, "x-nf-request-id") || /netlify/i.test(server)) add("Netlify response");
  if (hasHeader(headers, "x-replit-user-id")) add("Replit response");
  if (hasHeader(headers, "x-render-origin-server")) add("Render response");
  if (hasHeader(headers, "cf-ray") || /cloudflare/i.test(server)) add("Cloudflare edge");
  if (/google frontend/i.test(server) && /\bgoogle\b/i.test(via)) add("Google Frontend response");
  if (/next\.?js/i.test(poweredBy)) add("Next.js response");
  return evidence;
}

export function analyzeManifest(manifestText = "") {
  if (!manifestText) return { evidence: [], validJson: false };
  try {
    const manifest = JSON.parse(manifestText);
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
      return { evidence: [], validJson: false };
    }
    const evidence = [{ type: "web-manifest", label: "Web app manifest", strength: "context" }];
    if (["standalone", "fullscreen", "minimal-ui"].includes(String(manifest.display || "").toLowerCase())) {
      evidence.push({ type: "web-manifest", label: "Installable display mode", strength: "context" });
    }
    if (Array.isArray(manifest.icons) && manifest.icons.length > 0) {
      evidence.push({ type: "web-manifest", label: "Manifest icons", strength: "context" });
    }
    return { evidence, validJson: true };
  } catch {
    return { evidence: [], validJson: false };
  }
}

export function analyzeHtml({ html, url, headers = {}, assetText = "" }) {
  const haystack = `${html}\n${assetText}`;
  const resourceHaystack = `${html}\n${assetText}`;
  const directEvidence = analyzeStructuredBuilderEvidence(html, url);

  const hostname = new URL(url).hostname.toLowerCase();
  const contextEvidence = [];
  if (hostname.endsWith(".vercel.app")) contextEvidence.push({ type: "hosting", label: "Vercel", strength: "context" });
  if (hostname.endsWith(".netlify.app")) contextEvidence.push({ type: "hosting", label: "Netlify", strength: "context" });
  if (hostname.endsWith(".replit.app")) contextEvidence.push({ type: "hosting", label: "Replit hosting", strength: "context" });
  if (hostname.endsWith(".lovable.app")) contextEvidence.push({ type: "hosting", label: "Lovable hosting", strength: "context" });
  if (/replit-cdn\.com/i.test(haystack)) contextEvidence.push({ type: "runtime", label: "Replit runtime", strength: "context" });
  if (/https?:\/\/[^\s"'`<>]+\.replit\.app(?:[\s/"'`<>]|$)/i.test(resourceHaystack)) contextEvidence.push({ type: "linked-resource", label: "Replit-hosted resource", strength: "context" });
  if (/stackblitz|webcontainer/i.test(haystack)) contextEvidence.push({ type: "tooling", label: "StackBlitz/WebContainer", strength: "context" });

  const stackSignals = stackRules.filter((rule) => includesAny(haystack, rule.patterns)).map((rule) => rule.name);
  const headerEvidence = analyzeHeaders(headers);
  const metrics = {
    htmlBytes: new TextEncoder().encode(html).length,
    scriptTags: count(html, /<script\b/gi),
    stylesheetLinks: count(html, /<link\b[^>]*rel=["']?stylesheet/gi),
    inlineStyles: count(html, /\sstyle=["']/gi),
    dataAttributes: count(html, /\sdata-[\w-]+=/gi),
    forms: count(html, /<form\b/gi),
    headings: count(html, /<h[1-6]\b/gi),
    images: count(html, /<img\b/gi)
  };

  const structuralHints = [];
  if (stackSignals.length >= 4) structuralHints.push("dense-modern-stack");
  if (metrics.dataAttributes >= 24) structuralHints.push("high-data-attribute-density");
  if (metrics.scriptTags >= 12 && metrics.forms === 0) structuralHints.push("script-heavy-static-shell");

  const verdict = directEvidence.length
    ? { level: "direct", title: "Direkte Builder-Artefakte gefunden", summary: "Die öffentlich sichtbare Seite enthält mindestens einen konkreten Hinweis auf einen AI-Builder." }
    : structuralHints.length >= 2 && stackSignals.length >= 2
      ? { level: "indicative", title: "Vibe-Coding-ähnliche Muster", summary: "Mehrere allgemeine Struktur- und Stack-Signale passen zum Pilotmuster, sind aber nicht builder-spezifisch." }
      : { level: "indeterminate", title: "Keine belastbare Zuordnung", summary: "Die sichtbaren Artefakte reichen für eine verantwortbare Zuordnung nicht aus." };

  return { verdict, directEvidence, directBuilderCount: new Set(directEvidence.map((item) => item.label)).size, contextEvidence, headerEvidence, stackSignals, structuralHints, metrics };
}
