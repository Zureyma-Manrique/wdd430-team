import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { PublicWalkerProfile, PublicWalkerReview, Walker, WalkerSummary } from "@/lib/types";
import type { WalkerProfileUpdateInput, WalkerSearchParams } from "@/lib/validation";
import { isNotFound } from "./errors";
import { toWalker } from "./mappers";

/*
 * Walker queries. They take already-validated, typed arguments and pass them to Prisma's `where`
 * objects, so values are always bound as parameters. For raw SQL use `$queryRaw` tagged
 * templates, never `$queryRawUnsafe` (CLAUDE.md, security rule 5).
 */

/** FR-041: only active walkers with a rate and at least one service area appear in search. */
const searchableWhere = {
  isActive: true,
  hourlyRate: { not: null },
  serviceAreaPostalCodes: { isEmpty: false },
} satisfies Prisma.WalkerWhereInput;

/** Average rating and review count per walker, in one grouped query. */
async function ratingsFor(walkerIds: string[]): Promise<Map<string, { average: number | null; count: number }>> {
  if (walkerIds.length === 0) return new Map();
  const groups = await db().walkerReview.groupBy({
    by: ["walkerId"],
    where: { walkerId: { in: walkerIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(groups.map((group) => [group.walkerId, { average: group._avg.rating, count: group._count._all }]));
}

async function withRatings(rows: Parameters<typeof toWalker>[0][]): Promise<WalkerSummary[]> {
  const ratings = await ratingsFor(rows.map((row) => row.id));
  return rows.map((row) => {
    const rating = ratings.get(row.id);
    return { ...toWalker(row), averageRating: rating?.average ?? null, reviewCount: rating?.count ?? 0 };
  });
}

/** FR-041: active walkers with a complete profile, filtered and sorted. */
export async function searchWalkers(filters: WalkerSearchParams): Promise<WalkerSummary[]> {
  const rows = await db().walker.findMany({
    where: {
      ...searchableWhere,
      // Prisma list filters take exactly one operator. A list that has the code isn't empty, so
      // `has` alone keeps the "at least one service area" rule from `searchableWhere`.
      ...(filters.postalCode ? { serviceAreaPostalCodes: { has: filters.postalCode } } : {}),
    },
  });

  const { minRating } = filters;
  const results = (await withRatings(rows)).filter(
    (walker) => minRating === undefined || (walker.averageRating !== null && walker.averageRating >= minRating),
  );

  if (filters.sort === "price") {
    return results.sort((a, b) => (a.hourlyRate ?? 0) - (b.hourlyRate ?? 0));
  }
  // Rating, highest first; walkers without reviews go last.
  return results.sort((a, b) => (b.averageRating ?? -1) - (a.averageRating ?? -1));
}

/** Public profile. Inactive or incomplete walkers resolve to `null` (rendered as 404). */
export async function getWalkerById(id: string): Promise<WalkerSummary | null> {
  const row = await db().walker.findFirst({ where: { id, ...searchableWhere } });
  if (!row) return null;
  const [summary] = await withRatings([row]);
  return summary ?? null;
}

/** Public shape of a searchable walker (FR-040): no account id or internal flags. */
export function toPublicWalkerProfile(walker: WalkerSummary): PublicWalkerProfile {
  const { id, displayName, bio, serviceAreaPostalCodes, hourlyRate, photoUrl, averageRating, reviewCount } = walker;
  return { id, displayName, bio, serviceAreaPostalCodes, hourlyRate, photoUrl, averageRating, reviewCount };
}

/**
 * The signed-in walker's own profile, complete or not (story A3). `walkerId` MUST come from
 * the session, never from the request.
 */
export async function getOwnWalkerProfile(walkerId: string): Promise<Walker | null> {
  const row = await db().walker.findUnique({ where: { id: walkerId } });
  return row ? toWalker(row) : null;
}

/**
 * Applies a validated `PATCH /api/walkers/me` body (FR-040). Omitted fields stay unchanged.
 * Returns `null` when the profile doesn't exist.
 */
export async function updateWalkerProfile(walkerId: string, input: WalkerProfileUpdateInput): Promise<Walker | null> {
  try {
    // TODO: setting isActive to false must also cancel upcoming walks (spec §6 PATCH
    // /api/walkers/me and the "walker deactivates" edge case). Tracked in issue #35.
    const row = await db().walker.update({
      where: { id: walkerId },
      data: {
        bio: input.bio,
        serviceAreaPostalCodes: input.serviceAreaPostalCodes,
        hourlyRate: input.hourlyRate,
        photoUrl: input.photoUrl,
        isActive: input.isActive,
      },
    });
    return toWalker(row);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/** FR-034: newest first. `limit` is capped by the caller's validated query. */
export async function getWalkerReviews(
  walkerId: string,
  limit: number,
): Promise<{ reviews: PublicWalkerReview[]; total: number }> {
  const where = { walkerId } satisfies Prisma.WalkerReviewWhereInput;
  const [rows, total] = await Promise.all([
    db().walkerReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        author: { select: { name: true } },
        walk: { select: { dog: { select: { name: true } } } },
      },
    }),
    db().walkerReview.count({ where }),
  ]);

  const reviews = rows.map((row) => ({
    id: row.id,
    walkId: row.walkId,
    walkerId: row.walkerId,
    authorId: row.authorId,
    // Only the first name is public (spec D2).
    authorFirstName: row.author.name.split(/\s+/)[0] ?? row.author.name,
    dogName: row.walk.dog.name,
    rating: row.rating,
    comment: row.comment,
    walkerReply: row.walkerReply,
    createdAt: row.createdAt.toISOString(),
    editedAt: row.editedAt ? row.editedAt.toISOString() : null,
  }));
  return { reviews, total };
}
