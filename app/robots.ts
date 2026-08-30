import type { MetadataRoute } from "next";
import { absoluteUrl } from "../lib/site";

export default function robots(): MetadataRoute.Robots {
  const publicAccess = { allow: "/", disallow: "/api/" };
  return {
    rules: [
      { userAgent: "*", ...publicAccess },
      { userAgent: "OAI-SearchBot", ...publicAccess },
      { userAgent: "ChatGPT-User", ...publicAccess },
      { userAgent: "Claude-SearchBot", ...publicAccess },
      { userAgent: "Claude-User", ...publicAccess },
      { userAgent: "PerplexityBot", ...publicAccess },
      { userAgent: "Perplexity-User", ...publicAccess },
      { userAgent: "Google-Extended", ...publicAccess }
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/")
  };
}
