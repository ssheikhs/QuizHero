import Link from "next/link";
import { formatDuration } from "@/lib/format";
import { getQuizStats, scoreBand } from "@/lib/instructor-stats";
import { ROLES } from "@/lib/rules";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const user = await requireRole(ROLES.INSTRUCTOR);
  const stats = await getQuizStats(user.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Analytics</h1>
          <p className="mt-1 opacity-70">Average score per quiz, based on your participants. Open a quiz for the full breakdown.</p>
        </div>
        <Link href="/instructor/quizzes/new" className="btn btn-primary">
          + New quiz
        </Link>
      </div>

      <div className="card mt-6 border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body p-0 sm:p-2">
          {stats.length ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Quiz</th>
                    <th className="min-w-48">Performance</th>
                    <th className="text-right">Avg score</th>
                    <th className="text-right">Participants</th>
                    <th className="text-right">Highest</th>
                    <th className="text-right">Avg time</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {stats.map((q, i) => {
                    const band = scoreBand(q.avgScore);
                    return (
                      <tr key={q.id} className="hover:bg-base-200/60">
                        <td className="opacity-60">{i + 1}</td>
                        <td>
                          <p className="font-semibold">{q.title}</p>
                          <p className="text-xs opacity-60">
                            {q.category} · {q.published ? "Published" : "Draft"}
                          </p>
                        </td>
                        <td>
                          <progress className={`${band.bar} w-full`} value={q.avgScore ?? 0} max={100} aria-label={`Average ${q.avgScore ?? 0}%`} />
                        </td>
                        <td className="text-right">
                          {/* Colour + a word, never colour alone */}
                          <span className={`badge ${band.badge} gap-1 font-mono`}>{q.avgScore == null ? "—" : `${q.avgScore}%`}</span>
                          <p className="mt-0.5 text-xs opacity-60">{band.label}</p>
                        </td>
                        <td className="text-right font-mono">{q.participants}</td>
                        <td className="text-right font-mono">{q.highest == null ? "—" : `${q.highest}%`}</td>
                        <td className="text-right font-mono">{q.avgTime == null ? "—" : formatDuration(q.avgTime)}</td>
                        <td>
                          <Link href={`/instructor/analytics/${q.id}`} className="btn btn-outline btn-xs">
                            Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-10 text-center opacity-60">No quizzes yet — create one to see analytics.</p>
          )}
        </div>
      </div>
    </div>
  );
}
