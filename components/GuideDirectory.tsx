import Link from "next/link";
import { allGuidePages, guideClusters, guidesForCluster, type GuideClusterId } from "../lib/guide-pages";
import { GuideSiteFooter, GuideSiteHeader } from "./GuidePage";
import styles from "./guide-directory.module.css";

const clusterOrder: GuideClusterId[] = ["security", "design", "engineering", "content", "launch", "diagnostics"];

export default function GuideDirectory({ clusterId }: { clusterId?: GuideClusterId }) {
  const cluster = clusterId ? guideClusters[clusterId] : null;
  const pages = clusterId ? guidesForCluster(clusterId) : allGuidePages;
  return <main className={styles.page}>
    <a className="skip-link" href="#guide-list">Skip to guides</a>
    <GuideSiteHeader />
    <header className={styles.hero}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">VibeFootprint</Link>{cluster && <><span>/</span><Link href="/guides">Guides</Link></>}</nav>
      <div className={styles.heroGrid}><div><p className="eyebrow">{cluster?.eyebrow || "VibeFootprint knowledge base"}</p><h1>{cluster?.title || "Build a more distinctive, secure and reliable website."}</h1></div><div><p>{cluster?.introduction || "Ninety-five evidence-led guides help founders, designers and developers inspect the public website, make a bounded improvement and verify the result. Start with a topic cluster or run a scan to identify the most relevant path."}</p><Link href="/#scanner">Scan a website first<span>→</span></Link></div></div>
      {cluster && <aside><strong>Interpretation boundary</strong><p>{cluster.boundary}</p></aside>}
    </header>

    {!cluster && <section className={styles.clusters} aria-labelledby="clusters-heading"><div className={styles.sectionHeading}><div><p className="eyebrow">Six focused collections</p><h2 id="clusters-heading">Choose the review that matches the decision.</h2></div><p>The guide library deliberately separates similarity, quality and security. Each cluster has its own evidence boundary so a design observation is never presented as a vulnerability or authorship verdict.</p></div><div className={styles.clusterGrid}>{clusterOrder.map((id, index) => { const item = guideClusters[id]; const count = guidesForCluster(id).length; return <Link href={`/guides/${id}`} key={id}><span>{String(index + 1).padStart(2, "0")}</span><small>{count} guides</small><h3>{item.name}</h3><p>{item.description}</p><b>Explore cluster →</b></Link>; })}</div></section>}

    <section id="guide-list" className={styles.library}>
      <div className={styles.sectionHeading}><div><p className="eyebrow">{cluster ? `${pages.length} editorial guides` : `${pages.length} published guides`}</p><h2>{cluster ? `All ${cluster.name.toLowerCase()} guides` : "Complete guide library"}</h2></div><p>{cluster ? cluster.description : "Every page includes a distinct inspection checklist, improvement plan, verification steps, common pitfall, scope boundary and primary references."}</p></div>
      <div className={styles.guideGrid}>{pages.map((guide, index) => <article key={`${guide.cluster}/${guide.slug}`}><div><span>{String(index + 1).padStart(2, "0")}</span><small>{guideClusters[guide.cluster].name}</small></div><h3><Link href={`/guides/${guide.cluster}/${guide.slug}`}>{guide.title}</Link></h3><p>{guide.summary}</p><Link className={styles.readLink} href={`/guides/${guide.cluster}/${guide.slug}`}>Read guide <span>→</span></Link></article>)}</div>
    </section>

    {cluster && <nav className={styles.otherClusters} aria-label="Other guide clusters"><strong>Continue with another review</strong>{clusterOrder.filter((id) => id !== clusterId).map((id) => <Link href={`/guides/${id}`} key={id}>{guideClusters[id].name}<span>→</span></Link>)}</nav>}
    <GuideSiteFooter />
  </main>;
}
