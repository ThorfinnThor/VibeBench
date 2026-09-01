import { absoluteUrl } from "../../lib/site";

export const dynamic = "force-static";

export function GET() {
  const content = `# VibeFootprint

> VibeFootprint is a public-surface website diagnostic that separates a qualitative pattern-similarity index from a selected security-header baseline and turns observed findings into practical implementation steps.

Canonical site: ${absoluteUrl("/")}
Language: English
Publisher: SeitenHafen361, Schayan Yousefian, Berlin, Germany
Contact: info@vibefootprint.com

## Start here
- Scan a public website: ${absoluteUrl("/#scanner")}
- Methodology and interpretation limits: ${absoluteUrl("/methodology")}
- Product, publisher and pricing facts: ${absoluteUrl("/about")}
- Current pricing and full-audit contents: ${absoluteUrl("/pricing")}
- Original editorial insights: ${absoluteUrl("/insights")}
- Practical guide library: ${absoluteUrl("/guides")}

## Product facts
- The free scan creates a preview from publicly delivered HTML, selected same-origin assets and response headers.
- The full audit costs EUR 4.99 once during the launch offer and includes exact score drivers, prioritized findings, selected security checks, launch checks and copy-ready implementation prompts.
- A scan requires a public URL. It does not require a login, repository access or private source code.
- VibeFootprint is useful for founders, agencies, designers and web development teams reviewing an existing public website.

## Commercial audit paths
- AI website audit for launch decisions: ${absoluteUrl("/ai-website-audit")}
- Public website security audit: ${absoluteUrl("/website-security-audit")}
- AI-generated frontend code review: ${absoluteUrl("/ai-generated-frontend-code-review")}
- AI-assisted website content audit: ${absoluteUrl("/ai-website-content-audit")}
- Website launch-readiness audit: ${absoluteUrl("/website-launch-readiness-audit")}

## Important boundaries
- The Vibe-Footprint is a qualitative public-pattern similarity index. It is not a generated-code percentage, authorship probability or defect count.
- The security score covers selected publicly observable response-header protections. It is not a penetration test, compliance audit or security certification.
- Public inspection cannot verify private application logic, authentication, authorization, databases, secrets, dependencies or repository quality.
- No score or optimization guarantees search rankings, indexing or citation by an AI answer system.

## Knowledge collections
- Website security: ${absoluteUrl("/guides/security")}
- Design distinctiveness: ${absoluteUrl("/guides/design")}
- Frontend engineering: ${absoluteUrl("/guides/engineering")}
- Content and trust: ${absoluteUrl("/guides/content")}
- Launch workflows: ${absoluteUrl("/guides/launch")}
- Score interpretation: ${absoluteUrl("/guides/diagnostics")}

## Selected editorial resources
- How to know if a website was vibe coded: ${absoluteUrl("/how-to-tell-if-a-website-was-vibe-coded")}
- Vibe-coded vs template websites: ${absoluteUrl("/vibe-coded-vs-template-website")}
- Website audit framework: ${absoluteUrl("/vibe-coding-website-audit-framework")}
- Make an AI-assisted website less generic: ${absoluteUrl("/how-to-make-a-vibe-coded-website-look-less-generic")}
- Review AI-generated frontend code: ${absoluteUrl("/how-to-review-ai-generated-frontend-code")}

## Data briefs from VibeFootprint research artifacts
- Technical outcomes across 169 historical website retrieval attempts: ${absoluteUrl("/website-scan-technical-yield-169-sites")}
- Uncertainty-band effects across 81 usable website evaluations: ${absoluteUrl("/website-score-uncertainty-81-sites")}
- Why a 100-case blind confirmation did not pass the integrity gate: ${absoluteUrl("/blind-confirmation-integrity-100-sites")}

Each data brief links to a domain-free public aggregate JSON file, its frozen source-artifact hash and the evaluation script. Historical Development results are not current production-performance claims, calibrated authorship probabilities or evidence about an individual website.

## Related service
FindYourAIScore is a separate, complementary service for AI-search readiness: whether answer engines can identify a business, understand its offers and use its public pages as sources. It is not part of the VibeFootprint score or audit. ${"https://www.findyouraiscore.com/"}

## Discovery
- XML sitemap: ${absoluteUrl("/sitemap.xml")}
- Editorial RSS feed: ${absoluteUrl("/feed.xml")}
- Crawler rules: ${absoluteUrl("/robots.txt")}
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400"
    }
  });
}
