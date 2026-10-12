import type { WalkBookingStatus } from "@/lib/types";

const STATUS_BADGES: Record<WalkBookingStatus, { label: string; classes: string }> = {
  PENDING: { label: "Requested", classes: "bg-accent-soft text-accent" },
  CONFIRMED: { label: "Confirmed", classes: "bg-primary-soft text-primary" },
  IN_PROGRESS: { label: "In progress", classes: "bg-primary-soft text-primary" },
  COMPLETED: { label: "Completed", classes: "bg-surface-muted text-foreground" },
  DECLINED: { label: "Declined", classes: "bg-danger-soft text-danger" },
  CANCELLED: { label: "Cancelled", classes: "bg-danger-soft text-danger" },
  EXPIRED: { label: "Expired", classes: "bg-surface-muted text-muted" },
};

/** The one badge for a walk's status. The label is always text, so status is never shown by color alone. */
export function WalkStatusBadge({ status }: { status: WalkBookingStatus }) {
  const { label, classes } = STATUS_BADGES[status];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}
