import type { MetadataRoute } from "next";
import { absoluteUrl } from "../lib/site";
import { allEditorialPages, editorialPages } from "../lib/editorial-pages";
import { englishSeoPages } from "../lib/seo-pages";
import { allGuidePages, guideClusters } from "../lib/guide-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-08-20T00:00:00.000Z");
  const homePages: MetadataRoute.Sitemap = [{ url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 }];
  const corePages: MetadataRoute.Sitemap = Object.values(englishSeoPages).filter((page) => !editorialPages[page.slug]).map((page) => ({ url: absoluteUrl(`/${page.slug}`), lastModified: now, changeFrequency: "monthly", priority: page.slug === "methodology" ? 0.85 : 0.8 }));
  const editorialHub: MetadataRoute.Sitemap = [{ url: absoluteUrl("/insights"), lastModified: new Date("2026-08-23T00:00:00.000Z"), changeFrequency: "weekly", priority: 0.92 }];
  const editorial: MetadataRoute.Sitemap = allEditorialPages.map((page) => ({ url: absoluteUrl(`/${page.slug}`), lastModified: new Date(`${page.updatedAt}T00:00:00.000Z`), changeFrequency: "monthly", priority: page.slug === "how-to-tell-if-a-website-was-vibe-coded" ? 0.9 : 0.84 }));
  const guideHub: MetadataRoute.Sitemap = [{ url: absoluteUrl("/guides"), lastModified: now, changeFrequency: "weekly", priority: 0.9 }];
  const clusterHubs: MetadataRoute.Sitemap = Object.values(guideClusters).map((cluster) => ({ url: absoluteUrl(`/guides/${cluster.id}`), lastModified: now, changeFrequency: "weekly", priority: 0.82 }));
  const guides: MetadataRoute.Sitemap = allGuidePages.filter((page) => page.status === "published").map((page) => ({ url: absoluteUrl(`/guides/${page.cluster}/${page.slug}`), lastModified: new Date(`${page.updatedAt}T00:00:00.000Z`), changeFrequency: "monthly", priority: 0.72 }));
  return [...homePages, ...corePages, ...editorialHub, ...editorial, ...guideHub, ...clusterHubs, ...guides];
}
