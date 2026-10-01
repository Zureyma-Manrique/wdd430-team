import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/metadata";

// Read SITE_URL when the file is requested, not at build time, so the sitemap link is right
// even if the variable is only set on the running server.
export const dynamic = "force-dynamic";

/**
 * /robots.txt. Public pages are crawlable; signed-in pages and the API are not. Signed-in pages
 * also send `noindex` (see `pageMetadata({ private: true })`), so they stay out of search even
 * when a crawler reaches them through a link.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/profile", "/dogs", "/walks"],
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
