import "server-only";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findUserByEmail } from "@/lib/data/users";
import { signInSchema } from "@/lib/validation/auth";
import { authConfig } from "./config";

/** bcrypt cost factor for new passwords (NFR-003). */
export const PASSWORD_HASH_ROUNDS = 12;

// Compared against when the email is unknown, so a missing account takes as long as a wrong
// password and response timing doesn't reveal which emails are registered.
const TIMING_DUMMY_HASH = "$2b$12$ug/7x2fQ0067oUfms0N2veyy03ZGwAOxm8RUuzwjC4mB2lQB23ipK";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse({ email: credentials.email, password: credentials.password });
        if (!parsed.success) return null;

        const account = await findUserByEmail(parsed.data.email);
        const passwordMatches = await bcrypt.compare(parsed.data.password, account?.passwordHash ?? TIMING_DUMMY_HASH);
        if (!account || !passwordMatches) return null;

        return { id: account.id, name: account.name, role: account.role, profileId: account.profileId };
      },
    }),
  ],
});
