import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuideDirectory from "../../../components/GuideDirectory";
import { guideClusters, type GuideClusterId } from "../../../lib/guide-pages";

export function generateStaticParams() { return Object.keys(guideClusters).map((cluster) => ({ cluster })); }

export async function generateMetadata({ params }: { params: Promise<{ cluster: string }> }): Promise<Metadata> {
  const { cluster: clusterId } = await params;
  const cluster = guideClusters[clusterId as GuideClusterId];
  if (!cluster) return {};
  return { title: cluster.title, description: cluster.description, alternates: { canonical: `/guides/${cluster.id}` }, openGraph: { title: `${cluster.title} | VibeFootprint`, description: cluster.description, url: `/guides/${cluster.id}`, locale: "en_US", images: [{ url: "/og.png", width: 1731, height: 909, alt: cluster.title }] }, twitter: { card: "summary_large_image", title: `${cluster.title} | VibeFootprint`, description: cluster.description, images: ["/og.png"] } };
}

export default async function Page({ params }: { params: Promise<{ cluster: string }> }) {
  const { cluster } = await params;
  if (!guideClusters[cluster as GuideClusterId]) notFound();
  return <GuideDirectory clusterId={cluster as GuideClusterId} />;
}
