import "server-only";
import type { User, UserRole } from "@/lib/types";

/*
 * Account storage for Auth.js credentials sign-in (stories A1, A2).
 *
 * In-memory until Prisma + Postgres land (feature/data-model). Accounts created through
 * sign-up live only as long as the server process. When Prisma arrives, keep these function
 * signatures and swap the bodies for `prisma.user` queries; the email column gets a UNIQUE
 * constraint so duplicate sign-ups are rejected by the database, not just this check.
 */

/** Stored account. The hash never leaves `lib/data` or `lib/auth`. */
export interface UserAccount extends User {
  passwordHash: string;
  /** PetOwner.id or Walker.id, depending on `role`. */
  profileId: string;
}

// bcrypt (cost 12) of the shared demo password documented in the README.
const DEMO_PASSWORD_HASH = "$2b$12$ug/7x2fQ0067oUfms0N2veyy03ZGwAOxm8RUuzwjC4mB2lQB23ipK";

/** Demo accounts linked to the existing seed data (Jordan owns Biscuit and Luna; Sam is a seeded walker). */
const demoAccounts: UserAccount[] = [
  {
    id: "u_demo_owner",
    email: "jordan@example.com",
    name: "Jordan",
    role: "OWNER",
    profileId: "o_demo01",
    passwordHash: DEMO_PASSWORD_HASH,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "u_sam",
    email: "sam@example.com",
    name: "Sam",
    role: "WALKER",
    profileId: "w_sam01",
    passwordHash: DEMO_PASSWORD_HASH,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
];

// Kept on globalThis so dev hot reloads don't wipe accounts created during a session.
const store = globalThis as typeof globalThis & { __pawsUserAccounts?: Map<string, UserAccount> };
const accountsByEmail = (store.__pawsUserAccounts ??= new Map(
  demoAccounts.map((account) => [account.email, account]),
));

/** `email` must already be normalized (trimmed, lowercased) by `emailSchema`. */
export async function findUserByEmail(email: string): Promise<UserAccount | null> {
  return accountsByEmail.get(email) ?? null;
}

export interface NewUserAccount {
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
}

export type CreateUserResult = { ok: true; user: UserAccount } | { ok: false; reason: "EMAIL_TAKEN" };

/**
 * Creates the user and its empty role profile (FR-002). A new walker profile has no rate or
 * service area, so it stays out of search until story A3 completes it (FR-041).
 */
export async function createUser(input: NewUserAccount): Promise<CreateUserResult> {
  if (accountsByEmail.has(input.email)) {
    return { ok: false, reason: "EMAIL_TAKEN" };
  }

  const now = new Date().toISOString();
  const suffix = crypto.randomUUID();
  const user: UserAccount = {
    ...input,
    id: `u_${suffix}`,
    profileId: `${input.role === "OWNER" ? "o" : "w"}_${suffix}`,
    createdAt: now,
    updatedAt: now,
  };
  accountsByEmail.set(user.email, user);
  return { ok: true, user };
}
