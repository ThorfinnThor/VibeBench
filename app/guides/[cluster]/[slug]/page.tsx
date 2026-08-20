import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuidePage from "../../../../components/GuidePage";
import { allGuidePages, getGuide, guideClusters } from "../../../../lib/guide-pages";

export function generateStaticParams() {
  return allGuidePages.map((guide) => ({ cluster: guide.cluster, slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ cluster: string; slug: string }> }): Promise<Metadata> {
  const { cluster, slug } = await params;
  const page = getGuide(cluster, slug);
  if (!page || !guideClusters[page.cluster]) return {};
  const path = `/guides/${page.cluster}/${page.slug}`;
  return {
    title: page.metaTitle,
    description: page.description,
    alternates: { canonical: path },
    openGraph: { type: "article", title: `${page.metaTitle} | VibeFootprint`, description: page.description, url: path, locale: "en_US", modifiedTime: `${page.updatedAt}T00:00:00.000Z`, images: [{ url: "/og.png", width: 1731, height: 909, alt: "VibeFootprint website review guides" }] },
    twitter: { card: "summary_large_image", title: `${page.metaTitle} | VibeFootprint`, description: page.description, images: ["/og.png"] }
  };
}

export default async function Page({ params }: { params: Promise<{ cluster: string; slug: string }> }) {
  const { cluster, slug } = await params;
  const page = getGuide(cluster, slug);
  if (!page || page.status !== "published") notFound();
  return <GuidePage page={page} />;
}
