import Link from "next/link";
import { notFound } from "next/navigation";
import BarChart from "@/components/charts/BarChart";
import LocalTime from "@/components/LocalTime";
import StatTile from "@/components/StatTile";
import { finalizeExpiredAttempts } from "@/lib/attempts";
import { collections } from "@/lib/db";
import { formatDuration } from "@/lib/format";
import { scoreBand } from "@/lib/instructor-stats";
import { TYPE_LABELS } from "@/lib/quiz-schema";
import { findOwnedQuiz } from "@/lib/quizzes";
import { ROLES } from "@/lib/rules";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Quiz Analytics" };

const BUCKETS = [
  { label: "0–19%", min: 0, max: 19 },
  { label: "20–39%", min: 20, max: 39 },
  { label: "40–59%", min: 40, max: 59 },
  { label: "60–79%", min: 60, max: 79 },
  { label: "80–100%", min: 80, max: 100 },
];

export default async function QuizAnalyticsPage({ params }) {
  const { quizId } = await params;
  const user = await requireRole(ROLES.INSTRUCTOR);
  const quiz = await findOwnedQuiz(quizId, user.id);
  if (!quiz) notFound(); // other instructors' quizzes are invisible

  await finalizeExpiredAttempts({ quizId: quiz._id });

  const [attempts, inProgress, perQuestion] = await Promise.all([
    collections
      .attempts()
      .find(
        { quizId: quiz._id, status: "submitted" },
        { projection: { userName: 1, score: 1, correctCount: 1, total: 1, timeTakenSec: 1, submittedAt: 1, autoSubmitted: 1 } },
      )
      .sort({ score: -1, timeTakenSec: 1, submittedAt: 1 })
      .toArray(),
    collections.attempts().countDocuments({ quizId: quiz._id, status: "in_progress" }),
    collections
      .attempts()
      .aggregate([
        { $match: { quizId: quiz._id, status: "submitted" } },
        { $unwind: "$results" },
        { $group: { _id: "$results.id", asked: { $sum: 1 }, correct: { $sum: { $cond: ["$results.isCorrect", 1, 0] } } } },
      ])
      .toArray(),
  ]);

  const n = attempts.length;
  const avg = n ? Math.round((attempts.reduce((s, a) => s + a.score, 0) / n) * 10) / 10 : null;
  const avgTime = n ? attempts.reduce((s, a) => s + a.timeTakenSec, 0) / n : null;
  const distribution = BUCKETS.map((b) => attempts.filter((a) => a.score >= b.min && a.score <= b.max).length);

  // Per-question correct rate, in the quiz's own order (current questions only).
  const asked = new Map(perQuestion.map((q) => [q._id, q]));
  const questionRows = quiz.questions.map((q, i) => {
    const s = asked.get(q.id);
    return { label: `Q${i + 1}`, text: q.text, type: q.type, asked: s?.asked ?? 0, rate: s?.asked ? Math.round((s.correct / s.asked) * 100) : null };
  });
  const answered = questionRows.filter((q) => q.rate != null);
  const hardest = [...answered].sort((a, b) => a.rate - b.rate)[0];
  const band = scoreBand(avg);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link href="/instructor/analytics" className="btn btn-ghost btn-sm mb-4">
        ← All quizzes
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{quiz.title}</h1>
          <p className="mt-1 opacity-70">
            {quiz.categoryName} · {quiz.published ? `Published · code ${quiz.accessCode}` : "Draft"} · {quiz.questions.length} questions
            {quiz.questionsPerStudent ? ` (${quiz.questionsPerStudent} per student)` : ""} · {Math.round(quiz.timeLimitSec / 60)} min
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/leaderboard/${quiz._id}`} className="btn btn-outline btn-sm">
            🏆 Leaderboard
          </Link>
          <Link href={`/instructor/quizzes/${quiz._id}/edit`} className="btn btn-outline btn-sm">
            Edit quiz
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Participants" value={n} hint={inProgress ? `${inProgress} in progress` : undefined} icon="👥" />
        <StatTile label="Average score" value={avg == null ? "—" : `${avg}%`} hint={band.label} icon="📈" />
        <StatTile
          label="Highest / lowest"
          value={n ? `${attempts[0].score}% / ${Math.min(...attempts.map((a) => a.score))}%` : "—"}
          icon="🏆"
        />
        <StatTile label="Average time" value={avgTime == null ? "—" : formatDuration(avgTime)} hint={`limit ${Math.round(quiz.timeLimitSec / 60)} min`} icon="⏱️" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Score distribution</h2>
            <p className="text-sm opacity-60">Number of students in each score range.</p>
            <BarChart integer labels={BUCKETS.map((b) => b.label)} values={n ? distribution : []} valueLabel="Students" />
          </div>
        </section>
        <section className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Correct answers per question</h2>
            <p className="text-sm opacity-60">
              % of students who got each question right.{hardest ? ` Hardest: ${hardest.label} (${hardest.rate}%).` : ""}
            </p>
            <BarChart
              horizontal
              max={100}
              suffix="%"
              labels={answered.map((q) => `${q.label}. ${q.text}`)}
              values={answered.map((q) => q.rate)}
              valueLabel="Answered correctly"
            />
          </div>
        </section>
      </div>

      {/* Table view of the per-question numbers (full question text). */}
      <section className="card mt-6 border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Question analysis</h2>
          <div className="overflow-x-auto">
            <table className="table-sm table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Question</th>
                  <th>Type</th>
                  <th className="text-right">Times asked</th>
                  <th className="text-right">Correct</th>
                </tr>
              </thead>
              <tbody>
                {questionRows.map((q) => (
                  <tr key={q.label}>
                    <td className="opacity-60">{q.label}</td>
                    <td className="max-w-md">{q.text}</td>
                    <td className="text-xs opacity-70">{TYPE_LABELS[q.type]}</td>
                    <td className="text-right font-mono">{q.asked}</td>
                    <td className="text-right">
                      {q.rate == null ? <span className="opacity-50">—</span> : <span className={`badge ${scoreBand(q.rate).badge} font-mono`}>{q.rate}%</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="card mt-6 border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Participants</h2>
          {n ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th className="text-right">Score</th>
                    <th className="text-right">Correct</th>
                    <th className="text-right">Time</th>
                    <th>Submitted</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a, i) => (
                    <tr key={a._id.toString()} className="hover:bg-base-200/60">
                      <td className="opacity-60">#{i + 1}</td>
                      <td className="font-medium">
                        {a.userName}
                        {a.autoSubmitted && <span className="badge badge-warning badge-sm ml-2">⏰ auto-submitted</span>}
                      </td>
                      <td className="text-right font-mono">{a.score}%</td>
                      <td className="text-right font-mono">
                        {a.correctCount}/{a.total}
                      </td>
                      <td className="text-right font-mono">{formatDuration(a.timeTakenSec)}</td>
                      <td className="text-sm opacity-70">
                        <LocalTime iso={a.submittedAt.toISOString()} />
                      </td>
                      <td>
                        <Link href={`/instructor/analytics/${quiz._id}/attempts/${a._id}`} className="btn btn-ghost btn-xs">
                          Answers
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="opacity-60">No submissions yet. Share the access code {quiz.accessCode ? <code className="font-bold">{quiz.accessCode}</code> : "(publish first)"}.</p>
          )}
        </div>
      </section>
    </div>
  );
}
