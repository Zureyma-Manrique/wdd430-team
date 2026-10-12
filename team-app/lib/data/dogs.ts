import "server-only";
import { db } from "@/lib/db";
import type { DogProfile } from "@/lib/types";
import type { DogCreateInput, DogUpdateInput } from "@/lib/validation";
import { toDogProfile } from "./mappers";

/*
 * Dog queries are always scoped by `ownerId`, which callers MUST take from the session,
 * never from the request. A dog that belongs to someone else is indistinguishable from
 * one that doesn't exist (FR-004). "Delete" archives the dog (`archivedAt`) so past walks and
 * reviews keep their dog.
 */

/** `YYYY-MM-DD` from the validated form, as the UTC midnight Prisma stores for a `@db.Date`. */
function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function getDogsForOwner(ownerId: string): Promise<DogProfile[]> {
  const rows = await db().dog.findMany({
    where: { ownerId, archivedAt: null },
    orderBy: [{ createdAt: "asc" }, { name: "asc" }],
  });
  return rows.map(toDogProfile);
}

export async function getDogForOwner(ownerId: string, dogId: string): Promise<DogProfile | null> {
  const row = await db().dog.findFirst({ where: { id: dogId, ownerId, archivedAt: null } });
  return row ? toDogProfile(row) : null;
}

/** FR-011: creates a dog for the signed-in owner. */
export async function createDog(ownerId: string, input: DogCreateInput): Promise<DogProfile> {
  const row = await db().dog.create({
    data: {
      ownerId,
      name: input.name,
      size: input.size,
      breed: input.breed,
      birthDate: input.birthDate ? toDate(input.birthDate) : undefined,
      weightKg: input.weightKg,
      notes: input.notes,
      photoUrl: input.photoUrl,
    },
  });
  return toDogProfile(row);
}

/** FR-012: partial update. `null` clears an optional field; omitted fields stay as they are. */
export async function updateDog(ownerId: string, dogId: string, input: DogUpdateInput): Promise<DogProfile | null> {
  // `updateMany` with the owner in `where` makes "not yours" and "doesn't exist" the same result.
  const { count } = await db().dog.updateMany({
    where: { id: dogId, ownerId, archivedAt: null },
    data: {
      name: input.name,
      size: input.size,
      breed: input.breed,
      birthDate: input.birthDate === undefined ? undefined : input.birthDate === null ? null : toDate(input.birthDate),
      weightKg: input.weightKg,
      notes: input.notes,
      photoUrl: input.photoUrl,
    },
  });
  return count === 0 ? null : getDogForOwner(ownerId, dogId);
}

export type ArchiveDogResult = { ok: true } | { ok: false; reason: "NOT_FOUND" | "HAS_UPCOMING_WALKS" };

/** FR-013: soft delete. Refused while the dog has a pending, confirmed or in-progress walk. */
export async function archiveDog(ownerId: string, dogId: string): Promise<ArchiveDogResult> {
  const dog = await getDogForOwner(ownerId, dogId);
  if (!dog) return { ok: false, reason: "NOT_FOUND" };

  const activeWalks = await db().walkBooking.count({
    where: {
      dogId,
      OR: [{ status: "IN_PROGRESS" }, { status: { in: ["PENDING", "CONFIRMED"] }, startAt: { gte: new Date() } }],
    },
  });
  if (activeWalks > 0) return { ok: false, reason: "HAS_UPCOMING_WALKS" };

  await db().dog.update({ where: { id: dogId }, data: { archivedAt: new Date() } });
  return { ok: true };
}
