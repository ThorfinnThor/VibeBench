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

function ControlsBlock({ block }: { block: Extract<EditorialBlock, { type: "controls" }> }) {
  return <section><SectionHeading eyebrow="Founder control map" heading={block.heading} intro={block.intro} />
    <div className={styles.controls}>{block.items.map((item, index) => <article key={item.area}>
      <div><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.area}</h3></div>
      <p><strong>Ask</strong>{item.founderQuestion}</p><p><strong>If nobody knows</strong>{item.risk}</p><aside><strong>Acceptable evidence</strong>{item.evidence}</aside>
    </article>)}</div>
  </section>;
}

function CostModelBlock({ block }: { block: Extract<EditorialBlock, { type: "costModel" }> }) {
  return <section><SectionHeading eyebrow="Total cost model" heading={block.heading} intro={block.intro} />
    <div className={styles.costModel}>{block.items.map((item, index) => <article key={item.center}>
      <header><span>Cost center {String(index + 1).padStart(2, "0")}</span><h3>{item.center}</h3></header>
      <div><p><strong>Initial</strong>{item.initial}</p><p><strong>Recurring</strong>{item.recurring}</p><p><strong>Cost trigger</strong>{item.trigger}</p><aside><strong>Budget decision</strong>{item.decision}</aside></div>
    </article>)}</div>
  </section>;
}

function AccessJourneysBlock({ block }: { block: Extract<EditorialBlock, { type: "accessJourneys" }> }) {
  return <section><SectionHeading eyebrow="Accessibility journey lab" heading={block.heading} intro={block.intro} />
    <div className={styles.accessJourneys}>{block.items.map((item, index) => <article key={item.journey}>
      <header><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.journey}</h3></header>
      <dl><div><dt>Likely barrier</dt><dd>{item.barrier}</dd></div><div><dt>Test</dt><dd>{item.test}</dd></div><div><dt>Repair</dt><dd>{item.repair}</dd></div></dl>
    </article>)}</div>
  </section>;
}

function ToolScoreBlock({ block }: { block: Extract<EditorialBlock, { type: "toolScore" }> }) {
  return <section><SectionHeading eyebrow="Selection scorecard" heading={block.heading} intro={block.intro} />
    <div className={styles.toolScore}>{block.items.map((item) => <article key={item.dimension}>
      <div><h3>{item.dimension}</h3><p>{item.ask}</p></div>
      <p><strong>Strong answer</strong>{item.strong}</p><p><strong>Weak answer</strong>{item.weak}</p><aside><strong>Exit test</strong>{item.exit}</aside>
    </article>)}</div>
  </section>;
}

function DataFlowBlock({ block }: { block: Extract<EditorialBlock, { type: "dataFlow" }> }) {
  return <section><SectionHeading eyebrow="Data journey" heading={block.heading} intro={block.intro} />
    <ol className={styles.dataFlow}>{block.items.map((item, index) => <li key={item.stage}>
      <div><b>{String(index + 1).padStart(2, "0")}</b><h3>{item.stage}</h3></div>
      <dl><div><dt>Data</dt><dd>{item.data}</dd></div><div><dt>Purpose</dt><dd>{item.purpose}</dd></div><div><dt>Privacy risk</dt><dd>{item.risk}</dd></div><div><dt>Control</dt><dd>{item.control}</dd></div></dl>
    </li>)}</ol>
  </section>;
}

function MigrationBlock({ block }: { block: Extract<EditorialBlock, { type: "migration" }> }) {
  return <section><SectionHeading eyebrow="Incremental migration" heading={block.heading} intro={block.intro} />
    <div className={styles.migration}>{block.items.map((item, index) => <article key={item.phase}>
      <header><span>Phase {String(index + 1).padStart(2, "0")}</span><h3>{item.phase}</h3></header>
      <div><p><strong>Keep stable</strong>{item.keep}</p><p><strong>Replace</strong>{item.replace}</p><p><strong>Proof</strong>{item.proof}</p><aside><strong>Rollback</strong>{item.rollback}</aside></div>
    </article>)}</div>
  </section>;
}

function TradeoffsBlock({ block }: { block: Extract<EditorialBlock, { type: "tradeoffs" }> }) {
  return <section><SectionHeading eyebrow="Delivery trade-offs" heading={block.heading} intro={block.intro} />
    <div className={styles.tradeoffs}>{block.items.map((item) => <article key={item.dimension}>
      <h3>{item.dimension}</h3><div><p><strong>Vibe-coding strength</strong>{item.vibeStrength}</p><p><strong>Traditional strength</strong>{item.traditionalStrength}</p></div><aside><strong>Decide with</strong>{item.decidingEvidence}</aside>
    </article>)}</div>
  </section>;
}

function ProvenanceBlock({ block }: { block: Extract<EditorialBlock, { type: "provenance" }> }) {
  return <section><SectionHeading eyebrow="Ownership and license ledger" heading={block.heading} intro={block.intro} />
    <div className={styles.provenance}>{block.items.map((item, index) => <article key={item.asset}>
      <header><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.asset}</h3></header>
      <dl><div><dt>Origin</dt><dd>{item.origin}</dd></div><div><dt>Permission needed</dt><dd>{item.permission}</dd></div><div><dt>Verify</dt><dd>{item.verify}</dd></div><div><dt>Failure</dt><dd>{item.failure}</dd></div></dl>
    </article>)}</div>
  </section>;
}

function LaunchChecksBlock({ block }: { block: Extract<EditorialBlock, { type: "launchChecks" }> }) {
  return <section><SectionHeading eyebrow="Launch control room" heading={block.heading} intro={block.intro} />
    <ol className={styles.launchChecks}>{block.items.map((item, index) => <li key={`${item.window}-${item.check}`}>
      <div><span>{item.window}</span><b>{String(index + 1).padStart(2, "0")}</b></div><h3>{item.check}</h3><p><strong>Owner</strong>{item.owner}</p><p><strong>Evidence</strong>{item.evidence}</p><aside><strong>Stop condition</strong>{item.stop}</aside>
    </li>)}</ol>
  </section>;
}

function SignalsBlock({ block }: { block: Extract<EditorialBlock, { type: "signals" }> }) {
  return <section><SectionHeading eyebrow="Observable user promises" heading={block.heading} intro={block.intro} />
    <div className={styles.signals}>{block.items.map((item) => <article key={item.journey}>
      <div><h3>{item.journey}</h3><p>{item.signal}</p></div><p><strong>Investigate when</strong>{item.threshold}</p><p><strong>Context required</strong>{item.context}</p><aside><strong>Owned action</strong>{item.action}</aside>
    </article>)}</div>
  </section>;
}

function PromptSpecsBlock({ block }: { block: Extract<EditorialBlock, { type: "promptSpecs" }> }) {
  return <section><SectionHeading eyebrow="Prompt specification" heading={block.heading} intro={block.intro} />
    <div className={styles.promptSpecs}>{block.items.map((item, index) => <article key={item.layer}>
      <header><span>Layer {String(index + 1).padStart(2, "0")}</span><h3>{item.layer}</h3><p>{item.question}</p></header>
      <div><p><strong>Constraint</strong>{item.constraint}</p><p><strong>Useful input</strong>{item.example}</p><aside><strong>Acceptance check</strong>{item.acceptance}</aside></div>
    </article>)}</div>
  </section>;
}

function DiligenceBlock({ block }: { block: Extract<EditorialBlock, { type: "diligence" }> }) {
  return <section><SectionHeading eyebrow="Buyer evidence room" heading={block.heading} intro={block.intro} />
    <div className={styles.diligence}>{block.items.map((item, index) => <article key={item.area}>
      <header><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.area}</h3></header><p><strong>Request</strong>{item.request}</p><p><strong>Red flag</strong>{item.redFlag}</p><p><strong>Verify</strong>{item.verify}</p><aside><strong>Decision use</strong>{item.decision}</aside>
    </article>)}</div>
  </section>;
}

function WorkbenchBlock({ block }: { block: Extract<EditorialBlock, { type: "workbench" }> }) {
  return <section><SectionHeading eyebrow={block.eyebrow} heading={block.heading} intro={block.intro} />
    <div className={styles.workbench} data-variant={block.variant}>{block.items.map((item, index) => <article key={item.title}>
      <header><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{item.title}</h3><p>{item.subtitle}</p></div></header>
      <dl>{item.fields.map((field) => <div key={field.label} data-tone={field.tone ?? "neutral"}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>
      <aside><strong>Decision</strong>{item.decision}</aside>
    </article>)}</div>
  </section>;
}

function FaqBlock({ block }: { block: Extract<EditorialBlock, { type: "faq" }> }) {
  return <section className={styles.faq}><SectionHeading eyebrow="Plain answers" heading={block.heading} />{block.items.map((item) => <details key={item.question}><summary>{item.question}<b aria-hidden="true">+</b></summary><p>{item.answer}</p></details>)}</section>;
}

function SectionHeading({ eyebrow, heading, intro }: { eyebrow: string; heading: string; intro?: string }) {
  return <div className={styles.sectionHeading}><div><p className="eyebrow">{eyebrow}</p><h2>{heading}</h2></div>{intro && <p>{intro}</p>}</div>;
}

function visibleDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${day} ${months[month - 1]} ${year}`;
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
    case "controls": return <ControlsBlock block={block} />;
    case "costModel": return <CostModelBlock block={block} />;
    case "accessJourneys": return <AccessJourneysBlock block={block} />;
    case "toolScore": return <ToolScoreBlock block={block} />;
    case "dataFlow": return <DataFlowBlock block={block} />;
    case "migration": return <MigrationBlock block={block} />;
    case "tradeoffs": return <TradeoffsBlock block={block} />;
    case "provenance": return <ProvenanceBlock block={block} />;
    case "launchChecks": return <LaunchChecksBlock block={block} />;
    case "signals": return <SignalsBlock block={block} />;
    case "promptSpecs": return <PromptSpecsBlock block={block} />;
    case "diligence": return <DiligenceBlock block={block} />;
    case "workbench": return <WorkbenchBlock block={block} />;
    case "faq": return <FaqBlock block={block} />;
  }
}

export default function EditorialPage({ page }: { page: EditorialPageData }) {
  const url = `/${page.slug}`;
  const related = page.related.map((slug) => editorialPages[slug]).filter(Boolean);
  const faq = page.blocks.find((block): block is Extract<EditorialBlock, { type: "faq" }> => block.type === "faq");
  const structuredGraph: object[] = [
    { "@type": "Article", "@id": `${absoluteUrl(url)}#article`, headline: page.title, description: page.description, datePublished: page.publishedAt, dateModified: page.updatedAt, inLanguage: "en", author: { "@type": "Organization", name: "VibeFootprint Editorial", url: absoluteUrl("/about") }, publisher: { "@id": absoluteUrl("/#organization") }, isPartOf: { "@id": absoluteUrl("/#website") }, mainEntityOfPage: absoluteUrl(url), articleSection: page.formatLabel },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "VibeFootprint", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Insights", item: absoluteUrl("/insights") },
      { "@type": "ListItem", position: 3, name: page.title, item: absoluteUrl(url) }
    ] }
  ];
  if (faq) structuredGraph.push({
    "@type": "FAQPage",
    "@id": `${absoluteUrl(url)}#questions`,
    mainEntity: faq.items.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } }))
  });
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": structuredGraph
  };

  return <main className={`${styles.page} ${styles[page.format]}`}>
    <a className="skip-link" href="#editorial-content">Skip to article</a>
    <GuideSiteHeader />
    <article id="editorial-content">
      <header className={styles.hero}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">VibeFootprint</Link><span>/</span><Link href="/insights">Insights</Link><span>/</span><span>{page.formatLabel}</span></nav>
        <div className={styles.heroGrid}><div><p className="eyebrow">{page.eyebrow}</p><h1>{page.title}</h1></div><div><p className={styles.dek}>{page.dek}</p><dl className={styles.meta}><div><dt>Format</dt><dd>{page.formatLabel}</dd></div><div><dt>For</dt><dd>{page.audience}</dd></div><div><dt>Reading time</dt><dd>{page.readingMinutes} minutes</dd></div></dl><p className={styles.responsibility}>Published by <Link href="/about">VibeFootprint Editorial</Link><span>Published <time dateTime={page.publishedAt}>{visibleDate(page.publishedAt)}</time> · Last reviewed <time dateTime={page.updatedAt}>{visibleDate(page.updatedAt)}</time></span></p></div></div>
        <aside className={styles.scope}><strong>Evidence boundary</strong><p>{page.scope}</p></aside>
      </header>

      <div className={styles.articleBody}>{page.blocks.map((block, index) => <Block block={block} key={`${block.type}-${index}`} />)}</div>

      <section className={styles.sources}><SectionHeading eyebrow="Source notes" heading="References used for this guide" intro="We prefer first-party standards, primary documentation and a visible interpretation boundary. Links are provided for verification and deeper implementation work." /><div>{page.sources.map((source) => <a href={source.href} key={source.href}><strong>{source.label}<span>↗</span></strong><p>{source.note}</p></a>)}</div></section>
    </article>

    <section className={styles.scanCta}><div><p className="eyebrow">Apply the framework</p><h2>Review a real public website.</h2><p>See its pattern-similarity index, evidence breadth, separate security baseline and concrete findings.</p></div><Link href="/#scanner">Buy launch scan · €4.99<span>→</span></Link></section>
    <section className={styles.related}><div><p className="eyebrow">Continue with a different question</p><h2>Related editorial guides</h2></div><div>{related.map((item) => <Link href={`/${item.slug}`} key={item.slug}><span>{item.formatLabel}</span><strong>{item.title}</strong><b>Read {item.readingMinutes} min →</b></Link>)}</div><Link className={styles.allInsights} href="/insights">Browse all editorial guides →</Link></section>
    <GuideSiteFooter />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
  </main>;
}
