import "server-only";
import { db } from "@/lib/db";
import type { PetOwner } from "@/lib/types";
import type { OwnerProfileUpdateInput } from "@/lib/validation";
import { isNotFound } from "./errors";
import { toPetOwner } from "./mappers";

/*
 * Owner profiles (story A3). Callers MUST take `ownerId` from the session, never from the request.
 * The empty profile for a new owner is created together with the account (see `createUser`).
 */

export async function getOwnOwnerProfile(ownerId: string): Promise<PetOwner | null> {
  const row = await db().petOwner.findUnique({ where: { id: ownerId } });
  return row ? toPetOwner(row) : null;
}

/** Applies the phone and postal code from a validated `PATCH /api/owners/me` body. Omitted fields stay unchanged. */
export async function updateOwnerProfile(
  ownerId: string,
  input: Pick<OwnerProfileUpdateInput, "phone" | "postalCode">,
): Promise<PetOwner | null> {
  try {
    // `undefined` leaves a column alone; `null` clears it.
    const row = await db().petOwner.update({
      where: { id: ownerId },
      data: { phone: input.phone, postalCode: input.postalCode },
    });
    return toPetOwner(row);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}
