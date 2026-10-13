import { formatDuration } from "@/lib/format";
import type { UserRole, WalkSummary } from "@/lib/types";
import { availableActions, canReschedule } from "@/lib/walks/transitions";
import { LocalDateTime } from "./local-date-time";
import { isWithinEditWindow } from "@/lib/reviews/edit-window";
import { ReviewActions } from "./review-actions";
import { ReviewForm } from "./review-form";
import { ReviewReplyForm } from "./review-reply-form";
import { WalkActions } from "./walk-actions";
import { WalkStatusBadge } from "./walk-status-badge";

interface WalkCardProps {
  walk: WalkSummary;
  viewerRole: UserRole;
  /** The current time. Passed in so one page uses one clock for every card. */
  now: Date;
}

/** One walk: who, when, status, and the actions this person may take (stories C3 to C5). */
export function WalkCard({ walk, viewerRole, now }: WalkCardProps) {
  const headingId = `walk-${walk.id}-title`;
  const actions = availableActions(walk, viewerRole, now);
  // Each side sees the other side's name.
  const title =
    viewerRole === "OWNER" ? `${walk.dogName} with ${walk.walkerName}` : `${walk.dogName}, owned by ${walk.ownerName}`;

  return (
    <article
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 id={headingId} className="min-w-0 break-words text-lg font-semibold text-foreground">
          {title}
        </h3>
        <WalkStatusBadge status={walk.status} />
      </div>

      <p className="text-sm text-muted">
        <LocalDateTime iso={walk.startAt} /> · {formatDuration(walk.durationMinutes)}
      </p>

      {walk.pickupNotes ? (
        <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-foreground">
          <span className="font-medium">Pickup notes:</span> {walk.pickupNotes}
        </p>
      ) : null}
      {walk.review ? (
        <div className="flex flex-col gap-2">
          <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
            <span aria-hidden="true">{"★".repeat(walk.review.rating)}</span>
            <span className="sr-only">Review: {walk.review.rating} out of 5 stars.</span>
            {walk.review.comment ? <span className="ml-2 text-foreground">{walk.review.comment}</span> : null}
            {walk.review.editedAt ? <span className="ml-2 text-xs text-muted">(edited)</span> : null}
          </p>
          {walk.review.walkerReply ? (
            <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-foreground">
              <span className="font-medium">Reply from {walk.walkerName}:</span> {walk.review.walkerReply}
            </p>
          ) : null}
          {viewerRole === "OWNER" ? (
            <ReviewActions
              walkId={walk.id}
              walkerName={walk.walkerName}
              review={walk.review}
              canEdit={isWithinEditWindow(walk.review.createdAt, now)}
            />
          ) : (
            <ReviewReplyForm
              reviewId={walk.review.id}
              currentReply={walk.review.walkerReply}
              ownerName={walk.ownerName}
            />
          )}
        </div>
      ) : viewerRole === "OWNER" && walk.status === "COMPLETED" ? (
        <ReviewForm walkId={walk.id} walkerName={walk.walkerName} />
      ) : null}
      {walk.cancellation?.reason ? <p className="text-sm text-muted">Reason: {walk.cancellation.reason}</p> : null}

      <WalkActions walkId={walk.id} actions={actions} dogName={walk.dogName} />
      {viewerRole === "OWNER" && canReschedule(walk, now) ? (
        <RescheduleForm walkId={walk.id} dogName={walk.dogName} />
      ) : null}
    </article>
  );
}
