import type { MetadataRoute } from "next";
import { getTiles } from "@/lib/db";

const BASE = "https://astertiles.ie";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/collections`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/visualizer`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const tilePages: MetadataRoute.Sitemap = (await getTiles()).map((t) => ({
    url: `${BASE}/tiles/${t.id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...tilePages];
}
