import "server-only";
import type { PetOwner } from "@/lib/types";
import type { OwnerProfileUpdateInput } from "@/lib/validation";
import { seedOwners } from "./seed";

/*
 * Owner profiles (story A3). Callers MUST take `ownerId` from the session, never from the request.
 * In-memory until Prisma lands (feature/data-model); kept on globalThis like the other stores.
 */

const store = globalThis as typeof globalThis & { __pawsOwners?: Map<string, PetOwner> };
const ownersById = (store.__pawsOwners ??= new Map(seedOwners.map((owner) => [owner.id, { ...owner }])));

export async function getOwnOwnerProfile(ownerId: string): Promise<PetOwner | null> {
  return ownersById.get(ownerId) ?? null;
}

/** Empty profile for a new owner account (FR-002). */
export async function createOwnerProfile(input: { id: string; userId: string }): Promise<PetOwner> {
  const owner: PetOwner = { ...input, phone: null, postalCode: null };
  ownersById.set(owner.id, owner);
  return owner;
}

/** Applies the phone and postal code from a validated `PATCH /api/owners/me` body. Omitted fields stay unchanged. */
export async function updateOwnerProfile(
  ownerId: string,
  input: Pick<OwnerProfileUpdateInput, "phone" | "postalCode">,
): Promise<PetOwner | null> {
  const current = ownersById.get(ownerId);
  if (!current) return null;

  const updated: PetOwner = {
    ...current,
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
  };
  ownersById.set(ownerId, updated);
  return updated;
}
