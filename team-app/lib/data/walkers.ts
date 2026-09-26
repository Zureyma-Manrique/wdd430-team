import "server-only";
import type { PublicWalkerReview, Walker, WalkerSummary } from "@/lib/types";
import type { WalkerProfileUpdateInput, WalkerSearchParams } from "@/lib/validation";
import { seedReviews, seedWalkers } from "./seed";

/*
 * Walker queries. These take already-validated, typed arguments and filter with plain
 * comparisons, never string-built queries. When Prisma replaces the seed data, keep that
 * rule: pass values through Prisma's `where` objects and use `$queryRaw` tagged templates
 * (never `$queryRawUnsafe`) for any raw SQL.
 */

// In-memory until Prisma lands (feature/data-model). Kept on globalThis so dev hot reloads keep
// profile edits, like the user store in `users.ts`.
const store = globalThis as typeof globalThis & { __pawsWalkers?: Map<string, Walker> };
const walkersById = (store.__pawsWalkers ??= new Map(seedWalkers.map((walker) => [walker.id, { ...walker }])));

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
  const results = [...walkersById.values()]
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
  const walker = walkersById.get(id);
  return walker && isSearchable(walker) ? withRatings(walker) : null;
}

/**
 * The signed-in walker's own profile, complete or not (story A3). `walkerId` MUST come from
 * the session, never from the request.
 */
export async function getOwnWalkerProfile(walkerId: string): Promise<Walker | null> {
  return walkersById.get(walkerId) ?? null;
}

/** Empty profile for a new walker account (FR-002). No rate or service area, so not searchable yet. */
export async function createWalkerProfile(input: { id: string; userId: string; displayName: string }): Promise<Walker> {
  const walker: Walker = {
    ...input,
    bio: null,
    serviceAreaPostalCodes: [],
    hourlyRate: null,
    photoUrl: null,
    isActive: true,
  };
  walkersById.set(walker.id, walker);
  return walker;
}

/**
 * Applies a validated `PATCH /api/walkers/me` body (FR-040). Omitted fields stay unchanged.
 * Returns `null` when the profile doesn't exist.
 */
export async function updateWalkerProfile(walkerId: string, input: WalkerProfileUpdateInput): Promise<Walker | null> {
  const current = walkersById.get(walkerId);
  if (!current) return null;

  const updated: Walker = {
    ...current,
    ...(input.bio !== undefined ? { bio: input.bio } : {}),
    ...(input.serviceAreaPostalCodes !== undefined ? { serviceAreaPostalCodes: input.serviceAreaPostalCodes } : {}),
    ...(input.hourlyRate !== undefined ? { hourlyRate: input.hourlyRate } : {}),
    ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl } : {}),
    // TODO(feature/schedule-api): setting isActive to false must also cancel upcoming walks.
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  };
  walkersById.set(walkerId, updated);
  return updated;
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
