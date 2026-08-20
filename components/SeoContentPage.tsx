import type { SeoPageContent } from "../lib/seo-pages";
import styles from "./seo-content-page.module.css";

export default function SeoContentPage({ page }: { page: SeoPageContent }) {
  const german = page.locale === "de";
  const home = german ? "/de" : "/";
  const alternate = german ? `/${page.alternateSlug}` : `/de/${page.alternateSlug}`;
  const methodology = german ? "/de/methodik" : "/methodology";
  const checker = german ? "/de/vibe-coding-website-checker" : "/vibe-coding-website-checker";
  const security = german ? "/de/vibe-coding-sicherheitscheck" : "/vibe-coding-security-checklist";
  const recognition = german ? "/de/vibe-coding-website-erkennen" : "/how-to-tell-if-a-website-was-vibe-coded";

  return <main className={styles.page}>
    <a className="skip-link" href="#article">{german ? "Zum Inhalt" : "Skip to content"}</a>
    <header className={styles.header}>
      <a className="brand" href={home} aria-label={german ? "VibeFootprint Startseite" : "VibeFootprint home"}><span className="brand-mark">V</span><span><strong>VibeFootprint</strong><small>{german ? "Website-Intelligenz" : "Website intelligence"}</small></span></a>
      <nav aria-label={german ? "Seitennavigation" : "Primary navigation"}>
        <a href={`${home}#scanner`}>{german ? "Scan starten" : "Run a scan"}</a>
        <a href={methodology}>{german ? "Methodik" : "Methodology"}</a>
        <a className={styles.language} href={alternate} hrefLang={german ? "en" : "de"}>{german ? "🇬🇧 EN" : "🇩🇪 DE"}</a>
      </nav>
    </header>

    <article id="article">
      <header className={styles.hero}>
        <nav className={styles.breadcrumb} aria-label={german ? "Brotkrumen" : "Breadcrumb"}><a href={home}>VibeFootprint</a><span>/</span><span>{page.metaTitle}</span></nav>
        <div className={styles.heroGrid}>
          <div><p className="eyebrow">{page.eyebrow}</p><h1>{page.title}</h1></div>
          <div><p className={styles.intro}>{page.intro}</p><a className={styles.primaryCta} href={`${home}#scanner`}>{german ? "Website kostenlos scannen" : "Scan a website for free"}<span>→</span></a></div>
        </div>
        <aside className={styles.boundary}><strong>{german ? "Wichtige Grenze" : "Important boundary"}</strong><p>{page.boundary}</p></aside>
      </header>

      <div className={styles.body}>
        <aside className={styles.sideNav}>
          <strong>{german ? "Auf dieser Seite" : "On this page"}</strong>
          {page.sections.map((section, index) => <a key={section.heading} href={`#section-${index + 1}`}>{section.heading}</a>)}
          <a href="#questions">{german ? "Häufige Fragen" : "Common questions"}</a>
        </aside>
        <div className={styles.content}>
          {page.sections.map((section, index) => <section id={`section-${index + 1}`} key={section.heading}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets && <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
          </section>)}

          <section id="questions" className={styles.faq}>
            <span>{String(page.sections.length + 1).padStart(2, "0")}</span>
            <h2>{german ? "Häufige Fragen" : "Common questions"}</h2>
            {page.faq.map((item) => <details key={item.question}><summary>{item.question}<b aria-hidden="true">+</b></summary><p>{item.answer}</p></details>)}
          </section>
        </div>
      </div>
    </article>

    <section className={styles.scanCta}>
      <div><p className="eyebrow">{german ? "Nächster Schritt" : "Next step"}</p><h2>{german ? "Prüfe jetzt die öffentliche Website." : "Check the public website now."}</h2><p>{german ? "Erhalte Musterähnlichkeit, eine getrennte Security-Baseline und konkrete nächste Schritte." : "Get pattern similarity, a separate security baseline and practical next steps."}</p></div>
      <a href={`${home}#scanner`}>{german ? "Kostenlosen Scan starten" : "Start the free scan"}<span>→</span></a>
    </section>

    <nav className={styles.related} aria-label={german ? "Weitere Ratgeber" : "Related guides"}>
      {[{ href: checker, label: german ? "Website-Checker" : "Website checker" }, { href: recognition, label: german ? "Muster erkennen" : "Recognize patterns" }, { href: security, label: german ? "Security-Checkliste" : "Security checklist" }, { href: methodology, label: german ? "Methodik" : "Methodology" }].map((item) => <a key={item.href} href={item.href}>{item.label}<span>↗</span></a>)}
    </nav>

    <footer className={styles.footer}><a className="brand" href={home}><span className="brand-mark">V</span><span><strong>VibeFootprint</strong><small>{german ? "Website-Intelligenz" : "Website intelligence"}</small></span></a><p>{german ? "Öffentliche Muster. Getrennte Security. Klare nächste Schritte." : "Public patterns. Separate security. Clear next steps."}</p></footer>
  </main>;
}

