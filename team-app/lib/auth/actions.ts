"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { USER_ROLES } from "@/lib/types";
import { signIn, signOut } from "./auth";
import { googleSignInEnabled, OAUTH_ROLE_COOKIE, OAUTH_ROLE_MAX_AGE_SECONDS } from "./google";

/** Ends the session (story A2, scenario 3). Server Actions are POST-only and origin-checked by Next. */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

/**
 * Starts Google sign-in (story A1). From the sign-up page it carries the chosen role in a short-lived
 * cookie, because a brand-new account needs one (FR-002); from the sign-in page there is no role.
 * Does nothing when Google isn't configured.
 */
export async function googleSignInAction(role?: string): Promise<void> {
  if (!googleSignInEnabled()) return;
  const jar = await cookies();
  const parsedRole = z.enum(USER_ROLES).safeParse(role);
  if (parsedRole.success) {
    jar.set(OAUTH_ROLE_COOKIE, parsedRole.data, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: OAUTH_ROLE_MAX_AGE_SECONDS,
    });
  } else {
    jar.delete(OAUTH_ROLE_COOKIE);
  }
  await signIn("google", { redirectTo: "/dashboard" });
}
