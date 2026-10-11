import Link from "next/link";
import { getSession } from "@/lib/session";
import { ROLES } from "@/lib/rules";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";

const LINKS = {
  guest: [
    { href: "/", label: "Home" },
    { href: "/browse", label: "Browse Quizzes" },
    { href: "/about", label: "About" },
  ],
  [ROLES.STUDENT]: [
    { href: "/student", label: "Dashboard" },
    { href: "/student/join", label: "Join Quiz" },
    { href: "/browse", label: "Browse Quizzes" },
    { href: "/leaderboard", label: "Leaderboard" },
  ],
  [ROLES.INSTRUCTOR]: [
    { href: "/instructor", label: "Dashboard" },
    { href: "/instructor/quizzes", label: "My Quizzes" },
    { href: "/instructor/quizzes/new", label: "Create Quiz" },
    { href: "/browse", label: "Browse" },
    { href: "/instructor/analytics", label: "Analytics" },
    { href: "/leaderboard", label: "Leaderboard" },
  ],
};

export default async function Navbar() {
  const session = await getSession();
  const user = session?.user;
  const links = user ? (LINKS[user.role] ?? LINKS[ROLES.STUDENT]) : LINKS.guest;

  return (
    <header className="brand-gradient sticky top-0 z-40 text-white shadow-lg">
      <nav className="navbar mx-auto max-w-7xl px-4">
        <div className="navbar-start gap-1">
          <div className="dropdown lg:hidden">
            <button tabIndex={0} className="btn btn-ghost btn-square" aria-label="Open menu">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <ul tabIndex={0} className="menu dropdown-content z-50 mt-3 w-56 rounded-box bg-base-100 p-2 text-base-content shadow-lg">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <Link href={user ? links[0].href : "/"} className="text-2xl font-extrabold tracking-wide">
            Quiz<span className="text-cyan-200">Hero</span>
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal gap-1 px-1 font-semibold">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:bg-white/15">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="navbar-end gap-2">
          {user ? (
            <>
              <NotificationBell />
              <UserMenu user={{ id: user.id, name: user.name, email: user.email, role: user.role, image: user.image ?? null }} />
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm text-white hover:bg-white/15">
                Login
              </Link>
              <Link href="/signup" className="btn btn-sm border-0 bg-white text-primary hover:bg-white/90">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
