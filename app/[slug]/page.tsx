import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EditorialPage from "../../components/EditorialPage";
import SeoContentPage from "../../components/SeoContentPage";
import { editorialPages } from "../../lib/editorial-pages";
import { englishSeoPages } from "../../lib/seo-pages";

export function generateStaticParams() {
  return [...new Set([...Object.keys(englishSeoPages), ...Object.keys(editorialPages)])].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const editorial = editorialPages[slug];
  if (editorial) {
    const path = `/${editorial.slug}`;
    return {
      title: editorial.metaTitle,
      description: editorial.description,
      authors: [{ name: "VibeFootprint Editorial", url: "/about" }],
      alternates: { canonical: path },
      openGraph: { type: "article", title: `${editorial.metaTitle} | VibeFootprint`, description: editorial.description, url: path, locale: "en_US", publishedTime: `${editorial.publishedAt}T00:00:00.000Z`, modifiedTime: `${editorial.updatedAt}T00:00:00.000Z`, images: [{ url: "/og.png", width: 1731, height: 909, alt: editorial.title }] },
      twitter: { card: "summary_large_image", title: `${editorial.metaTitle} | VibeFootprint`, description: editorial.description, images: ["/og.png"] }
    };
  }
  const page = englishSeoPages[slug];
  if (!page) return {};
  return {
    title: page.metaTitle,
    description: page.description,
    authors: [{ name: "VibeFootprint", url: "/about" }],
    alternates: { canonical: `/${page.slug}` },
    openGraph: { title: `${page.metaTitle} | VibeFootprint`, description: page.description, url: `/${page.slug}`, locale: "en_US", images: [{ url: "/og.png", width: 1731, height: 909, alt: "VibeFootprint website intelligence" }] },
    twitter: { card: "summary_large_image", title: `${page.metaTitle} | VibeFootprint`, description: page.description, images: ["/og.png"] }
  };
}

export default async function EnglishSeoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const editorial = editorialPages[slug];
  if (editorial) return <EditorialPage page={editorial} />;
  const page = englishSeoPages[slug];
  if (!page) notFound();
  return <SeoContentPage page={page} />;
}
