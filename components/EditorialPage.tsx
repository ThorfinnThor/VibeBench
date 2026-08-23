import Link from "next/link";
import { absoluteUrl } from "../lib/site";
import { editorialPages, type EditorialBlock, type EditorialPage as EditorialPageData } from "../lib/editorial-pages";
import { GuideSiteFooter, GuideSiteHeader } from "./GuidePage";
import styles from "./editorial-page.module.css";

function ProseBlock({ block }: { block: Extract<EditorialBlock, { type: "prose" }> }) {
  return <section className={styles.proseBlock}>
    {block.eyebrow && <p className="eyebrow">{block.eyebrow}</p>}
    <h2>{block.heading}</h2>
    {block.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    {block.bullets && <ul className={styles.bulletList}>{block.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
  </section>;
}

function LadderBlock({ block }: { block: Extract<EditorialBlock, { type: "ladder" }> }) {
  return <section><SectionHeading eyebrow="Signal strength" heading={block.heading} intro={block.intro} />
    <div className={styles.ladder}>{block.items.map((item, index) => <article key={item.level}>
      <div><span>{item.level}</span><b>{String(index + 1).padStart(2, "0")}</b></div>
      <h3>{item.title}</h3><p>{item.evidence}</p><aside><strong>Responsible interpretation</strong>{item.interpretation}</aside>
    </article>)}</div>
  </section>;
}

function MatrixBlock({ block }: { block: Extract<EditorialBlock, { type: "matrix" }> }) {
  return <section><SectionHeading eyebrow="Decision matrix" heading={block.heading} intro={block.intro} />
    <div className={styles.matrixWrap}><table><thead><tr>{block.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{block.rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th scope="row" key={`${index}-${cell}`}>{cell}</th> : <td key={`${index}-${cell}`}>{cell}</td>)}</tr>)}</tbody></table></div>
  </section>;
}

function StepsBlock({ block }: { block: Extract<EditorialBlock, { type: "steps" }> }) {
  return <section><SectionHeading eyebrow="Repeatable process" heading={block.heading} intro={block.intro} />
    <ol className={styles.steps}>{block.items.map((item, index) => <li key={item.title}><b>{String(index + 1).padStart(2, "0")}</b><div><h3>{item.title}</h3><p>{item.action}</p><aside><strong>Record</strong>{item.record}</aside></div></li>)}</ol>
  </section>;
}

function ScenarioBlock({ block }: { block: Extract<EditorialBlock, { type: "scenario" }> }) {
  return <section className={styles.scenario}><p className="eyebrow">Applied example</p><h2>{block.heading}</h2><p className={styles.scenarioContext}>{block.context}</p><ul>{block.observations.map((item) => <li key={item}>{item}</li>)}</ul><aside><strong>Bounded conclusion</strong><p>{block.conclusion}</p></aside></section>;
}

function ScorecardBlock({ block }: { block: Extract<EditorialBlock, { type: "scorecard" }> }) {
  return <section><SectionHeading eyebrow="Self-review" heading={block.heading} intro={block.intro} />
    <div className={styles.scorecard}>{block.items.map((item, index) => <article key={item.label}><div><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.label}</strong></div><h3>{item.question}</h3><dl><div><dt>Strong signal</dt><dd>{item.strong}</dd></div><div><dt>Weak signal</dt><dd>{item.weak}</dd></div></dl></article>)}</div>
  </section>;
}

function PhasesBlock({ block }: { block: Extract<EditorialBlock, { type: "phases" }> }) {
  return <section><SectionHeading eyebrow="Working sequence" heading={block.heading} intro={block.intro} />
    <div className={styles.phases}>{block.phases.map((phase) => <article key={phase.label}><div><span>{phase.label}</span><strong>{phase.outcome}</strong></div><h3>{phase.title}</h3><ul>{phase.actions.map((action) => <li key={action}>{action}</li>)}</ul></article>)}</div>
  </section>;
}

function GatesBlock({ block }: { block: Extract<EditorialBlock, { type: "gates" }> }) {
  return <section><SectionHeading eyebrow="Production standard" heading={block.heading} intro={block.intro} />
    <div className={styles.gates}>{block.gates.map((gate, index) => <article key={gate.name}><header><span>{String(index + 1).padStart(2, "0")}</span><h3>{gate.name}</h3></header><div><p><strong>Pass</strong>{gate.pass}</p><p><strong>Fail</strong>{gate.fail}</p><aside><strong>Evidence required</strong>{gate.evidence}</aside></div></article>)}</div>
  </section>;
}

function ClaimsBlock({ block }: { block: Extract<EditorialBlock, { type: "claims" }> }) {
  const labels = { observable: "Observable", inference: "Inference", unknown: "Not knowable from a URL" };
  return <section><SectionHeading eyebrow="Claim boundary" heading={block.heading} intro={block.intro} />
    <div className={styles.claims}>{block.claims.map((claim) => <article className={styles[claim.status]} key={claim.claim}><span>{labels[claim.status]}</span><h3>{claim.claim}</h3><p>{claim.reason}</p><aside><strong>Use this wording</strong>{claim.wording}</aside></article>)}</div>
  </section>;
}

function RisksBlock({ block }: { block: Extract<EditorialBlock, { type: "risks" }> }) {
  return <section><SectionHeading eyebrow="Threat model" heading={block.heading} intro={block.intro} />
    <div className={styles.risks}>{block.items.map((item, index) => <article key={item.threat}>
      <header><span>Scenario {String(index + 1).padStart(2, "0")}</span><h3>{item.threat}</h3></header>
      <dl><div><dt>Trigger</dt><dd>{item.trigger}</dd></div><div><dt>Potential impact</dt><dd>{item.impact}</dd></div><div><dt>Control</dt><dd>{item.control}</dd></div><div><dt>Access needed</dt><dd>{item.access}</dd></div></dl>
    </article>)}</div>
  </section>;
}

function DecisionsBlock({ block }: { block: Extract<EditorialBlock, { type: "decisions" }> }) {
  return <section><SectionHeading eyebrow="Decision path" heading={block.heading} intro={block.intro} />
    <ol className={styles.decisions}>{block.items.map((item, index) => <li key={item.question}>
      <b>{String(index + 1).padStart(2, "0")}</b><h3>{item.question}</h3>
      <div><p><strong>If yes</strong>{item.yes}</p><p><strong>If no</strong>{item.no}</p></div>
      <aside><strong>Evidence</strong>{item.evidence}</aside>
    </li>)}</ol>
  </section>;
}

function SeoClinicBlock({ block }: { block: Extract<EditorialBlock, { type: "seoClinic" }> }) {
  return <section><SectionHeading eyebrow="Diagnosis before treatment" heading={block.heading} intro={block.intro} />
    <div className={styles.seoClinic}>{block.items.map((item, index) => <article key={item.symptom}>
      <div><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.symptom}</h3></div>
      <dl><div><dt>Likely cause</dt><dd>{item.cause}</dd></div><div><dt>Repair</dt><dd>{item.repair}</dd></div><div><dt>Verify</dt><dd>{item.verify}</dd></div></dl>
    </article>)}</div>
  </section>;
}

function LedgerBlock({ block }: { block: Extract<EditorialBlock, { type: "ledger" }> }) {
  return <section><SectionHeading eyebrow="Maintenance economics" heading={block.heading} intro={block.intro} />
    <div className={styles.ledger}>{block.items.map((item, index) => <article key={item.debt}>
      <header><span>Debt {String(index + 1).padStart(2, "0")}</span><h3>{item.debt}</h3></header>
      <p><strong>Interest paid</strong>{item.interest}</p><p><strong>Visible signal</strong>{item.signal}</p><aside><strong>Smallest useful action</strong>{item.action}</aside>
    </article>)}</div>
  </section>;
}

function HandoffBlock({ block }: { block: Extract<EditorialBlock, { type: "handoff" }> }) {
  return <section><SectionHeading eyebrow="Transfer of capability" heading={block.heading} intro={block.intro} />
    <div className={styles.handoff}>{block.items.map((item, index) => <article key={item.artifact}>
      <div><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.artifact}</h3><p>{item.owner}</p></div>
      <p><strong>Accepted when</strong>{item.acceptance}</p><p><strong>Handoff failure</strong>{item.failure}</p>
    </article>)}</div>
  </section>;
}

function TestLabBlock({ block }: { block: Extract<EditorialBlock, { type: "testLab" }> }) {
  return <section><SectionHeading eyebrow="Test protocol" heading={block.heading} intro={block.intro} />
    <div className={styles.testLab}>{block.items.map((item, index) => <article key={item.experiment}>
      <header><span>Experiment {String(index + 1).padStart(2, "0")}</span><h3>{item.experiment}</h3></header>
      <div><p><strong>Setup</strong>{item.setup}</p><p><strong>Assertions</strong>{item.assertions}</p><aside><strong>Negative case</strong>{item.negative}</aside></div>
    </article>)}</div>
  </section>;
}

function FaqBlock({ block }: { block: Extract<EditorialBlock, { type: "faq" }> }) {
  return <section className={styles.faq}><SectionHeading eyebrow="Plain answers" heading={block.heading} />{block.items.map((item) => <details key={item.question}><summary>{item.question}<b aria-hidden="true">+</b></summary><p>{item.answer}</p></details>)}</section>;
}

function SectionHeading({ eyebrow, heading, intro }: { eyebrow: string; heading: string; intro?: string }) {
  return <div className={styles.sectionHeading}><div><p className="eyebrow">{eyebrow}</p><h2>{heading}</h2></div>{intro && <p>{intro}</p>}</div>;
}

function Block({ block }: { block: EditorialBlock }) {
  switch (block.type) {
    case "prose": return <ProseBlock block={block} />;
    case "ladder": return <LadderBlock block={block} />;
    case "matrix": return <MatrixBlock block={block} />;
    case "steps": return <StepsBlock block={block} />;
    case "scenario": return <ScenarioBlock block={block} />;
    case "scorecard": return <ScorecardBlock block={block} />;
    case "phases": return <PhasesBlock block={block} />;
    case "gates": return <GatesBlock block={block} />;
    case "claims": return <ClaimsBlock block={block} />;
    case "risks": return <RisksBlock block={block} />;
    case "decisions": return <DecisionsBlock block={block} />;
    case "seoClinic": return <SeoClinicBlock block={block} />;
    case "ledger": return <LedgerBlock block={block} />;
    case "handoff": return <HandoffBlock block={block} />;
    case "testLab": return <TestLabBlock block={block} />;
    case "faq": return <FaqBlock block={block} />;
  }
}

export default function EditorialPage({ page }: { page: EditorialPageData }) {
  const url = `/${page.slug}`;
  const related = page.related.map((slug) => editorialPages[slug]).filter(Boolean);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", "@id": `${absoluteUrl(url)}#article`, headline: page.title, description: page.description, datePublished: page.publishedAt, dateModified: page.updatedAt, inLanguage: "en", author: { "@type": "Organization", name: "VibeFootprint Editorial", url: absoluteUrl("/insights") }, publisher: { "@id": absoluteUrl("/#organization") }, mainEntityOfPage: absoluteUrl(url), articleSection: page.formatLabel },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "VibeFootprint", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Insights", item: absoluteUrl("/insights") },
        { "@type": "ListItem", position: 3, name: page.title, item: absoluteUrl(url) }
      ] }
    ]
  };

  return <main className={`${styles.page} ${styles[page.format]}`}>
    <a className="skip-link" href="#editorial-content">Skip to article</a>
    <GuideSiteHeader />
    <article id="editorial-content">
      <header className={styles.hero}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">VibeFootprint</Link><span>/</span><Link href="/insights">Insights</Link><span>/</span><span>{page.formatLabel}</span></nav>
        <div className={styles.heroGrid}><div><p className="eyebrow">{page.eyebrow}</p><h1>{page.title}</h1></div><div><p className={styles.dek}>{page.dek}</p><dl className={styles.meta}><div><dt>Format</dt><dd>{page.formatLabel}</dd></div><div><dt>For</dt><dd>{page.audience}</dd></div><div><dt>Reading time</dt><dd>{page.readingMinutes} minutes</dd></div></dl></div></div>
        <aside className={styles.scope}><strong>Evidence boundary</strong><p>{page.scope}</p></aside>
      </header>

      <div className={styles.articleBody}>{page.blocks.map((block, index) => <Block block={block} key={`${block.type}-${index}`} />)}</div>

      <section className={styles.sources}><SectionHeading eyebrow="Source notes" heading="References used for this guide" intro="We prefer first-party standards, primary documentation and a visible interpretation boundary. Links are provided for verification and deeper implementation work." /><div>{page.sources.map((source) => <a href={source.href} key={source.href}><strong>{source.label}<span>↗</span></strong><p>{source.note}</p></a>)}</div></section>
    </article>

    <section className={styles.scanCta}><div><p className="eyebrow">Apply the framework</p><h2>Review a real public website.</h2><p>See its pattern-similarity index, evidence breadth, separate security baseline and concrete findings.</p></div><Link href="/#scanner">Run the free scan<span>→</span></Link></section>
    <section className={styles.related}><div><p className="eyebrow">Continue with a different question</p><h2>Related editorial guides</h2></div><div>{related.map((item) => <Link href={`/${item.slug}`} key={item.slug}><span>{item.formatLabel}</span><strong>{item.title}</strong><b>Read {item.readingMinutes} min →</b></Link>)}</div><Link className={styles.allInsights} href="/insights">Browse all editorial guides →</Link></section>
    <GuideSiteFooter />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
  </main>;
}
