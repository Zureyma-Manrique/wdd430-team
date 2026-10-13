/*
 * Google sign-in (FR-001, story A1, issue #32). It is switched on by environment variables, so the app
 * runs with email and password alone until a Google OAuth client is configured (see README).
 * A plain module (no secrets are read into client code), shared by the Auth.js setup and the pages.
 */

/** True when both Google credentials are set. Empty strings count as unset. */
export function googleSignInEnabled(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

/**
 * Short-lived cookie that carries the role chosen on the sign-up page across the redirect to Google
 * and back, because a new account needs a role (FR-002). It holds only "OWNER" or "WALKER", is
 * validated when read, and is deleted as soon as it is used.
 */
export const OAUTH_ROLE_COOKIE = "pp_oauth_role";
export const OAUTH_ROLE_MAX_AGE_SECONDS = 10 * 60;
