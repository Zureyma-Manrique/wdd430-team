"use client";

import { useSyncExternalStore } from "react";
import { formatDateTimeUtc } from "@/lib/format";

const noSubscription = () => () => {};

/**
 * A moment shown in the viewer's own time zone. The server (and the first client render) show it
 * in UTC; once the page is hydrated, React switches to the browser's zone. No `Date.now()` or
 * locale lookup happens during the first render, so there is no hydration mismatch.
 */
export function LocalDateTime({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    noSubscription,
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)),
    () => formatDateTimeUtc(iso),
  );
  return <time dateTime={iso}>{text}</time>;
}
