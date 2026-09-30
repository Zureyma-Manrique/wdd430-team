import "server-only";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findUserByEmail } from "@/lib/data/users";
import { passwordFitsBcrypt, signInSchema } from "@/lib/validation/auth";
import { authConfig } from "./config";

/** bcrypt cost factor for new passwords (NFR-003). */
export const PASSWORD_HASH_ROUNDS = 12;

// Compared against when the email is unknown, so a missing account takes as long as a wrong
// password and response timing doesn't reveal which emails are registered. It hashes a random
// value that was thrown away, so no password matches it (unlike the demo accounts' hash).
const TIMING_DUMMY_HASH = "$2b$12$yumpFuBxuaikvPfjD/SJcu3pBOUo0koeCsJM7tPUGc6F07AEWm83u";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
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
