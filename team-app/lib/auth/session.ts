import "server-only";
import { cache } from "react";
import type { SessionUser } from "@/lib/types";
import { findUserById } from "@/lib/data/users";
import { auth } from "./auth";

/**
 * Returns the signed-in user, or `null` when there is no session.
 *
 * Every page and Route Handler that exposes private data MUST call this and handle `null`
 * (deny by default), even though `proxy.ts` also guards the protected pages.
 *
 * Wrapped in `cache()`: the header, footer and page of one request all call it, and each call
 * reads the account from the database, so this keeps it to a single lookup per request.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  if (session?.user?.id && session.user.role && session.user.profileId) {
    // Read the account on every request: the name can change after sign-in (story A3), and a
    // token for an account that no longer exists must not count as signed in.
    const account = await findUserById(session.user.id);
    if (!account) {
      return null;
    }
    const { role, profileId } = session.user;
    return { id: account.id, name: account.name, role, profileId };
  }

  // Development-only preview of signed-in views without an account. The NODE_ENV guard means
  // a production build can never create a fake session, even if the variable leaks into its env.
  if (process.env.NODE_ENV === "development") {
    const role = process.env.DEV_MOCK_SESSION_ROLE;
    if (role === "OWNER") {
      return { id: "u_demo_owner", name: "Jordan", role: "OWNER", profileId: "o_demo01" };
    }
    if (role === "WALKER") {
      return { id: "u_sam", name: "Sam", role: "WALKER", profileId: "w_sam01" };
    }
  }
  return null;
});
