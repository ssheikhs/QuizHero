import Link from "next/link";
import Avatar from "@/components/Avatar";
import BarChart from "@/components/charts/BarChart";
import StatTile from "@/components/StatTile";
import JoinQuizForm from "@/components/student/JoinQuizForm";
import { finalizeExpiredAttempts } from "@/lib/attempts";
import { collections } from "@/lib/db";
import { formatClock, formatDuration } from "@/lib/format";
import { ROLES } from "@/lib/rules";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Student Dashboard" };

export default async function StudentDashboard() {
  const user = await requireRole(ROLES.STUDENT);
  await finalizeExpiredAttempts({ userId: user.id });

  const [inProgress, recent, totals] = await Promise.all([
    collections.attempts().find({ userId: user.id, status: "in_progress" }).sort({ startedAt: -1 }).toArray(),
    collections
      .attempts()
      .find({ userId: user.id, status: "submitted" }, { projection: { quizTitle: 1, quizId: 1, score: 1, submittedAt: 1 } })
      .sort({ submittedAt: -1 })
      .limit(10)
      .toArray(),
    collections
      .attempts()
      .aggregate([
        { $match: { userId: user.id, status: "submitted" } },
        { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: "$score" }, best: { $max: "$score" }, avgTime: { $avg: "$timeTakenSec" } } },
      ])
      .next(),
  ]);

  // Oldest → newest, so the chart reads left to right / top to bottom in time order.
  const chartRows = [...recent].reverse();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-center gap-4">
        <Link href="/profile" className="tooltip tooltip-bottom" data-tip="Change photo">
          <Avatar name={user.name} image={user.image} size="w-16" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold">👋 Welcome, {user.name}</h1>
          <p className="mt-1 opacity-70">Join a quiz with an access code, or pick up where you left off.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Average score" value={totals ? `${Math.round(totals.avg * 10) / 10}%` : "—"} icon="📈" />
        <StatTile label="Quizzes completed" value={totals?.count ?? 0} icon="✅" />
        <StatTile label="Best score" value={totals ? `${totals.best}%` : "—"} icon="🏆" />
        <StatTile label="Average time" value={totals ? formatDuration(totals.avgTime) : "—"} icon="⏱️" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <section className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">🔑 Join a quiz</h2>
              <JoinQuizForm compact />
            </div>
          </section>

          {inProgress.length > 0 && (
            <section className="card border border-warning/40 bg-warning/5 shadow-sm">
              <div className="card-body">
                <h2 className="card-title">⏳ In progress</h2>
                <ul className="divide-y divide-base-300">
                  {inProgress.map((a) => (
                    <li key={a._id.toString()} className="flex items-center justify-between gap-3 py-2">
                      <div>
                        <p className="font-semibold">{a.quizTitle}</p>
                        <p className="text-xs opacity-60">~{formatClock((a.deadline.getTime() - Date.now()) / 1000)} left</p>
                      </div>
                      <Link href={`/student/attempt/${a._id}`} className="btn btn-warning btn-sm">
                        Resume
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          <section className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">✅ Recently completed</h2>
              {recent.length ? (
                <ul className="divide-y divide-base-300">
                  {recent.slice(0, 5).map((a) => (
                    <li key={a._id.toString()} className="flex items-center justify-between gap-2 py-2">
                      <Link href={`/student/results/${a._id}`} className="link-hover min-w-0 truncate font-medium">
                        📘 {a.quizTitle}
                      </Link>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="badge badge-primary badge-soft">{a.score}%</span>
                        <Link href={`/leaderboard/${a.quizId}`} className="btn btn-ghost btn-xs" aria-label={`Leaderboard for ${a.quizTitle}`}>
                          🏆
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="opacity-60">No quizzes completed yet.</p>
              )}
            </div>
          </section>
        </div>

        <section className="card border border-base-300 bg-base-100 shadow-sm lg:col-span-3">
          <div className="card-body">
            <h2 className="card-title">📊 Performance overview</h2>
            <p className="text-sm opacity-60">Score on your last {chartRows.length || 10} quizzes (oldest at the top).</p>
            <BarChart
              horizontal
              labels={chartRows.map((a) => a.quizTitle)}
              values={chartRows.map((a) => a.score)}
              valueLabel="Score"
              suffix="%"
              max={100}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
