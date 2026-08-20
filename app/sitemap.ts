import type { MetadataRoute } from "next";
import { absoluteUrl } from "../lib/site";
import { seoPagePairs } from "../lib/seo-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-08-20T00:00:00.000Z");
  const homePages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1, alternates: { languages: { en: absoluteUrl("/"), de: absoluteUrl("/de"), "x-default": absoluteUrl("/") } } },
    { url: absoluteUrl("/de"), lastModified: now, changeFrequency: "weekly", priority: 0.9, alternates: { languages: { en: absoluteUrl("/"), de: absoluteUrl("/de"), "x-default": absoluteUrl("/") } } }
  ];
  const contentPages = seoPagePairs.flatMap(({ en, de }) => [
    { url: absoluteUrl(en), lastModified: now, changeFrequency: "monthly" as const, priority: en === "/methodology" ? 0.8 : 0.75, alternates: { languages: { en: absoluteUrl(en), de: absoluteUrl(de), "x-default": absoluteUrl(en) } } },
    { url: absoluteUrl(de), lastModified: now, changeFrequency: "monthly" as const, priority: de === "/de/methodik" ? 0.75 : 0.7, alternates: { languages: { en: absoluteUrl(en), de: absoluteUrl(de), "x-default": absoluteUrl(en) } } }
  ]);
  return [...homePages, ...contentPages];
}

