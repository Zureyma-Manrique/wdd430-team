import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/metadata";

/*
 * Default share image for every page without its own (`og:image`, `twitter:image`).
 * Generated at build time, so no image file needs to be committed.
 *
 * ImageResponse renders outside the browser and can't read CSS variables, so the colors below
 * copy the light-theme tokens in `app/globals.css`. Keep them in sync if the tokens change.
 */

export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TOKENS = {
  background: "#fbfaf7", // --background
  foreground: "#1c2421", // --foreground
  muted: "#444d49", // --muted
  primary: "#25543e", // --primary
  primaryForeground: "#ffffff", // --primary-foreground
  accentSoft: "#fdf1dc", // --accent-soft
} as const;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: TOKENS.background,
          borderTop: `24px solid ${TOKENS.primary}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              background: TOKENS.primary,
              color: TOKENS.primaryForeground,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            P&amp;P
          </div>
          <div style={{ fontSize: 48, fontWeight: 700, color: TOKENS.foreground }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 700, color: TOKENS.foreground, lineHeight: 1.1 }}>
            {SITE_TAGLINE}
          </div>
          <div style={{ fontSize: 34, color: TOKENS.muted }}>
            Find a walker nearby, book a walk, and follow it live.
          </div>
        </div>

        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              padding: "12px 28px",
              borderRadius: 999,
              background: TOKENS.accentSoft,
              color: TOKENS.foreground,
              fontSize: 28,
            }}
          >
            Reviews only from completed walks
          </div>
        </div>
      </div>
    ),
    size,
  );
}
