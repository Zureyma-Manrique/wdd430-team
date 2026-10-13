"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/form-field";
import { textLinkClasses } from "@/components/ui/styles";
import { WALK_BOOKING_STATUSES } from "@/lib/types";

interface WalkFiltersProps {
  status: string;
  from: string;
  to: string;
  active: boolean;
}

const noSubscription = () => () => {};

const STATUS_LABELS: Record<(typeof WALK_BOOKING_STATUSES)[number], string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

/**
 * Status and date-range filters for My walks (story C4, FR-025). A plain GET form, so the filters
 * live in the URL. The viewer's time zone goes along as `tz`, so "from" and "to" cover whole local
 * days. It is read with `useSyncExternalStore` (server value "UTC"), so there is no hydration mismatch.
 */
export function WalkFilters({ status, from, to, active }: WalkFiltersProps) {
  const tz = useSyncExternalStore(
    noSubscription,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    () => "UTC",
  );

  return (
    <form
      method="get"
      action="/walks"
      aria-label="Filter my walks"
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm"
    >
      <input type="hidden" name="tz" value={tz} />
      <div className="grid gap-3 sm:grid-cols-3">
        <SelectField id="walk-filter-status" label="Status" name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {WALK_BOOKING_STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </SelectField>
        <TextField id="walk-filter-from" label="From" name="from" type="date" defaultValue={from} />
        <TextField id="walk-filter-to" label="To" name="to" type="date" defaultValue={to} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">Apply filters</Button>
        {active ? (
          <Link href="/walks" className={textLinkClasses}>
            Clear filters
          </Link>
        ) : null}
      </div>
    </form>
  );
}
