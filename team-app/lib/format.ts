import type { DogSize } from "@/lib/types";

/** One decimal place, per story C1 ("average rating (1 decimal)"). */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatHourlyRate(rate: number): string {
  return `$${rate.toFixed(0)}/hr`;
}

const DOG_SIZE_LABELS: Record<DogSize, string> = {
  SMALL: "Small",
  MEDIUM: "Medium",
  LARGE: "Large",
  XLARGE: "Extra large",
};

export function formatDogSize(size: DogSize): string {
  return DOG_SIZE_LABELS[size];
}

/** Stored phone digits for display: a 10-digit US number becomes `(801) 555-0142`; others show as stored. */
export function formatPhone(phone: string): string {
  const match = /^(\d{3})(\d{3})(\d{4})$/.exec(phone);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
}

/** `30` → "30 min". */
export function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

/** Server-side walk time, fixed to UTC so server and client render the same HTML. `LocalDateTime` swaps in the viewer's own zone after hydration. */
export function formatDateTimeUtc(iso: string): string {
  return `${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(iso))} UTC`;
}

/** Up to two initials, e.g. "Sam Rivera" → "SR". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Server-side date label. The fixed locale and UTC zone keep the output deterministic;
 * client components that show local times must format after mount instead.
 */
export function formatDateUtc(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso));
}
