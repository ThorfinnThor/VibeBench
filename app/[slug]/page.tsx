import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoContentPage from "../../components/SeoContentPage";
import { englishSeoPages } from "../../lib/seo-pages";

export function generateStaticParams() {
  return Object.keys(englishSeoPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = englishSeoPages[slug];
  if (!page) return {};
  return {
    title: page.metaTitle,
    description: page.description,
    alternates: { canonical: `/${page.slug}`, languages: { "en-US": `/${page.slug}`, "de-DE": `/de/${page.alternateSlug}`, "x-default": `/${page.slug}` } },
    openGraph: { title: `${page.metaTitle} | VibeFootprint`, description: page.description, url: `/${page.slug}`, locale: "en_US", alternateLocale: ["de_DE"], images: [] },
    twitter: { title: `${page.metaTitle} | VibeFootprint`, description: page.description, images: [] }
  };
}

export default async function EnglishSeoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = englishSeoPages[slug];
  if (!page) notFound();
  return <SeoContentPage page={page} />;
}
