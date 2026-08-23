# VibeFootprint editorial SEO strategy — 2026-08-23

This document supersedes the expansion assumptions in the 20 August SEO
foundation note. The public product is English-only. The goal is not to reach a
page-count target; it is to publish the smallest useful set of pages that fully
answers distinct search decisions and earns repeat discovery.

## Why the strategy changed

The existing 95-guide library is broad but intentionally follows one repeated
inspection / improvement / verification template. Adding more keyword variants
to that system would increase indexable volume without increasing the number of
questions the site can answer well.

Google's current guidance emphasizes original information, comprehensive
answers, clear authorship and first-hand value. It also warns against scaled
content and doorway pages created mainly to capture similar queries. The next
SEO phase therefore adds a smaller editorial layer with distinct formats and
search intents.

Primary guidance:

- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/appearance/sitelinks
- https://developers.google.com/search/docs/appearance/structured-data/article

## Published editorial intent map

| Search decision | Canonical page | Format | Why it is distinct |
| --- | --- | --- | --- |
| How can I recognize vibe-coding patterns? | `/how-to-tell-if-a-website-was-vibe-coded` | Diagnostic field guide | Evidence ladder, false positives, repeatable ten-minute protocol and worked conclusion |
| Is this vibe coded or just a template? | `/vibe-coded-vs-template-website` | Side-by-side analysis | Compares production routes and maps each business decision to the right evidence |
| How should I audit an AI-assisted website? | `/vibe-coding-website-audit-framework` | 90-minute audit | Six independent review lenses, timed agenda, severity model and evidence packet |
| How do I make the design less generic? | `/how-to-make-a-vibe-coded-website-look-less-generic` | Transformation playbook | Originality scorecard, ordered design moves and structural before/after edits |
| How do I review generated frontend code? | `/how-to-review-ai-generated-frontend-code` | Engineering gates | Five production gates, failure-mode matrix and a review packet |
| Can AI-generated website code actually be detected? | `/can-you-detect-ai-generated-website-code` | Evidence brief | Separates observable claims, inferences and facts a public URL cannot establish |
| Are vibe-coded websites secure? | `/are-vibe-coded-websites-secure` | Scenario-based threat model | Models assets, trust boundaries, abuse scenarios, controls and the access needed to verify them |
| Is vibe coding ready for production? | `/is-vibe-coding-ready-for-production` | Production decision guide | Routes six readiness decisions into bounded release stages with required evidence |
| Why is my AI-assisted site not ranking? | `/vibe-coding-seo-mistakes` | Technical SEO clinic | Diagnoses six different symptoms before prescribing rendering, canonical, discovery or content repairs |
| How do I reduce technical debt after a fast build? | `/vibe-coding-technical-debt` | Technical-debt ledger | Prioritizes recurring interest and product consequence instead of code aesthetics |
| What must an agency transfer to its client? | `/vibe-coding-client-handoff-checklist` | Client handoff kit | Defines seven owned artifacts and a client-operated acceptance session |
| How should I test a vibe-coded website? | `/how-to-test-a-vibe-coded-website` | Website testing lab | Provides six experiments with setup, assertions and negative cases plus a release evidence packet |

The `/insights` hub explains the editorial model and links to all twelve pages. Each
article links to three genuinely adjacent decisions and to first-party standards
or primary documentation.

## Editorial quality gate for every future page

A proposed page is publishable only when all conditions below are true:

1. **Distinct decision:** the reader would take a different action after reading
   this page than after reading any existing page.
2. **No query-only variant:** a new word order or synonym is merged into the
   strongest existing canonical page.
3. **Original framework or example:** the article contains at least one useful
   matrix, protocol, worked example, test or decision model created for this
   topic.
4. **Evidence boundary:** the page states what the public evidence can and cannot
   establish.
5. **Primary references:** standards and implementation claims link to the
   responsible standards body, framework or project documentation.
6. **Specific internal links:** anchors describe the next decision instead of
   using generic “read more” language alone.
7. **Truthful metadata:** title, description, publication date, update date and
   Article structured data match the visible article.
8. **Technical QA:** the route is statically rendered, canonical, in the sitemap,
   mobile-safe, free of browser errors and included in automated tests.

## Cannibalization rules

- Keep one primary page for “how to tell / how to know / signs of a vibe-coded
  website.” Expand that page rather than creating three versions.
- Keep the public checker page transactional and the diagnostic field guide
  informational. Link them in both directions.
- Keep the security checklist focused on controls. A future threat-model article
  must explain risk scenarios rather than repeat the checklist.
- Granular guide pages support an editorial article; they should not reuse its
  exact title, introduction or search promise.
- Do not publish location, industry or builder-name permutations unless real
  evidence shows a separate user decision and the page contains unique data.

## Measurement plan

For the first eight weeks after deployment:

1. Submit the refreshed sitemap in Google Search Console.
2. Request indexing for the `/insights` hub and the diagnostic field guide first.
3. Record impressions, clicks, average position and indexed status by canonical
   URL every week.
4. Group queries by decision, not by exact wording. Add relevant wording to the
   existing page before proposing another URL.
5. Review engagement with Vercel Web Analytics, but never use a longer page or
   artificial interaction solely to improve an engagement metric.
6. Update a page only when the content materially changes; do not rotate dates to
   imply freshness.

## Next content waves

### Wave 2 — evidence-led assets

- an anonymized public-surface teardown with reproducible observations;
- a before/after distinctiveness case study with consent and real screenshots;
- an interactive audit worksheet derived from the 90-minute framework;
- a public glossary that defines similarity, evidence breadth, direct markers
  and security baseline without creating one page per synonym.

### Wave 3 — original data

- aggregate findings from consented scans with a documented sample boundary;
- common public security-header gaps by website category;
- a longitudinal before/after report showing which public changes move which
  observable signals;
- a benchmark page only when the data and uncertainty can be published honestly.

### Wave 4 — external authority

- expert reviews or interviews with named practitioners;
- guest examples contributed with permission and editorial review;
- outreach to relevant newsletters, communities and tool directories only after
  the flagship pages have stable indexing and a clear reason to cite them.

## Do not do next

- do not generate another 50 near-identical pages;
- do not create a page for every AI builder or framework without original data;
- do not claim that public patterns prove authorship or generated-code share;
- do not index thin scan-result URLs or user-submitted target domains;
- do not optimize prose for a score at the cost of reader comprehension.
