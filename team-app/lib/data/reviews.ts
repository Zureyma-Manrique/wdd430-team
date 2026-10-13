import "server-only";
import { db } from "@/lib/db";
import type { SessionUser, WalkerReview } from "@/lib/types";
import type { ReviewCreateInput } from "@/lib/validation";
import { isUniqueViolation } from "./errors";

/*
 * Walker reviews (stories D1 to D4). A review belongs to one completed walk. `actor` always comes
 * from `getSession()`; the author is never taken from the request body.
 */

type Actor = Pick<SessionUser, "id" | "profileId">;

function toReview(row: {
  id: string;
  walkId: string;
  walkerId: string;
  authorId: string;
  rating: number;
  comment: string | null;
  walkerReply: string | null;
  createdAt: Date;
  editedAt: Date | null;
}): WalkerReview {
  return {
    id: row.id,
    walkId: row.walkId,
    walkerId: row.walkerId,
    authorId: row.authorId,
    rating: row.rating,
    comment: row.comment,
    walkerReply: row.walkerReply,
    createdAt: row.createdAt.toISOString(),
    editedAt: row.editedAt ? row.editedAt.toISOString() : null,
  };
}

export type CreateReviewResult =
  { ok: true; review: WalkerReview } | { ok: false; reason: "NOT_FOUND" | "NOT_COMPLETED" | "ALREADY_REVIEWED" };

/**
 * FR-030: one review per `COMPLETED` walk, written by the owner who booked it. Somebody else's
 * walk is a `NOT_FOUND` (FR-004). The unique index on `walkId` settles two reviews racing for one
 * walk. The walker's average and count are computed from the reviews, so FR-031 holds at once.
 */
export async function createReview(actor: Actor, input: ReviewCreateInput): Promise<CreateReviewResult> {
  const walk = await db().walkBooking.findFirst({
    where: { id: input.walkId, ownerId: actor.profileId },
    select: { id: true, walkerId: true, status: true, review: { select: { id: true } } },
  });
  if (!walk) return { ok: false, reason: "NOT_FOUND" };
  if (walk.status !== "COMPLETED") return { ok: false, reason: "NOT_COMPLETED" };
  if (walk.review) return { ok: false, reason: "ALREADY_REVIEWED" };

  try {
    const row = await db().walkerReview.create({
      data: {
        walkId: walk.id,
        walkerId: walk.walkerId,
        authorId: actor.id,
        rating: input.rating,
        comment: input.comment,
      },
    });
    return { ok: true, review: toReview(row) };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, reason: "ALREADY_REVIEWED" };
    throw error;
  }
}
