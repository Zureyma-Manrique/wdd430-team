import type { DefaultSession, NextAuthConfig } from "next-auth";
import { z } from "zod";
import { USER_ROLES, type UserRole } from "@/lib/types";

/*
 * Auth.js settings shared by `lib/auth/auth.ts` (full server config) and `proxy.ts`.
 * This file must not import the user store or bcrypt: the proxy only needs to read the
 * session cookie, so it gets this lighter config.
 */

declare module "next-auth" {
  interface Session {
    user: { id: string; role: UserRole; profileId: string } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: UserRole;
    profileId?: string;
  }
}

/** What `authorize` returns and what the JWT carries. Never the password hash. */
export const authUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(USER_ROLES),
  profileId: z.string().min(1),
});

export const authConfig = {
  pages: { signIn: "/sign-in" },
  // JWT sessions until Prisma lands; the spec's database sessions need the Prisma adapter.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      // `user` is only present right after sign-in.
      if (user) {
        const parsed = authUserSchema.parse(user);
        token.sub = parsed.id;
        token.name = parsed.name;
        token.role = parsed.role;
        token.profileId = parsed.profileId;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub && token.role && token.profileId) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.profileId = token.profileId;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
