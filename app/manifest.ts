import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VibeFootprint",
    short_name: "VibeFootprint",
    description: "Public website pattern and security scanner.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f2ed",
    theme_color: "#14211d"
  };
}

