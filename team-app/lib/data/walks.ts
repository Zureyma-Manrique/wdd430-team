import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { SessionUser, WalkDurationMinutes, WalkStatusAction, WalkSummary } from "@/lib/types";
import { checkTransition } from "@/lib/walks/transitions";
import { startOfDayUtc, startOfNextDayUtc } from "@/lib/walks/dates";
import type { WalkCreateInput, WalkListQuery, WalkStatusChangeInput } from "@/lib/validation";
import { isOverlapViolation } from "./errors";

/*
 * Walk bookings (stories C2 to C5). Every query is scoped to the signed-in person: an owner sees
 * the walks they booked, a walker the walks assigned to them (`actorWhere`). Somebody else's walk
 * is indistinguishable from a missing one (FR-004). `actor` always comes from `getSession()`.
 */

type Actor = Pick<SessionUser, "id" | "role" | "profileId">;

const summaryInclude = {
  dog: { select: { name: true } },
  walker: { select: { displayName: true } },
  owner: { select: { user: { select: { name: true } } } },
} satisfies Prisma.WalkBookingInclude;

type WalkRow = Prisma.WalkBookingGetPayload<{ include: typeof summaryInclude }>;

function toWalkSummary(row: WalkRow): WalkSummary {
  return {
    id: row.id,
    dogId: row.dogId,
    ownerId: row.ownerId,
    walkerId: row.walkerId,
    startAt: row.startAt.toISOString(),
    endAt: row.endAt.toISOString(),
    // The database CHECK constraint allows only 30, 45 and 60.
    durationMinutes: row.durationMinutes as WalkDurationMinutes,
    status: row.status,
    pickupNotes: row.pickupNotes,
    actualStartAt: row.actualStartAt ? row.actualStartAt.toISOString() : null,
    actualEndAt: row.actualEndAt ? row.actualEndAt.toISOString() : null,
    sessionNotes: row.sessionNotes,
    cancellation:
      row.cancelledAt && row.cancelledByUserId
        ? {
            cancelledByUserId: row.cancelledByUserId,
            reason: row.cancellationReason,
            cancelledAt: row.cancelledAt.toISOString(),
          }
        : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    dogName: row.dog.name,
    walkerName: row.walker.displayName,
    ownerName: row.owner.user.name,
  };
}

/** The part of every walk query that limits it to this person's own walks. */
function actorWhere(actor: Actor): Prisma.WalkBookingWhereInput {
  return actor.role === "OWNER" ? { ownerId: actor.profileId } : { walkerId: actor.profileId };
}

export type CreateWalkResult = { ok: true; walk: WalkSummary } | { ok: false; reason: "OVERLAP" };

/**
 * FR-020 to FR-022: a new request is `PENDING`. The caller has already checked that the dog is
 * the owner's and the walker is bookable. Overlaps are rejected by the database constraint, so
 * two requests racing for one slot can't both succeed.
 */
export async function createWalk(ownerId: string, input: WalkCreateInput): Promise<CreateWalkResult> {
  const startAt = new Date(input.startAt);
  const endAt = new Date(startAt.getTime() + input.durationMinutes * 60_000);
  try {
    const row = await db().walkBooking.create({
      data: {
        dogId: input.dogId,
        ownerId,
        walkerId: input.walkerId,
        startAt,
        endAt,
        durationMinutes: input.durationMinutes,
        pickupNotes: input.pickupNotes,
      },
      include: summaryInclude,
    });
    return { ok: true, walk: toWalkSummary(row) };
  } catch (error) {
    if (isOverlapViolation(error)) return { ok: false, reason: "OVERLAP" };
    throw error;
  }
}

/** FR-025: my walks, soonest first, with optional status, dog and date filters. */
export async function listWalks(actor: Actor, query: WalkListQuery): Promise<{ walks: WalkSummary[]; total: number }> {
  const where: Prisma.WalkBookingWhereInput = {
    ...actorWhere(actor),
    ...(query.status ? { status: { in: query.status } } : {}),
    ...(query.dogId ? { dogId: query.dogId } : {}),
    ...(query.from || query.to
      ? {
          startAt: {
            ...(query.from ? { gte: startOfDayUtc(query.from, query.tz) } : {}),
            ...(query.to ? { lt: startOfNextDayUtc(query.to, query.tz) } : {}),
          },
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db().walkBooking.findMany({
      where,
      orderBy: { startAt: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: summaryInclude,
    }),
    db().walkBooking.count({ where }),
  ]);
  return { walks: rows.map(toWalkSummary), total };
}

/** Walks that still need attention, soonest first: requested, confirmed or under way, not yet past. */
export async function getUpcomingWalks(actor: Actor, limit: number): Promise<WalkSummary[]> {
  const rows = await db().walkBooking.findMany({
    where: {
      ...actorWhere(actor),
      OR: [{ status: "IN_PROGRESS" }, { status: { in: ["PENDING", "CONFIRMED"] }, endAt: { gte: new Date() } }],
    },
    orderBy: { startAt: "asc" },
    take: limit,
    include: summaryInclude,
  });
  return rows.map(toWalkSummary);
}

/** Everything else: finished, declined, cancelled, or requests whose time has passed. Newest first. */
export async function getPastWalks(actor: Actor, limit: number): Promise<WalkSummary[]> {
  const rows = await db().walkBooking.findMany({
    where: {
      ...actorWhere(actor),
      NOT: {
        OR: [{ status: "IN_PROGRESS" }, { status: { in: ["PENDING", "CONFIRMED"] }, endAt: { gte: new Date() } }],
      },
    },
    orderBy: { startAt: "desc" },
    take: limit,
    include: summaryInclude,
  });
  return rows.map(toWalkSummary);
}

export type ChangeWalkStatusResult =
  { ok: true; walk: WalkSummary } | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "TOO_EARLY" };

/**
 * FR-023: applies one status change. Only the walk's owner or walker can touch it (`404`
 * otherwise); the role must be allowed to take the action (`FORBIDDEN`), and the walk must be in
 * a state that allows it (`CONFLICT`). The update names the status it expects, so two people
 * acting on the same walk at once can't both win.
 */
export async function changeWalkStatus(
  actor: Actor,
  walkId: string,
  change: WalkStatusChangeInput,
  now: Date = new Date(),
): Promise<ChangeWalkStatusResult> {
  const walk = await db().walkBooking.findFirst({ where: { id: walkId, ...actorWhere(actor) } });
  if (!walk) return { ok: false, reason: "NOT_FOUND" };

  const check = checkTransition(change.action, walk, actor.role, now);
  if (!check.ok) {
    return {
      ok: false,
      reason: check.reason === "WRONG_ROLE" ? "FORBIDDEN" : check.reason === "TOO_EARLY" ? "TOO_EARLY" : "CONFLICT",
    };
  }

  const { count } = await db().walkBooking.updateMany({
    where: { id: walk.id, status: walk.status },
    data: { status: check.to, ...extraFieldsFor(change.action, actor, change, now) },
  });
  if (count === 0) return { ok: false, reason: "CONFLICT" };

  const updated = await db().walkBooking.findUniqueOrThrow({ where: { id: walk.id }, include: summaryInclude });
  return { ok: true, walk: toWalkSummary(updated) };
}

/** Columns that go with a status change: who cancelled and why, when a walk started or ended. */
function extraFieldsFor(
  action: WalkStatusAction,
  actor: Actor,
  change: WalkStatusChangeInput,
  now: Date,
): Prisma.WalkBookingUpdateManyMutationInput {
  switch (action) {
    case "cancel":
      return { cancelledByUserId: actor.id, cancellationReason: change.reason, cancelledAt: now };
    case "start":
      return { actualStartAt: now };
    case "complete":
      return { actualEndAt: now, sessionNotes: change.sessionNotes };
    default:
      return {};
  }
}
