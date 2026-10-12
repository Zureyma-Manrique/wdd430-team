/*
 * Calendar-day helpers for the walk list filters (FR-025): "from" and "to" are dates in the
 * caller's time zone, so they are turned into UTC instants before querying.
 */

/** Offset of `timeZone` from UTC at `instant`, in milliseconds (positive east of UTC). */
function zoneOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** The UTC instant at which `date` (`YYYY-MM-DD`) starts in `timeZone`. */
export function startOfDayUtc(date: string, timeZone: string): Date {
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const guess = Date.UTC(year, month - 1, day);
  // Two passes settle the offset on days where it changes (daylight saving).
  const first = guess - zoneOffsetMs(guess, timeZone);
  return new Date(guess - zoneOffsetMs(first, timeZone));
}

/** The UTC instant at which the day *after* `date` starts, so a "to" date includes all of its last day. */
export function startOfNextDayUtc(date: string, timeZone: string): Date {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return startOfDayUtc(next.toISOString().slice(0, 10), timeZone);
}
