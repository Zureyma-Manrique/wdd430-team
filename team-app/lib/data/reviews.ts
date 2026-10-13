import "server-only";
import { db } from "@/lib/db";
import type { SessionUser, WalkerReview } from "@/lib/types";
import type { ReviewCreateInput, ReviewUpdateInput } from "@/lib/validation";
import { isWithinEditWindow } from "@/lib/reviews/edit-window";
import { isNotFound, isUniqueViolation } from "./errors";

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

export type UpdateReviewResult = { ok: true; review: WalkerReview } | { ok: false; reason: "NOT_FOUND" | "LOCKED" };

/**
 * Story D3, FR-031/FR-032: only the author can edit, and only within 30 days. Somebody else's
 * review is a `NOT_FOUND` (FR-004). The walker's average is computed from the reviews, so it
 * reflects the new rating at once.
 */
export async function updateReview(
  actor: Actor,
  reviewId: string,
  input: ReviewUpdateInput,
  now: Date = new Date(),
): Promise<UpdateReviewResult> {
  const review = await db().walkerReview.findFirst({ where: { id: reviewId, authorId: actor.id } });
  if (!review) return { ok: false, reason: "NOT_FOUND" };
  if (!isWithinEditWindow(review.createdAt, now)) return { ok: false, reason: "LOCKED" };

  const row = await db().walkerReview.update({
    where: { id: review.id },
    data: {
      ...(input.rating !== undefined ? { rating: input.rating } : {}),
      ...(input.comment !== undefined ? { comment: input.comment } : {}),
      editedAt: now,
    },
  });
  return { ok: true, review: toReview(row) };
}

/** Story D3: the author may delete their review at any time. `false` means it wasn't theirs or is gone. */
export async function deleteReview(actor: Actor, reviewId: string): Promise<boolean> {
  const { count } = await db().walkerReview.deleteMany({ where: { id: reviewId, authorId: actor.id } });
  return count > 0;
}

/**
 * Story D4, FR-033: the reviewed walker posts one reply to a review, and posting again replaces
 * it. A review of another walker is a `NOT_FOUND`.
 */
export async function replyToReview(
  walker: Pick<SessionUser, "profileId">,
  reviewId: string,
  reply: string,
): Promise<WalkerReview | null> {
  try {
    const { count } = await db().walkerReview.updateMany({
      where: { id: reviewId, walkerId: walker.profileId },
      data: { walkerReply: reply },
    });
    if (count === 0) return null;
    return toReview(await db().walkerReview.findUniqueOrThrow({ where: { id: reviewId } }));
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}
