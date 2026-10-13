import "server-only";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { findOrCreateOAuthUser, findUserByEmail } from "@/lib/data/users";
import { USER_ROLES, type UserRole } from "@/lib/types";
import { emailSchema, passwordFitsBcrypt, signInSchema } from "@/lib/validation/auth";
import { authConfig } from "./config";
import { googleSignInEnabled, OAUTH_ROLE_COOKIE } from "./google";

/** bcrypt cost factor for new passwords (NFR-003). */
export const PASSWORD_HASH_ROUNDS = 12;

// Compared against when the email is unknown, so a missing account takes as long as a wrong
// password and response timing doesn't reveal which emails are registered. It hashes a random
// value that was thrown away, so no password matches it (unlike the demo accounts' hash).
const TIMING_DUMMY_HASH = "$2b$12$yumpFuBxuaikvPfjD/SJcu3pBOUo0koeCsJM7tPUGc6F07AEWm83u";

/** The role picked on the sign-up page, read once and removed. Anything but OWNER or WALKER counts as none. */
async function takeOAuthRole(): Promise<UserRole | null> {
  const jar = await cookies();
  const value = jar.get(OAUTH_ROLE_COOKIE)?.value;
  jar.delete(OAUTH_ROLE_COOKIE);
  return USER_ROLES.find((role) => role === value) ?? null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Google sign-in (story A1): Google must vouch for the email, then it is matched to our own
     * account (or one is created with the chosen role). The result replaces the Google profile on
     * `user`, so the JWT carries our id, role and profile id, exactly like credentials sign-in.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      const email = emailSchema.safeParse(profile?.email);
      if (profile?.email_verified !== true || !email.success) return "/sign-in?error=google";

      const name = (profile.name ?? "").trim().slice(0, 80) || email.data.split("@")[0] || "Paws & Paths member";
      const role = await takeOAuthRole();
      const result = await findOrCreateOAuthUser({
        email: email.data,
        name,
        role,
        // A random value nobody sees, so password sign-in can never match it.
        createLockedHash: () => bcrypt.hash(randomBytes(32).toString("hex"), PASSWORD_HASH_ROUNDS),
      });
      if (!result.ok) return "/sign-up?error=google-role";

      const { id, name: accountName, role: accountRole, profileId } = result.user;
      Object.assign(user, { id, name: accountName, role: accountRole, profileId });
      return true;
    },
  },
  providers: [
    ...(googleSignInEnabled() ? [Google] : []),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse({ email: credentials.email, password: credentials.password });
        // bcrypt ignores bytes after the 72nd, so a longer password could match a hash it
        // didn't create. Reject it with the same generic failure (NFR-003).
        if (!parsed.success || !passwordFitsBcrypt(parsed.data.password)) return null;

        const account = await findUserByEmail(parsed.data.email);
        const passwordMatches = await bcrypt.compare(parsed.data.password, account?.passwordHash ?? TIMING_DUMMY_HASH);
        if (!account || !passwordMatches) return null;

        return { id: account.id, name: account.name, role: account.role, profileId: account.profileId };
      },
    }),
  ],
});
