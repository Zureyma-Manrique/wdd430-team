import type { WalkerSummary } from "@/lib/types";
import { formatHourlyRate } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { RatingBadge } from "./rating-badge";
import { WalkerAvatar } from "./walker-avatar";

interface WalkerCardProps {
  walker: WalkerSummary;
}

export function WalkerCard({ walker }: WalkerCardProps) {
  const headingId = `walker-${walker.id}-name`;

  return (
    <article
      aria-labelledby={headingId}
      className="flex h-full flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <WalkerAvatar name={walker.displayName} />
        <div className="min-w-0 flex-1">
          <h3 id={headingId} className="truncate text-lg font-semibold text-foreground">
            {walker.displayName}
          </h3>
          <div className="mt-1">
            <RatingBadge averageRating={walker.averageRating} reviewCount={walker.reviewCount} />
          </div>
        </div>
        {walker.hourlyRate !== null ? (
          <p className="text-right text-lg font-bold text-foreground">
            {formatHourlyRate(walker.hourlyRate)}
          </p>
        ) : null}
      </div>

      {walker.bio ? <p className="line-clamp-3 text-sm text-muted">{walker.bio}</p> : null}

      <p className="text-xs text-muted">
        <span className="font-medium text-foreground">Serves:</span> {walker.serviceAreaPostalCodes.join(", ")}
      </p>

      <ButtonLink href={`/walkers/${walker.id}`} className="mt-auto w-full">
        View profile &amp; book
        <span className="sr-only"> {walker.displayName}</span>
      </ButtonLink>
    </article>
  );
}
