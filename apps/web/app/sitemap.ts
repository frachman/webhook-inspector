import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://hookbin.mikrolyt.com/", changeFrequency: "monthly", priority: 1 },
    { url: "https://hookbin.mikrolyt.com/docs", changeFrequency: "monthly", priority: 0.8 },
  ];
}
