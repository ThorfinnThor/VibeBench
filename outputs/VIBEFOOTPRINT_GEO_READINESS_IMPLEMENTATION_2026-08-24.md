# VibeFootprint GEO readiness implementation — 24 August 2026

## Scope and interpretation

This work improves the existing VibeFootprint website for retrieval, citation and
answer extraction. It does not create a GEO score, reverse-engineer a provider's
ranking system or guarantee inclusion in Google AI features, ChatGPT Search,
Gemini, Perplexity or another answer system.

The supplied master prompt also describes how to build a separate GEO auditing
product with versioned methodology, benchmark controls and score calibration.
That is outside this website-readiness change. Adding such a product to the
existing Vibe-Footprint scanner would require a separately authorized product
contract and validation programme.

## Current-state assessment

Before this change, the website already provided:

- statically generated, server-visible Next.js content;
- canonical URLs, a sitemap and permissive general crawl rules;
- 50 distinct editorial articles and 95 practical guides;
- page-specific titles, descriptions and Open Graph metadata;
- Article and BreadcrumbList structured data on editorial and guide pages;
- visible primary references, evidence boundaries and related-page links;
- question-and-answer, comparison, procedure, definition-list and table
  structures where those structures fit the information;
- a stable Organization and WebApplication identity in the root document.

## Gap matrix

| Existing signal | Previous implementation | Problem | Implemented replacement | Priority |
| --- | --- | --- | --- | --- |
| Crawl access | `*` allowed, but `/_next/` disallowed | Blocking framework resources can make rendering harder for crawlers that use them | Keep `/api/` excluded while leaving public framework assets crawlable | High |
| OpenAI search access | Covered only by the wildcard rule | Correct but not explicit or regression-tested | Explicit `OAI-SearchBot` allow rule with the same private API boundary | High |
| Entity clarity | Organization name existed only in global schema and branding | No dedicated page directly defined product, publisher, audience or current availability | Added canonical `/about` page and site-wide footer links | High |
| Website identity | Organization and WebApplication nodes existed | The publication itself was not identified as a WebSite entity | Added a stable WebSite node linked to publisher and application | Medium |
| Article responsibility | Organizational author existed in JSON-LD | Editorial pages did not visibly show author, publication date and review date | Added visible publisher and dates that reuse the stored article values | High |
| Direct-answer markup | Core and editorial FAQs were visible | Their visible questions and answers were not represented in page-level JSON-LD | Added FAQPage only from the exact visible FAQ data | Medium |
| Core-page meaning | Metadata and visible copy existed | Core pages had no page-level WebPage and breadcrumb graph | Added WebPage, BreadcrumbList and factual publisher relationships | Medium |
| Guide entity relationship | Article schema and a visible byline existed | Author URL, website relationship and article section were incomplete | Linked author to `/about`, Article to WebSite and section to the visible guide cluster | Low |

## Three-stage result

### Retrieval readiness

- Important content remains present in server-rendered HTML.
- Canonicals, sitemap URLs and internal links use stable public routes.
- `/api/` stays outside the crawl surface.
- Public Next.js assets are no longer blocked in `robots.txt`.
- OAI-SearchBot is explicitly allowed to retrieve public pages.
- The new `/about` page is included automatically in the sitemap and linked from
  the home page and content footers.

### Citation readiness

- The product, publisher and website are connected through consistent schema IDs.
- `/about` provides a direct product definition, responsible publisher,
  audience, measurement boundary and dated availability statement.
- Editorial pages expose the same author and dates in visible copy and Article
  structured data.
- Primary sources and evidence boundaries remain part of the visible article.
- External authority is not measured or claimed from same-domain content.

### Answer extractability

- Core pages expose visible questions and answers as matching FAQPage data.
- Editorial FAQPage data is generated only when the article contains a visible
  FAQ block.
- Existing semantic tables, ordered procedures, definitions and decision cards
  remain server rendered.
- The About page directly answers what VibeFootprint is, who it is for, who
  publishes it, what it observes, its current pricing status and what it cannot
  prove.

## Anti-gaming decisions

The implementation deliberately does not add:

- `llms.txt` as a ranking device;
- hidden or crawler-only answer text;
- a keyword-density target;
- extra schema types unrelated to visible content;
- fabricated ratings, testimonials, prices or legal identity;
- automatically refreshed dates;
- a GEO readiness score or ranking guarantee.

Structured data mirrors visible content. The availability statement is dated and
must be updated when the free testing phase or commercial status changes.

## Verification and measurement after deployment

### Local verification completed

- ESLint passed without warnings or errors.
- The full automated suite passed: 193 of 193 tests.
- The production build compiled, type-checked and generated 164 static pages.
- Browser QA passed 29 of 29 assertions across desktop and mobile.
- Browser QA confirmed server-visible definitions, absolute canonicals, visible
  publisher and review information, matching structured-data types, explicit
  OAI-SearchBot access, API exclusion, sitemap inclusion and no horizontal
  overflow on the new About page.

### Post-deployment checks

1. Fetch `/robots.txt` and verify that `/api/` is disallowed while public assets
   and `OAI-SearchBot` remain allowed.
2. Fetch `/about`, an editorial page and a practical guide without JavaScript and
   confirm the meaningful content and JSON-LD are in the HTML response.
3. Validate representative pages with Google's Rich Results Test and URL
   Inspection tool. Valid markup is not a ranking or rich-result guarantee.
4. Submit the refreshed sitemap in Google Search Console and monitor indexed
   status, impressions and canonical selection.
5. In analytics, segment referrals containing `utm_source=chatgpt.com` where
   available and connect visits to meaningful scan starts rather than page views
   alone.
6. Review the dated availability paragraph whenever pricing or report access
   changes.

## Primary platform guidance

- Google, optimizing for generative AI features:
  https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google, structured data quality and visible-content requirements:
  https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Google, JavaScript search basics:
  https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- OpenAI, publisher and developer crawler guidance:
  https://help.openai.com/en/articles/12627856-publishers-and-developers-faq

## Remaining product decisions

- Add a verified legal name, postal address or public support channel only when
  the owner approves the exact information for publication.
- Add `sameAs` links only after official public profiles exist and ownership is
  confirmed.
- Decide whether future commercial pricing belongs on a dedicated pricing page;
  do not add Product or Offer markup before a real visible offer exists.
- Treat external mentions and earned authority as a separate measurement source,
  not something inferred from the VibeFootprint domain itself.
