import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://hookbin.farandy.id/", changeFrequency: "monthly", priority: 1 },
    { url: "https://hookbin.farandy.id/docs", changeFrequency: "monthly", priority: 0.8 },
  ];
}
