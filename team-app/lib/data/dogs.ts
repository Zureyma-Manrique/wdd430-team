import "server-only";
import type { DogProfile } from "@/lib/types";
import { seedDogs } from "./seed";

/*
 * Dog queries are always scoped by `ownerId`, which callers MUST take from the session,
 * never from the request. A dog that belongs to someone else is indistinguishable from
 * one that doesn't exist (FR-004).
 */

export async function getDogsForOwner(ownerId: string): Promise<DogProfile[]> {
  return seedDogs.filter((dog) => dog.ownerId === ownerId && dog.archivedAt === null);
}

export async function getDogForOwner(ownerId: string, dogId: string): Promise<DogProfile | null> {
  return seedDogs.find((dog) => dog.id === dogId && dog.ownerId === ownerId && dog.archivedAt === null) ?? null;
}
