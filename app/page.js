import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { homeFor } from "@/lib/rules";
import heroImage from "@/public/quiz_hero.png";

const TAGLINES = ["🧠 Test Your Knowledge", "⚡ Compete with Friends", "🏆 Become a Quiz Champion", "📈 Track Your Progress"];

const FEATURES = [
  { icon: "🌍", title: "Live Leaderboards", text: "Rankings by score, then by time — updated automatically after every submission." },
  { icon: "⚡", title: "Instant Feedback", text: "Server-side grading the moment you submit, with a question-by-question breakdown." },
  { icon: "📊", title: "Track Performance", text: "Charts for students and detailed per-quiz analytics for instructors." },
  { icon: "🎯", title: "Multiple Categories", text: "Math, Science, Web Programming, C, C++ and more — filter and search to find a quiz." },
  { icon: "⏱️", title: "Timed & Resumable", text: "A countdown that auto-submits at zero. Lost your connection? Resume where you left off." },
  { icon: "🔑", title: "Access Codes", text: "Instructors publish quizzes with a unique code; students join in one step." },
];

export default async function HomePage() {
  const session = await getSession();
  const startHref = session ? homeFor(session.user.role) : "/signup";

  return (
    <>
      <section className="brand-gradient relative overflow-hidden rounded-b-[2.25rem] px-4 pt-20 pb-16 text-center text-white">
        <div className="pointer-events-none absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-violet-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-36 -bottom-36 h-[28rem] w-[28rem] rounded-full bg-cyan-300/25 blur-3xl" />

        <h1 className="relative text-5xl font-black tracking-wide drop-shadow-lg sm:text-6xl">QUIZ HERO</h1>
        <p className="relative mx-auto mt-5 max-w-2xl text-lg leading-relaxed opacity-95 sm:text-xl">
          Challenge yourself with exciting quizzes, sharpen your skills, and climb the leaderboard!
        </p>

        <div className="relative mx-auto mt-6 h-12 overflow-hidden text-2xl font-black drop-shadow sm:h-14 sm:text-4xl" aria-live="polite">
          <div className="tagline-track">
            {TAGLINES.map((line) => (
              <p key={line} className="h-12 leading-[3rem] sm:h-14 sm:leading-[3.5rem]">
                {line}
              </p>
            ))}
          </div>
        </div>

        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Link href={startHref} className="btn btn-lg border-0 bg-white text-slate-900 shadow-xl hover:bg-white/90">
            {session ? "Go to Dashboard" : "Get Started"}
          </Link>
          <Link href="/about" className="btn btn-lg btn-outline border-white/90 text-white hover:bg-white hover:text-slate-900">
            Learn More
          </Link>
        </div>

        <Image
          src={heroImage}
          alt="Students celebrating a quiz win"
          priority
          className="float-slow relative mx-auto mt-10 w-full max-w-xs drop-shadow-2xl sm:max-w-sm"
          sizes="(max-width: 640px) 320px, 420px"
        />
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="bg-gradient-to-r from-purple-600 to-sky-500 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
          Why choose QuizHero?
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card border border-base-300 bg-base-100 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="card-body">
                <h3 className="card-title">
                  <span aria-hidden="true">{feature.icon}</span> {feature.title}
                </h3>
                <p className="opacity-75">{feature.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
