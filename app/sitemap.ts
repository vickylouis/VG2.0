import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

const publicRoutes = [
  { path: "", priority: 1 },
  { path: "/mission", priority: 0.95 },
  { path: "/journey", priority: 0.9 },
  { path: "/analytics", priority: 0.9 },
  { path: "/coach", priority: 0.85 },
  { path: "/journal", priority: 0.8 },
  { path: "/habits", priority: 0.8 },
  { path: "/gallery", priority: 0.8 },
  { path: "/about", priority: 0.7 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return publicRoutes.map(({ path, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority,
  }));
}
