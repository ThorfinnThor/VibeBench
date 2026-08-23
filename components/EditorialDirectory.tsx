import Link from "next/link";
import { allEditorialPages } from "../lib/editorial-pages";
import { GuideSiteFooter, GuideSiteHeader } from "./GuidePage";
import styles from "./editorial-directory.module.css";

export default function EditorialDirectory() {
  const [featured, ...rest] = allEditorialPages;
  return <main className={styles.page}>
    <a className="skip-link" href="#editorial-guides">Skip to editorial guides</a>
    <GuideSiteHeader />
    <header className={styles.hero}>
      <nav aria-label="Breadcrumb"><Link href="/">VibeFootprint</Link><span>/</span><span>Insights</span></nav>
      <div className={styles.heroGrid}><div><p className="eyebrow">VibeFootprint editorial</p><h1>Clear thinking for websites built at AI speed.</h1></div><p>Original field guides, audit frameworks and engineering reviews for separating public evidence from assumptions—and turning the useful findings into better product decisions.</p></div>
      <aside><strong>Editorial approach</strong><p>Each guide answers a different decision with its own structure and evidence. We do not create near-duplicate pages for every wording of the same search.</p></aside>
    </header>

    <section id="editorial-guides" className={styles.library}>
      <div className={styles.sectionHeading}><div><p className="eyebrow">Start with the real question</p><h2>Six guides. Six different jobs.</h2></div><p>Use the diagnostic guide to interpret patterns, the comparison to separate production routes, the audit to plan work, the playbook to improve design, the code review to ship safely and the evidence brief to check detector claims.</p></div>
      <Link className={styles.featured} href={`/${featured.slug}`}>
        <div><span>{featured.formatLabel}</span><small>{featured.readingMinutes} minute read</small></div><h3>{featured.title}</h3><p>{featured.dek}</p><b>Open the field guide →</b>
      </Link>
      <div className={styles.grid}>{rest.map((page, index) => <article key={page.slug}><div><span>{String(index + 2).padStart(2, "0")}</span><small>{page.formatLabel}</small></div><h3><Link href={`/${page.slug}`}>{page.title}</Link></h3><p>{page.dek}</p><footer><span>{page.readingMinutes} min</span><Link href={`/${page.slug}`}>Read guide →</Link></footer></article>)}</div>
    </section>

    <section className={styles.method}><div><p className="eyebrow">Why this library is intentionally small</p><h2>Useful coverage beats keyword volume.</h2></div><div><p>Near-identical pages compete with one another and waste the reader’s time. These guides target distinct intents, include applied examples and link to the underlying standards or methodology.</p><Link href="/methodology">Review the scan methodology →</Link></div></section>
    <GuideSiteFooter />
  </main>;
}
