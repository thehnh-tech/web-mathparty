import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const GUEST_COOKIE = "bombatique_guest";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const sessionCookie = getSessionCookie(req);
  const guestCookie = req.cookies.get(GUEST_COOKIE);
  const isAuth = !!sessionCookie;
  const isGuest = !!guestCookie;

  // Authed/guest users skip the login screen
  if (path === "/login" && (isAuth || isGuest)) {
    return NextResponse.redirect(new URL("/lobby", req.url));
  }

  // /profile is auth-only — guests blocked
  if (path.startsWith("/profile")) {
    if (!isAuth) return NextResponse.redirect(new URL("/login", req.url));
  }

  // /lobby and /room — auth or guest
  if (path.startsWith("/lobby") || path.startsWith("/room")) {
    if (!isAuth && !isGuest) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // /onboarding — must be authed, except step 1 / 1b (check inbox pages shown before auth)
  if (path.startsWith("/onboarding")) {
    const isPreAuthStep = path === "/onboarding/1" || path === "/onboarding/1b";
    if (!isAuth && !isPreAuthStep) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/lobby/:path*", "/profile/:path*", "/room/:path*", "/onboarding/:path*"],
};
