const fallbackSiteUrl = "https://vibe-bench-cyan.vercel.app";

function normalizeSiteUrl(value: string | undefined) {
  const candidate = value?.trim() || fallbackSiteUrl;
  try {
    const parsed = new URL(candidate.startsWith("http") ? candidate : `https://${candidate}`);
    return parsed.origin;
  } catch {
    return fallbackSiteUrl;
  }
}

export const siteOrigin = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export function absoluteUrl(path = "/") {
  return new URL(path, `${siteOrigin}/`).toString();
}

