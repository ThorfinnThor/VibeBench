import Link from "next/link";
import type { SeoPageContent } from "../lib/seo-pages";
import styles from "./seo-content-page.module.css";

export default function SeoContentPage({ page }: { page: SeoPageContent }) {
  const related = [
    { href: "/vibe-coding-website-checker", label: "Website checker" },
    { href: "/how-to-tell-if-a-website-was-vibe-coded", label: "Recognize patterns" },
    { href: "/vibe-coding-security-checklist", label: "Security checklist" },
    { href: "/insights", label: "Editorial insights" },
    { href: "/guides", label: "All guides" }
  ];

  return <main className={styles.page}>
    <a className="skip-link" href="#article">Skip to content</a>
    <header className={styles.header}>
      <Link className="brand" href="/" aria-label="VibeFootprint home"><span className="brand-mark">V</span><span><strong>VibeFootprint</strong><small>Website intelligence</small></span></Link>
      <nav aria-label="Primary navigation"><Link href="/#scanner">Run a scan</Link><Link href="/insights">Insights</Link><Link href="/guides">Guides</Link><Link href="/methodology">Methodology</Link></nav>
    </header>

    <article id="article">
      <header className={styles.hero}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">VibeFootprint</Link><span>/</span><span>{page.metaTitle}</span></nav>
        <div className={styles.heroGrid}>
          <div><p className="eyebrow">{page.eyebrow}</p><h1>{page.title}</h1></div>
          <div><p className={styles.intro}>{page.intro}</p><Link className={styles.primaryCta} href="/#scanner">Scan a website for free<span>→</span></Link></div>
        </div>
        <aside className={styles.boundary}><strong>Important boundary</strong><p>{page.boundary}</p></aside>
      </header>

      <div className={styles.body}>
        <aside className={styles.sideNav}><strong>On this page</strong>{page.sections.map((section, index) => <a key={section.heading} href={`#section-${index + 1}`}>{section.heading}</a>)}<a href="#questions">Common questions</a></aside>
        <div className={styles.content}>
          {page.sections.map((section, index) => <section id={`section-${index + 1}`} key={section.heading}><span>{String(index + 1).padStart(2, "0")}</span><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets && <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}</section>)}
          <section id="questions" className={styles.faq}><span>{String(page.sections.length + 1).padStart(2, "0")}</span><h2>Common questions</h2>{page.faq.map((item) => <details key={item.question}><summary>{item.question}<b aria-hidden="true">+</b></summary><p>{item.answer}</p></details>)}</section>
        </div>
      </div>
    </article>

    <section className={styles.scanCta}><div><p className="eyebrow">Next step</p><h2>Check the public website now.</h2><p>Get pattern similarity, a separate security baseline and practical next steps.</p></div><Link href="/#scanner">Start the free scan<span>→</span></Link></section>
    <nav className={styles.related} aria-label="Related guides">{related.map((item) => <Link key={item.href} href={item.href}>{item.label}<span>↗</span></Link>)}</nav>
    <footer className={styles.footer}><Link className="brand" href="/"><span className="brand-mark">V</span><span><strong>VibeFootprint</strong><small>Website intelligence</small></span></Link><p>Public patterns. Separate security. Clear next steps.</p></footer>
  </main>;
}
