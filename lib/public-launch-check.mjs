const text = (html) => String(html || "");
const present = (value) => typeof value === "string" && value.trim().length > 0;

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1]?.trim() || "";
}

function metaContent(html, name, attributeName = "name") {
  const tags = text(html).match(/<meta\b[^>]*>/gi) || [];
  const tag = tags.find((entry) => attribute(entry, attributeName).toLowerCase() === name.toLowerCase());
  return tag ? attribute(tag, "content") : "";
}

export function inspectPublicLaunchSurface({ html = "", headers = {} } = {}) {
  const source = text(html);
  const htmlTag = source.match(/<html\b[^>]*>/i)?.[0] || "";
  const canonicalTag = (source.match(/<link\b[^>]*>/gi) || []).find((tag) => /\brel\s*=\s*["'][^"']*canonical[^"']*["']/i.test(tag));
  const title = source.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() || "";
  const robots = `${metaContent(source, "robots")} ${String(headers["x-robots-tag"] || headers["X-Robots-Tag"] || "")}`.toLowerCase();
  const checks = [
    { id: "VF-LAUNCH-INDEXING", status: /\bnoindex\b/.test(robots) ? "attention" : "pass", label: "Indexing directive", detail: /\bnoindex\b/.test(robots) ? "A public noindex directive was observed." : "No public noindex directive was observed." },
    { id: "VF-LAUNCH-TITLE", status: present(title) ? "pass" : "attention", label: "Document title", detail: present(title) ? "A document title was observed." : "No document title was observed." },
    { id: "VF-LAUNCH-DESCRIPTION", status: present(metaContent(source, "description")) ? "pass" : "review", label: "Meta description", detail: present(metaContent(source, "description")) ? "A meta description was observed." : "No meta description was observed." },
    { id: "VF-LAUNCH-LANGUAGE", status: present(attribute(htmlTag, "lang")) ? "pass" : "review", label: "Document language", detail: present(attribute(htmlTag, "lang")) ? "The document declares a language." : "No document language was observed." },
    { id: "VF-LAUNCH-VIEWPORT", status: present(metaContent(source, "viewport")) ? "pass" : "review", label: "Viewport metadata", detail: present(metaContent(source, "viewport")) ? "Viewport metadata was observed." : "No viewport metadata was observed." },
    { id: "VF-LAUNCH-CANONICAL", status: canonicalTag && present(attribute(canonicalTag, "href")) ? "pass" : "review", label: "Canonical URL", detail: canonicalTag && present(attribute(canonicalTag, "href")) ? "A canonical URL was observed." : "No canonical URL was observed." },
    { id: "VF-LAUNCH-H1", status: /<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(source) ? "pass" : "review", label: "Primary heading", detail: /<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(source) ? "A primary heading was observed." : "No H1 was observed in the delivered HTML." },
    { id: "VF-LAUNCH-OPEN-GRAPH", status: present(metaContent(source, "og:title", "property")) && present(metaContent(source, "og:description", "property")) ? "pass" : "review", label: "Open Graph metadata", detail: present(metaContent(source, "og:title", "property")) && present(metaContent(source, "og:description", "property")) ? "Basic Open Graph metadata was observed." : "Basic Open Graph metadata is incomplete." }
  ];
  return {
    status: checks.some((check) => check.status === "attention") ? "attention" : checks.some((check) => check.status === "review") ? "review" : "pass",
    counts: checks.reduce((counts, check) => ({ ...counts, [check.status]: counts[check.status] + 1 }), { pass: 0, review: 0, attention: 0 }),
    checks,
    affectsScores: false,
    boundary: "Public HTML and response-header presence checks only; not a functional, accessibility, performance or security test."
  };
}
