import Link from "next/link";
import { absoluteUrl } from "../lib/site";
import { guideClusters, relatedGuides, type GuidePage as GuidePageData } from "../lib/guide-pages";
import LegalFooterLinks from "./LegalFooterLinks";
import styles from "./guide-page.module.css";

export function GuideSiteHeader() {
  return <header className={styles.siteHeader}>
    <Link className="brand" href="/" aria-label="VibeFootprint home"><span className="brand-mark">V</span><span><strong>VibeFootprint</strong><small>Website intelligence</small></span></Link>
    <nav aria-label="Primary navigation"><Link href="/#scanner">Launch scan · €4.99</Link><Link href="/contact">Contact</Link><Link href="/insights">Insights</Link><Link href="/guides">Guides</Link><Link href="/methodology">Methodology</Link></nav>
  </header>;
}

export function GuideSiteFooter() {
  return <footer className={styles.siteFooter}><Link className="brand" href="/"><span className="brand-mark">V</span><span><strong>VibeFootprint</strong><small>Website intelligence</small></span></Link><p>Public patterns. Separate security. Clear next steps.</p><nav><Link href="/about">About</Link><Link href="/insights">Editorial insights</Link><Link href="/guides">All guides</Link><Link href="/methodology">Methodology</Link><LegalFooterLinks /></nav></footer>;
}

export default function GuidePage({ page }: { page: GuidePageData }) {
  const cluster = guideClusters[page.cluster];
  const related = relatedGuides(page);
  const url = `/guides/${page.cluster}/${page.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", "@id": `${absoluteUrl(url)}#article`, headline: page.title, description: page.description, dateModified: page.updatedAt, datePublished: page.updatedAt, inLanguage: "en", author: { "@type": "Organization", name: page.author, url: absoluteUrl("/about") }, publisher: { "@id": absoluteUrl("/#organization") }, isPartOf: { "@id": absoluteUrl("/#website") }, mainEntityOfPage: absoluteUrl(url), articleSection: cluster.name },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "VibeFootprint", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("/guides") },
        { "@type": "ListItem", position: 3, name: cluster.name, item: absoluteUrl(`/guides/${cluster.id}`) },
        { "@type": "ListItem", position: 4, name: page.title, item: absoluteUrl(url) }
      ] }
    ]
  };

  return <main className={styles.page}>
    <a className="skip-link" href="#guide-content">Skip to content</a>
    <GuideSiteHeader />
    <article id="guide-content">
      <header className={styles.hero}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">VibeFootprint</Link><span>/</span><Link href="/guides">Guides</Link><span>/</span><Link href={`/guides/${cluster.id}`}>{cluster.name}</Link></nav>
        <div className={styles.heroGrid}>
          <div><p className="eyebrow">{cluster.eyebrow}</p><h1>{page.title}</h1></div>
          <div><p className={styles.summary}>{page.summary}</p><div className={styles.byline}><span>Written by {page.author}</span><span>Reviewed by {page.reviewer}</span><time dateTime={page.updatedAt}>Updated 20 August 2026</time></div></div>
        </div>
        <aside className={styles.boundary}><strong>Scope boundary</strong><p>{page.boundary}</p></aside>
      </header>

      <div className={styles.articleGrid}>
        <aside className={styles.tableOfContents}><strong>On this page</strong><a href="#inspect">What to inspect</a><a href="#improve">Improvement plan</a><a href="#verify">How to verify</a><a href="#pitfall">Common pitfall</a><a href="#sources">Sources</a></aside>
        <div className={styles.articleBody}>
          <section id="inspect"><span>01</span><p className="eyebrow">Evidence review</p><h2>What to inspect before changing anything</h2><p>Start with the delivered website and the real user journey. Record the current state so the team can distinguish an observed problem from an assumption and compare the same surface after deployment.</p><ol>{page.inspect.map((item) => <li key={item}><b>{String(page.inspect.indexOf(item) + 1).padStart(2, "0")}</b><span>{item}</span></li>)}</ol></section>
          <section id="improve"><span>02</span><p className="eyebrow">Implementation</p><h2>A practical improvement plan</h2><p>Make the smallest coherent change that solves the observed problem. Keep normal code review, accessibility, security and product checks in the loop instead of optimizing for the scan alone.</p><ol>{page.improve.map((item) => <li key={item}><b>{String(page.improve.indexOf(item) + 1).padStart(2, "0")}</b><span>{item}</span></li>)}</ol></section>
          <section id="verify"><span>03</span><p className="eyebrow">Verification</p><h2>How to verify the result</h2><p>Verification should test the intended outcome and the most likely regression. Use the production delivery path whenever headers, caching, rendering or third-party services affect the result.</p><ol>{page.verify.map((item) => <li key={item}><b>{String(page.verify.indexOf(item) + 1).padStart(2, "0")}</b><span>{item}</span></li>)}</ol></section>
          <section id="pitfall" className={styles.pitfall}><span>04</span><p className="eyebrow">Common pitfall</p><h2>A shortcut to avoid</h2><p>{page.pitfall}</p></section>
          <section id="sources" className={styles.sources}><span>05</span><p className="eyebrow">Further reading</p><h2>Primary guidance and references</h2><p>These sources provide standards, security guidance or the interpretation framework used to keep this guide bounded. Product-specific implementation still requires review in the actual codebase.</p><ul>{page.sources.map((source) => <li key={source.href}><a href={source.href}>{source.label}<span>↗</span></a></li>)}</ul></section>
        </div>
      </div>
    </article>

    <section className={styles.scanCta}><div><p className="eyebrow">Apply the guide to a real website</p><h2>Start with the public evidence.</h2><p>Run a free VibeFootprint scan, separate pattern similarity from security, then use the detailed findings to decide what deserves work.</p></div><Link href="/#scanner">Scan a website<span>→</span></Link></section>
    <section className={styles.related}><div><p className="eyebrow">Continue the review</p><h2>Related {cluster.name.toLowerCase()} guides</h2></div><div className={styles.relatedGrid}>{related.map((guide) => <Link href={`/guides/${guide.cluster}/${guide.slug}`} key={guide.slug}><span>{guideClusters[guide.cluster].name}</span><strong>{guide.title}</strong><b>Read guide →</b></Link>)}</div><Link className={styles.clusterLink} href={`/guides/${cluster.id}`}>View all {cluster.name.toLowerCase()} guides →</Link></section>
    <GuideSiteFooter />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
  </main>;
}
