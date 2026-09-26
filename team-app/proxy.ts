import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

/**
 * Sends signed-out visitors on protected pages (/dashboard, /dogs, /walks, /profile) to sign-in and back again afterwards
 * (story A1, scenario 5). Pages and Route Handlers still check the session themselves;
 * this is the first layer, not the only one.
 */
export const proxy = auth((request) => {
  if (request.auth?.user) {
    return NextResponse.next();
  }
  // Mirrors the development-only mock session in `lib/auth/session.ts`.
  if (process.env.NODE_ENV === "development" && process.env.DEV_MOCK_SESSION_ROLE) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const signInUrl = new URL("/sign-in", request.nextUrl.origin);
  signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: ["/dashboard/:path*", "/dogs/:path*", "/walks/:path*", "/profile/:path*"],
};
