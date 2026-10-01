import type { MetadataRoute } from "next";
import { searchWalkers } from "@/lib/data/walkers";
import { SITE_URL } from "@/lib/metadata";

// Walker profiles change at runtime (story A3), so build the list per request, not at build time.
export const dynamic = "force-dynamic";

/** /sitemap.xml: the public pages plus every walker that appears in search (FR-041). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => new URL(path, SITE_URL).toString();
  const walkers = await searchWalkers({ sort: "rating" });

  return [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    { url: url("/walkers"), changeFrequency: "daily", priority: 0.8 },
    ...walkers.map((walker) => ({
      url: url(`/walkers/${walker.id}`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
