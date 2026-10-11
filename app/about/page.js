import Link from "next/link";

export const metadata = { title: "About" };

const STEPS = {
  Instructors: [
    "Sign up with the instructor invite code from your administrator.",
    "Create a quiz: add MCQ, True/False or Fill-in-the-Blank questions, set a time limit and a category.",
    "Publish it to get a unique access code and share the code with your class.",
    "Watch results arrive on your dashboard and dig into per-quiz analytics.",
  ],
  Students: [
    "Create a free student account.",
    "Enter the access code your instructor gave you.",
    "Answer before the timer runs out — it auto-submits at zero, and you can resume if you get disconnected.",
    "See your score, the correct answers and your leaderboard position instantly.",
  ],
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-extrabold">About QuizHero</h1>
      <p className="mt-4 text-lg opacity-80">
        QuizHero is an online quiz platform for classrooms and training. Instructors build timed quizzes and share them
        with an access code; students take them, get graded instantly and compete on live leaderboards.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {Object.entries(STEPS).map(([who, steps]) => (
          <div key={who} className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">For {who.toLowerCase()}</h2>
              <ol className="list-decimal space-y-2 pl-5 opacity-85">
                {steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/signup" className="btn btn-primary">Create an account</Link>
        <Link href="/browse" className="btn btn-outline">Browse quizzes</Link>
      </div>
    </div>
  );
}
