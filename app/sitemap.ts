import type { MetadataRoute } from "next";
import { absoluteUrl } from "../lib/site";
import { englishSeoPages } from "../lib/seo-pages";
import { allGuidePages, guideClusters } from "../lib/guide-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-08-20T00:00:00.000Z");
  const homePages: MetadataRoute.Sitemap = [{ url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 }];
  const corePages: MetadataRoute.Sitemap = Object.values(englishSeoPages).map((page) => ({ url: absoluteUrl(`/${page.slug}`), lastModified: now, changeFrequency: "monthly", priority: page.slug === "methodology" ? 0.85 : 0.8 }));
  const guideHub: MetadataRoute.Sitemap = [{ url: absoluteUrl("/guides"), lastModified: now, changeFrequency: "weekly", priority: 0.9 }];
  const clusterHubs: MetadataRoute.Sitemap = Object.values(guideClusters).map((cluster) => ({ url: absoluteUrl(`/guides/${cluster.id}`), lastModified: now, changeFrequency: "weekly", priority: 0.82 }));
  const guides: MetadataRoute.Sitemap = allGuidePages.filter((page) => page.status === "published").map((page) => ({ url: absoluteUrl(`/guides/${page.cluster}/${page.slug}`), lastModified: new Date(`${page.updatedAt}T00:00:00.000Z`), changeFrequency: "monthly", priority: 0.72 }));
  return [...homePages, ...corePages, ...guideHub, ...clusterHubs, ...guides];
}
