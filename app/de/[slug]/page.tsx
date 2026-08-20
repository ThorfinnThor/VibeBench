import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoContentPage from "../../../components/SeoContentPage";
import { germanSeoPages } from "../../../lib/seo-pages";

export function generateStaticParams() {
  return Object.keys(germanSeoPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = germanSeoPages[slug];
  if (!page) return {};
  return {
    title: page.metaTitle,
    description: page.description,
    alternates: { canonical: `/de/${page.slug}`, languages: { "en-US": `/${page.alternateSlug}`, "de-DE": `/de/${page.slug}`, "x-default": `/${page.alternateSlug}` } },
    openGraph: { title: `${page.metaTitle} | VibeFootprint`, description: page.description, url: `/de/${page.slug}`, locale: "de_DE", alternateLocale: ["en_US"], images: [] },
    twitter: { title: `${page.metaTitle} | VibeFootprint`, description: page.description, images: [] }
  };
}

export default async function GermanSeoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = germanSeoPages[slug];
  if (!page) notFound();
  return <SeoContentPage page={page} />;
}
