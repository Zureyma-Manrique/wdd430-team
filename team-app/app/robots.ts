import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/metadata";

// Read SITE_URL when the file is requested, not at build time, so the sitemap link is right
// even if the variable is only set on the running server.
export const dynamic = "force-dynamic";

/**
 * /robots.txt. Public pages are crawlable; signed-in pages and the API are not.
 *
 * `Disallow` and `noindex` do different jobs and don't combine: a crawler that obeys `Disallow`
 * never fetches the page, so it never reads the page's `noindex`, and a disallowed URL that other
 * sites link to can still be listed (URL only). Signed-out visitors are redirected to /sign-in
 * anyway. For a page that should be fetched but not listed, use `pageMetadata({ private: true })`
 * and do NOT add it here. /sign-in and /sign-up are public entry pages, so they stay indexable
 * (a `noindex` there would also fail Lighthouse's SEO "is-crawlable" audit).
 *
 * Keep the signed-in paths below in sync with `matcher` in proxy.ts (that one must stay a
 * static literal, so it can't import a shared list).
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
