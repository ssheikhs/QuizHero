import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { homeFor } from "./rules";

/** Current session on the server, or null when logged out / auth unavailable. */
export async function getSession() {
  // Read headers outside the try/catch so Next.js still treats the page as dynamic.
  const requestHeaders = await headers();

  try {
    return await auth.api.getSession({ headers: requestHeaders });
  } catch (error) {
    console.error("[auth] getSession failed:", error?.message);
    return null;
  }
}

/** Logged-in user for a page, or redirect to /login. */
export async function requireUser(next) {
  const session = await getSession();
  if (!session) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return session.user;
}

/** Logged-in user with the given role for a page; other roles are sent to their own dashboard. */
export async function requireRole(role, next) {
  const user = await requireUser(next);
  if (user.role !== role) redirect(homeFor(user.role));
  return user;
}

/**
 * Same check for server actions and route handlers: returns the user or null
 * (never redirects, so callers can answer with an error instead).
 */
export async function userWithRole(role) {
  const session = await getSession();
  if (!session) return null;
  if (role && session.user.role !== role) return null;
  return session.user;
}
