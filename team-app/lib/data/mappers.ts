import "server-only";
import type { Dog, PetOwner as PetOwnerRow, Walker as WalkerRow } from "@/generated/prisma/client";
import type { DogProfile, PetOwner, Walker } from "@/lib/types";

/*
 * Prisma rows to the app's domain types (lib/types). Domain objects cross the server to client
 * boundary, so dates become ISO strings and database-only columns (createdAt, ...) are dropped.
 */

export function toWalker(row: WalkerRow): Walker {
  return {
    id: row.id,
    userId: row.userId,
    displayName: row.displayName,
    bio: row.bio,
    serviceAreaPostalCodes: row.serviceAreaPostalCodes,
    hourlyRate: row.hourlyRate,
    photoUrl: row.photoUrl,
    isActive: row.isActive,
  };
}

export function toPetOwner(row: PetOwnerRow): PetOwner {
  return { id: row.id, userId: row.userId, phone: row.phone, postalCode: row.postalCode };
}

export function toDogProfile(row: Dog): DogProfile {
  return {
    id: row.id,
    ownerId: row.ownerId,
    name: row.name,
    breed: row.breed,
    size: row.size,
    // `birthDate` is a calendar date (`@db.Date`): keep only `YYYY-MM-DD`.
    birthDate: row.birthDate ? row.birthDate.toISOString().slice(0, 10) : null,
    weightKg: row.weightKg,
    notes: row.notes,
    photoUrl: row.photoUrl,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
  };
}
