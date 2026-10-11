import Link from "next/link";
import Avatar from "@/components/Avatar";
import BarChart from "@/components/charts/BarChart";
import ParticipantsByQuiz from "@/components/instructor/ParticipantsByQuiz";
import StatTile from "@/components/StatTile";
import { collections } from "@/lib/db";
import { getQuizStats } from "@/lib/instructor-stats";
import { ROLES } from "@/lib/rules";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Instructor Dashboard" };

export default async function InstructorDashboard() {
  const user = await requireRole(ROLES.INSTRUCTOR);
  const stats = await getQuizStats(user.id); // also closes expired attempts first

  const participantsRows = await collections
    .attempts()
    .find(
      { ownerId: user.id, status: "submitted" },
      { projection: { quizId: 1, userName: 1, score: 1, timeTakenSec: 1, submittedAt: 1 } },
    )
    .sort({ submittedAt: -1 })
    .limit(500)
    .toArray();

  const totalParticipants = stats.reduce((n, q) => n + q.participants, 0);
  const inProgress = stats.reduce((n, q) => n + q.inProgress, 0);
  const scored = stats.filter((q) => q.avgScore != null);
  const overallAvg = totalParticipants
    ? Math.round((scored.reduce((sum, q) => sum + q.avgScore * q.participants, 0) / totalParticipants) * 10) / 10
    : null;
  const charted = stats.filter((q) => q.published || q.participants);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link href="/profile" className="tooltip tooltip-bottom" data-tip="Change photo">
            <Avatar name={user.name} image={user.image} size="w-16" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold">Welcome, {user.name}!</h1>
            <p className="mt-1 opacity-70">Your quizzes, participants, and performance at a glance.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/instructor/quizzes/new" className="btn btn-primary">
            + New quiz
          </Link>
          <Link href="/instructor/analytics" className="btn btn-outline">
            Analytics
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Quizzes created" value={stats.length} hint={`${stats.filter((q) => q.published).length} published`} icon="📝" />
        <StatTile label="Total participants" value={totalParticipants} hint={inProgress ? `${inProgress} taking a quiz right now` : undefined} icon="👥" />
        <StatTile label="Average score" value={overallAvg == null ? "—" : `${overallAvg}%`} hint="across all your quizzes" icon="📈" />
        <StatTile label="Best quiz average" value={scored.length ? `${Math.max(...scored.map((q) => q.avgScore))}%` : "—"} icon="🏆" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Participants per quiz</h2>
            <BarChart horizontal integer labels={charted.map((q) => q.title)} values={charted.map((q) => q.participants)} valueLabel="Participants" />
          </div>
        </section>
        <section className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Average score per quiz</h2>
            <BarChart
              horizontal
              max={100}
              suffix="%"
              labels={charted.map((q) => q.title)}
              values={charted.map((q) => q.avgScore ?? 0)}
              valueLabel="Average score"
            />
          </div>
        </section>
      </div>

      <section className="card mt-6 border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <ParticipantsByQuiz
            quizzes={stats.map((q) => ({ id: q.id, title: q.title }))}
            rows={participantsRows.map((r) => ({
              id: r._id.toString(),
              quizId: r.quizId.toString(),
              name: r.userName,
              score: r.score,
              time: r.timeTakenSec,
              submittedAt: r.submittedAt.toISOString(),
            }))}
          />
        </div>
      </section>
    </div>
  );
}
