"use server";

import { signOut } from "./auth";

/** Ends the session (story A2, scenario 3). Server Actions are POST-only and origin-checked by Next. */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
