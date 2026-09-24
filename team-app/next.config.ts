import type { NextConfig } from "next";

/**
 * Baseline security headers for every response. A nonce-based `script-src` CSP should be
 * added in `proxy.ts` once Auth.js lands. It is left out here because a static policy would
 * need 'unsafe-inline' for Next's inline scripts.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // The spec's canonical route is /sign-in; keep /login working for anyone who types it.
    return [{ source: "/login", destination: "/sign-in", permanent: false }];
  },
};

export default nextConfig;
