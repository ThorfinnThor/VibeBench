import Link from "next/link";
import { allEditorialPages } from "../lib/editorial-pages";
import { absoluteUrl } from "../lib/site";
import { GuideSiteFooter, GuideSiteHeader } from "./GuidePage";
import styles from "./editorial-directory.module.css";

export default function EditorialDirectory() {
  const dataBriefs = allEditorialPages.filter((page) => page.format === "data-brief");
  const editorialGuides = allEditorialPages.filter((page) => page.format !== "data-brief");
  const [featured, ...rest] = editorialGuides;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": absoluteUrl("/insights#collection"),
        url: absoluteUrl("/insights"),
        name: "VibeFootprint editorial guides",
        description: "Original evidence-led guidance for assessing public website patterns and improving AI-assisted websites responsibly.",
        inLanguage: "en",
        isPartOf: { "@id": absoluteUrl("/#website") },
        mainEntity: { "@id": absoluteUrl("/insights#editorial-list") }
      },
      {
        "@type": "ItemList",
        "@id": absoluteUrl("/insights#editorial-list"),
        name: "VibeFootprint editorial library",
        numberOfItems: allEditorialPages.length,
        itemListElement: allEditorialPages.map((page, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: page.title,
          url: absoluteUrl(`/${page.slug}`)
        }))
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "VibeFootprint", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Insights", item: absoluteUrl("/insights") }
        ]
      }
    ]
  };
  return <main className={styles.page}>
    <a className="skip-link" href="#editorial-guides">Skip to editorial guides</a>
    <GuideSiteHeader />
    <header className={styles.hero}>
      <nav aria-label="Breadcrumb"><Link href="/">VibeFootprint</Link><span>/</span><span>Insights</span></nav>
      <div className={styles.heroGrid}><div><p className="eyebrow">VibeFootprint insights</p><h1>Clear thinking for websites built at AI speed.</h1></div><p>Original data briefs, field guides and decision systems for interpreting website evidence, shipping responsibly and improving the product after the first fast build.</p></div>
      <aside><strong>Evidence approach</strong><p>Data briefs publish samples, methods and limitations. Practical guides answer a distinct decision with their own working structure instead of repeating the same claim for different keywords.</p></aside>
    </header>

    <section id="editorial-guides" className={styles.library}>
      <div className={styles.sectionHeading}><div><p className="eyebrow">New · VibeFootprint research data</p><h2>Three datasets. Three results worth showing.</h2></div><p>These briefs use frozen aggregate VibeFootprint research artifacts. Each one publishes its denominator, protocol, result and evidence boundary—with no customer domains or individual scan results.</p></div>
      <div className={styles.dataBriefGrid}>{dataBriefs.map((page, index) => <article key={page.slug}>
        <div><span>Data brief {String(index + 1).padStart(2, "0")}</span><small>{page.readingMinutes} min</small></div>
        <h3><Link href={`/${page.slug}`}>{page.title}</Link></h3>
        <p>{page.dek}</p>
        <footer><span>{page.eyebrow.replace("VibeFootprint research data · ", "Sample ")}</span><Link href={`/${page.slug}`}>View data and method →</Link></footer>
      </article>)}</div>
      <div className={styles.guideHeading}><div><p className="eyebrow">Practical editorial library</p><h2>Fifty guides. Fifty different jobs.</h2></div><p>From pattern diagnosis and production safety to identity, data, operations, design, trustworthy growth and product transfer—each guide ends in a different practical decision.</p></div>
      <Link className={styles.featured} href={`/${featured.slug}`}>
        <div><span>{featured.formatLabel}</span><small>{featured.readingMinutes} minute read</small></div><h3>{featured.title}</h3><p>{featured.dek}</p><b>Open the field guide →</b>
      </Link>
      <div className={styles.grid}>{rest.map((page, index) => <article key={page.slug}><div><span>{String(index + 2).padStart(2, "0")}</span><small>{page.formatLabel}</small></div><h3><Link href={`/${page.slug}`}>{page.title}</Link></h3><p>{page.dek}</p><footer><span>{page.readingMinutes} min</span><Link href={`/${page.slug}`}>Read guide →</Link></footer></article>)}</div>
    </section>

    <section className={styles.method}><div><p className="eyebrow">Why this library grows deliberately</p><h2>Useful coverage beats keyword volume.</h2></div><div><p>Near-identical pages compete with one another and waste the reader’s time. Every guide targets a distinct decision, uses its own working format and links to the underlying standards or methodology.</p><Link href="/methodology">Review the scan methodology →</Link></div></section>
    <GuideSiteFooter />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
  </main>;
}
