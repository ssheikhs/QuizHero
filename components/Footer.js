import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 bg-neutral text-neutral-content">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-xl font-extrabold">
            Quiz<span className="text-cyan-300">Hero</span>
          </p>
          <p className="mt-2 text-sm opacity-80">
            Create, share and take timed quizzes with instant grading and live leaderboards.
          </p>
        </div>
        <div>
          <p className="font-semibold">Quick links</p>
          <ul className="mt-2 space-y-1 text-sm opacity-80">
            <li><Link href="/browse" className="link-hover">Browse quizzes</Link></li>
            <li><Link href="/leaderboard" className="link-hover">Leaderboards</Link></li>
            <li><Link href="/about" className="link-hover">About QuizHero</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Get started</p>
          <ul className="mt-2 space-y-1 text-sm opacity-80">
            <li><Link href="/signup" className="link-hover">Create an account</Link></li>
            <li><Link href="/login" className="link-hover">Log in</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-white/10 py-4 text-center text-xs opacity-70">
        &copy; {new Date().getFullYear()} QuizHero. Built with Next.js &amp; MongoDB.
      </p>
    </footer>
  );
}
