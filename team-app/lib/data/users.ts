import "server-only";
import type { User as UserRow } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { User, UserRole } from "@/lib/types";
import { isNotFound, isUniqueViolation } from "./errors";

/*
 * Account storage for Auth.js credentials sign-in (stories A1, A2). Every query goes through
 * Prisma's typed API, so values are always bound as parameters and never built into SQL strings.
 */

/** Stored account. The hash never leaves `lib/data` or `lib/auth`. */
export interface UserAccount extends User {
  passwordHash: string;
  /** PetOwner.id or Walker.id, depending on `role`. */
  profileId: string;
}

/** Just the id of the role profile; `toAccount` picks the one that matches `role`. */
const withProfileIds = { owner: { select: { id: true } }, walker: { select: { id: true } } } as const;

type UserRowWithProfiles = UserRow & { owner: { id: string } | null; walker: { id: string } | null };

function toAccount(row: UserRowWithProfiles | null): UserAccount | null {
  if (!row) return null;
  const profileId = row.role === "OWNER" ? row.owner?.id : row.walker?.id;
  // A user without its role profile can't use the app (FR-002); treat it as "no account".
  if (!profileId) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    passwordHash: row.passwordHash,
    profileId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** `email` must already be normalized (trimmed, lowercased) by `emailSchema`. */
export async function findUserByEmail(email: string): Promise<UserAccount | null> {
  return toAccount(await db().user.findUnique({ where: { email }, include: withProfileIds }));
}

export async function findUserById(id: string): Promise<UserAccount | null> {
  return toAccount(await db().user.findUnique({ where: { id }, include: withProfileIds }));
}

/** Renames the account (story A3). `name` must already be validated. Returns `null` if the user doesn't exist. */
export async function updateUserName(id: string, name: string): Promise<UserAccount | null> {
  try {
    return toAccount(await db().user.update({ where: { id }, data: { name }, include: withProfileIds }));
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export interface NewUserAccount {
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
}

export type CreateUserResult = { ok: true; user: UserAccount } | { ok: false; reason: "EMAIL_TAKEN" };

/**
 * Creates the user and its empty role profile in one transaction (FR-002). A new walker profile
 * has no rate or service area, so it stays out of search until the walker completes it at
 * /profile (FR-041). The UNIQUE constraint on `email` rejects duplicates, even when two
 * sign-ups race.
 */
export async function createUser(input: NewUserAccount): Promise<CreateUserResult> {
  try {
    const row = await db().user.create({
      data: {
        email: input.email,
        name: input.name,
        role: input.role,
        passwordHash: input.passwordHash,
        ...(input.role === "WALKER" ? { walker: { create: { displayName: input.name } } } : { owner: { create: {} } }),
      },
      include: withProfileIds,
    });
    const user = toAccount(row);
    if (!user) throw new Error("A new account is missing its role profile");
    return { ok: true, user };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, reason: "EMAIL_TAKEN" };
    throw error;
  }
}
