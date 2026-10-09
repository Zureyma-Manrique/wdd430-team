import "server-only";
import { getSession } from "@/lib/auth/session";
import type { SessionUser, UserRole } from "@/lib/types";
import { apiError } from "./http";

export type RoleGuardResult = { ok: true; session: SessionUser } | { ok: false; response: Response };

interface RoleGuardMessages {
  /** Shown when nobody is signed in (`401`). */
  unauthorized: string;
  /** Shown when the account has the other role (`403`). */
  forbidden: string;
}

/**
 * The first two checks of every protected Route Handler, in the order CLAUDE.md requires:
 * `getSession()` → `401`, then role → `403`. Validation (`400`) and ownership (`404`) come after.
 *
 * Take the acting user's id only from `result.session`, never from the body, query or URL.
 */
export async function requireRole(role: UserRole, messages: RoleGuardMessages): Promise<RoleGuardResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, response: apiError(401, "UNAUTHORIZED", messages.unauthorized) };
  }
  if (session.role !== role) {
    return { ok: false, response: apiError(403, "FORBIDDEN", messages.forbidden) };
  }
  return { ok: true, session };
}

/** For endpoints that any signed-in person may call, whatever their role. Only `401` applies. */
export async function requireSignedIn(unauthorized: string): Promise<RoleGuardResult> {
  const session = await getSession();
  return session ? { ok: true, session } : { ok: false, response: apiError(401, "UNAUTHORIZED", unauthorized) };
}
