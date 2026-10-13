"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { WalkBookingStatus } from "@/lib/types";
import { z } from "zod";

const POLL_INTERVAL_MS = 10_000;

const responseSchema = z.object({ walk: z.object({ status: z.string() }) });

/** Statuses that can still change under the viewer's feet. Everything else is final. */
const LIVE_STATUSES: readonly WalkBookingStatus[] = ["CONFIRMED", "IN_PROGRESS"];

/**
 * Live status for the walk detail page (story C6, FR-026): while the walk is `CONFIRMED` or
 * `IN_PROGRESS`, ask `GET /api/walks/[id]` every 10 seconds (the spec's polling design, §5). When
 * the status differs from what the page was rendered with, `router.refresh()` re-renders the page
 * from the server, so the badge, notes and buttons all update with no manual reload. Polling stops
 * once the walk is over, and is skipped while the tab is hidden.
 */
export function WalkStatusPoller({ walkId, status }: { walkId: string; status: WalkBookingStatus }) {
  const router = useRouter();
  const liveRef = useRef<HTMLParagraphElement>(null);
  const live = LIVE_STATUSES.includes(status);

  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    const timer = setInterval(async () => {
      if (document.hidden) return;
      try {
        const response = await fetch(`/api/walks/${walkId}`, { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const parsed = responseSchema.safeParse(await response.json());
        if (parsed.success && parsed.data.walk.status !== status) {
          if (liveRef.current) liveRef.current.textContent = "This walk's status just changed.";
          router.refresh();
        }
      } catch {
        // A failed poll is ignored; the next one tries again.
      }
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [live, status, walkId, router]);

  return live ? (
    <p ref={liveRef} role="status" className="text-xs text-muted">
      This page updates by itself while the walk is under way.
    </p>
  ) : (
    <p ref={liveRef} role="status" className="sr-only" />
  );
}
