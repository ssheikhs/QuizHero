import Link from "next/link";
import AnswerBreakdown from "@/components/AnswerBreakdown";
import { notFound, redirect } from "next/navigation";
import { finalizeAttempt, GRACE_MS } from "@/lib/attempts";
import { collections, toObjectId } from "@/lib/db";
import { formatDuration, scoreLabel } from "@/lib/format";
import { ROLES } from "@/lib/rules";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Quiz Result" };

export default async function ResultPage({ params }) {
  const { id } = await params;
  const user = await requireRole(ROLES.STUDENT);
  const _id = toObjectId(id);
  let attempt = _id && (await collections.attempts().findOne({ _id, userId: user.id }));
  if (!attempt) notFound();

  if (attempt.status !== "submitted") {
    if (Date.now() <= attempt.deadline.getTime() + GRACE_MS) redirect(`/student/attempt/${id}`); // still running
    const quiz = await collections.quizzes().findOne({ _id: attempt.quizId });
    if (!quiz) notFound();
    attempt = (await finalizeAttempt(attempt, quiz, { submittedAt: attempt.deadline, auto: true })) ?? (await collections.attempts().findOne({ _id }));
  }

  // Rank = students with a better score, or the same score in less time, + 1 (same order as the leaderboard).
  const better = await collections.attempts().countDocuments({
    quizId: attempt.quizId,
    status: "submitted",
    $or: [{ score: { $gt: attempt.score } }, { score: attempt.score, timeTakenSec: { $lt: attempt.timeTakenSec } }],
  });
  const participants = await collections.attempts().countDocuments({ quizId: attempt.quizId, status: "submitted" });

  const label = scoreLabel(attempt.score);
  // Full class names (Tailwind only keeps classes it can see in the source).
  const ringColor = { success: "text-success", warning: "text-warning", error: "text-error" }[label.tone];
  const badgeColor = { success: "badge-success", warning: "badge-warning", error: "badge-error" }[label.tone];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="card border border-base-300 bg-base-100 shadow-xl">
        <div className="card-body">
          <p className="text-sm font-semibold tracking-wide text-success uppercase">Submission successful</p>
          <h1 className="text-3xl font-extrabold">{attempt.quizTitle}</h1>
          {attempt.autoSubmitted && <p className="text-sm text-warning">⏰ Submitted automatically when the time ran out.</p>}

          <div className="mt-6 grid items-center gap-8 md:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center gap-3">
              <div
                className={`radial-progress ${ringColor} border-8 border-base-200 bg-base-200/40`}
                style={{ "--value": attempt.score, "--size": "11rem", "--thickness": "0.9rem" }}
                role="progressbar"
                aria-valuenow={attempt.score}
                aria-label={`Score ${attempt.score}%`}
              >
                <span className="text-4xl font-black text-base-content">{attempt.score}%</span>
              </div>
              <span className={`badge badge-lg ${badgeColor}`}>{label.text}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="stat rounded-box bg-base-200">
                <div className="stat-title">Correct answers</div>
                <div className="stat-value text-2xl">
                  {attempt.correctCount} / {attempt.total}
                </div>
              </div>
              <div className="stat rounded-box bg-base-200">
                <div className="stat-title">Time spent</div>
                <div className="stat-value text-2xl">{formatDuration(attempt.timeTakenSec)}</div>
              </div>
              <div className="stat rounded-box bg-base-200">
                <div className="stat-title">Leaderboard rank</div>
                <div className="stat-value text-2xl">
                  #{better + 1} <span className="text-base font-normal opacity-60">of {participants}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:col-span-3">
                <Link href="/student" className="btn btn-ghost">
                  ← Back to dashboard
                </Link>
                <Link href={`/leaderboard/${attempt.quizId}`} className="btn btn-primary">
                  🏆 View leaderboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="mt-10 mb-4 text-2xl font-bold">Answer breakdown</h2>
      <AnswerBreakdown results={attempt.results} />
    </div>
  );
}
