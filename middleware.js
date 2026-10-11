import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";

// Fast first gate: send visitors without a session cookie to /login.
// The real role checks happen on the server in each layout, page, action and API route.
export function middleware(request) {
  if (getSessionCookie(request)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const url = new URL("/login", request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  runtime: "nodejs", // BetterAuth's cookie helper uses Node APIs
  matcher: ["/student/:path*", "/instructor/:path*", "/dashboard", "/leaderboard/:path*", "/profile/:path*"],
};
