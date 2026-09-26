import "server-only";
import type { SessionUser } from "@/lib/types";
import { auth } from "./auth";

/**
 * Returns the signed-in user, or `null` when there is no session.
 *
 * Every page and Route Handler that exposes private data MUST call this and handle `null`
 * (deny by default), even though `proxy.ts` also guards the protected pages.
 */
export async function getSession(): Promise<SessionUser | null> {
  const session = await auth();
  if (session?.user?.id && session.user.role && session.user.profileId) {
    const { id, name, role, profileId } = session.user;
    return { id, name: name ?? "", role, profileId };
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
}
