import { formatRating } from "@/lib/format";

interface RatingBadgeProps {
  averageRating: number | null;
  reviewCount: number;
}

/** The visible text always states the rating, so color and the star icon are never the only cue. */
export function RatingBadge({ averageRating, reviewCount }: RatingBadgeProps) {
  if (averageRating === null || reviewCount === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted">
        No reviews yet
      </span>
    );
  }

  const reviewLabel = `${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
      <span aria-hidden="true">★</span>
      {formatRating(averageRating)}
      <span className="font-normal">({reviewLabel})</span>
      <span className="sr-only">average rating out of 5</span>
    </span>
  );
}
