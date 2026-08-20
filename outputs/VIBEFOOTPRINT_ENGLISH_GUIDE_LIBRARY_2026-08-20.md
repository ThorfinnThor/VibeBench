# VibeFootprint English guide library

Status: implemented locally on 2026-08-20

## Outcome

The public site is now English-only and the former German routes, language selector, hreflang alternates and German sitemap entries have been removed.

The indexable public architecture contains 107 URLs:

- 1 scanner homepage
- 4 established core explanation pages
- 1 `/guides` library overview
- 6 cluster hubs
- 95 detailed editorial guides

## Topic clusters

| Cluster | Detail guides |
| --- | ---: |
| Website security | 20 |
| Design distinctiveness | 20 |
| Frontend engineering | 20 |
| Content and trust | 15 |
| Launch workflows | 10 |
| Score interpretation | 10 |
| Total | 95 |

## Quality controls

Every guide record must provide a unique title, unique metadata description, substantial summary, at least three inspection steps, three improvement steps, three verification steps, a common pitfall, an explicit scope boundary, three references, authorship, technical review and an update date.

Only records with `status: published` enter the XML sitemap. Automated tests reject missing fields, duplicate metadata, incorrect cluster counts, German public routes and incomplete static route generation.

## Crawl and discovery structure

The homepage links to the guide library and major clusters. The library links to every cluster and guide. Each guide links back to its cluster, to related guides and to the scanner. Canonical metadata and article/breadcrumb structured data are generated for every detail page.

The sitemap contains only stable editorial routes; arbitrary scan results remain outside the indexable surface.

## Publication workflow

1. Review changed files and the 107-route build output locally.
2. Commit and push through GitHub Desktop.
3. Let the existing Vercel project deploy the `main` branch.
4. Open `/sitemap.xml` on the production domain and submit it in Google Search Console.
5. Request indexing for `/guides` and the six cluster hubs first. Google still decides which URLs to crawl and index.
6. Use Search Console queries, impressions and indexing reasons to revise weak pages. Do not add more routes until the existing library earns impressions or supplies a clear user need.
