import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { "en-US": site.url, "sr-Latn-RS": `${site.url}/sr` };
  return [
    { url: site.url, changeFrequency: "monthly", priority: 1, alternates: { languages } },
    { url: `${site.url}/sr`, changeFrequency: "monthly", priority: 0.9, alternates: { languages } },
  ];
}
