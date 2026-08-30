import type { MetadataRoute } from "next";
import { absoluteUrl } from "../lib/site";
import { allEditorialPages, editorialPages } from "../lib/editorial-pages";
import { englishSeoPages } from "../lib/seo-pages";
import { allGuidePages, guideClusters } from "../lib/guide-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUpdatedAt = new Date("2026-08-31T00:00:00.000Z");
  const latestEditorialUpdate = new Date(`${allEditorialPages.map((page) => page.updatedAt).sort().at(-1) ?? "2026-08-23"}T00:00:00.000Z`);
  const latestGuideUpdate = new Date(`${allGuidePages.map((page) => page.updatedAt).sort().at(-1) ?? "2026-08-20"}T00:00:00.000Z`);
  const homePages: MetadataRoute.Sitemap = [{ url: absoluteUrl("/"), lastModified: siteUpdatedAt, changeFrequency: "weekly", priority: 1 }];
  const contact: MetadataRoute.Sitemap = [{ url: absoluteUrl("/contact"), lastModified: new Date("2026-08-28T00:00:00.000Z"), changeFrequency: "monthly", priority: 0.5 }];
  const corePages: MetadataRoute.Sitemap = Object.values(englishSeoPages).filter((page) => !editorialPages[page.slug]).map((page) => ({ url: absoluteUrl(`/${page.slug}`), lastModified: new Date(`${page.updatedAt ?? "2026-08-20"}T00:00:00.000Z`), changeFrequency: "monthly", priority: page.slug === "methodology" ? 0.85 : 0.8 }));
  const editorialHub: MetadataRoute.Sitemap = [{ url: absoluteUrl("/insights"), lastModified: latestEditorialUpdate, changeFrequency: "weekly", priority: 0.92 }];
  const editorial: MetadataRoute.Sitemap = allEditorialPages.map((page) => ({ url: absoluteUrl(`/${page.slug}`), lastModified: new Date(`${page.updatedAt}T00:00:00.000Z`), changeFrequency: "monthly", priority: page.slug === "how-to-tell-if-a-website-was-vibe-coded" ? 0.9 : 0.84 }));
  const guideHub: MetadataRoute.Sitemap = [{ url: absoluteUrl("/guides"), lastModified: latestGuideUpdate, changeFrequency: "weekly", priority: 0.9 }];
  const clusterHubs: MetadataRoute.Sitemap = Object.values(guideClusters).map((cluster) => ({ url: absoluteUrl(`/guides/${cluster.id}`), lastModified: new Date(`${allGuidePages.filter((page) => page.cluster === cluster.id).map((page) => page.updatedAt).sort().at(-1) ?? "2026-08-20"}T00:00:00.000Z`), changeFrequency: "weekly", priority: 0.82 }));
  const guides: MetadataRoute.Sitemap = allGuidePages.filter((page) => page.status === "published").map((page) => ({ url: absoluteUrl(`/guides/${page.cluster}/${page.slug}`), lastModified: new Date(`${page.updatedAt}T00:00:00.000Z`), changeFrequency: "monthly", priority: 0.72 }));
  return [...homePages, ...contact, ...corePages, ...editorialHub, ...editorial, ...guideHub, ...clusterHubs, ...guides];
}
