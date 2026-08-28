import Link from "next/link";
import type { ReactNode } from "react";
import { GuideSiteFooter, GuideSiteHeader } from "./GuidePage";
import styles from "./legal-page.module.css";

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  updatedAt?: string;
  children: ReactNode;
  notice?: ReactNode;
  cta?: ReactNode;
};

export default function LegalPageShell({ eyebrow, title, intro, updatedAt = "2026-08-28", children, notice, cta }: LegalPageShellProps) {
  return <main className={styles.page}>
    <a className="skip-link" href="#legal-content">Direkt zum Inhalt</a>
    <GuideSiteHeader />
    <header className={styles.hero}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">VibeFootprint</Link><span>/</span><span>{title}</span></nav>
      <div className={styles.heroGrid}><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div><p className={styles.intro}>{intro}</p></div>
      <p className={styles.meta}>Stand: <time dateTime={updatedAt}>28. August 2026</time></p>
    </header>
    <article id="legal-content" className={styles.body} lang="de">
      {notice ? <aside className={styles.notice}>{notice}</aside> : null}
      <div className={styles.content}>{children}</div>
      {cta}
    </article>
    <GuideSiteFooter />
  </main>;
}
