import "server-only";
import type { PublicWalkerReview, Walker, WalkerSummary } from "@/lib/types";
import type { WalkerSearchParams } from "@/lib/validation";
import { seedReviews, seedWalkers } from "./seed";

/*
 * Walker queries. These take already-validated, typed arguments and filter with plain
 * comparisons, never string-built queries. When Prisma replaces the seed data, keep that
 * rule: pass values through Prisma's `where` objects and use `$queryRaw` tagged templates
 * (never `$queryRawUnsafe`) for any raw SQL.
 */

function isSearchable(walker: Walker): boolean {
  return walker.isActive && walker.hourlyRate !== null && walker.serviceAreaPostalCodes.length > 0;
}

function withRatings(walker: Walker): WalkerSummary {
  const reviews = seedReviews.filter((review) => review.walkerId === walker.id);
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    ...walker,
    averageRating: reviews.length > 0 ? total / reviews.length : null,
    reviewCount: reviews.length,
  };
}

/** FR-041: active walkers with a complete profile, filtered and sorted. */
export async function searchWalkers(filters: WalkerSearchParams): Promise<WalkerSummary[]> {
  const results = seedWalkers
    .filter(isSearchable)
    .filter((walker) => !filters.postalCode || walker.serviceAreaPostalCodes.includes(filters.postalCode))
    .map(withRatings)
    .filter(
      (walker) =>
        filters.minRating === undefined ||
        (walker.averageRating !== null && walker.averageRating >= filters.minRating),
    );

  if (filters.sort === "price") {
    return results.sort((a, b) => (a.hourlyRate ?? 0) - (b.hourlyRate ?? 0));
  }
  // Rating, highest first; walkers without reviews go last.
  return results.sort((a, b) => (b.averageRating ?? -1) - (a.averageRating ?? -1));
}

/** Public profile. Inactive or incomplete walkers resolve to `null` (rendered as 404). */
export async function getWalkerById(id: string): Promise<WalkerSummary | null> {
  const walker = seedWalkers.find((candidate) => candidate.id === id);
  return walker && isSearchable(walker) ? withRatings(walker) : null;
}

/** FR-034: newest first. `limit` is capped by the caller's validated query. */
export async function getWalkerReviews(
  walkerId: string,
  limit: number,
): Promise<{ reviews: PublicWalkerReview[]; total: number }> {
  const all = seedReviews
    .filter((review) => review.walkerId === walkerId)
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { reviews: all.slice(0, limit), total: all.length };
}
