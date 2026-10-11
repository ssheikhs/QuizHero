import Link from "next/link";
import { notFound } from "next/navigation";
import AutoRefresh from "@/components/AutoRefresh";
import Avatar from "@/components/Avatar";
import { collections, toObjectId } from "@/lib/db";
import { formatDuration } from "@/lib/format";
import { findViewableQuiz, getLeaderboard } from "@/lib/leaderboard";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Leaderboard" };

const MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };
const PODIUM = { 1: "bg-amber-100 text-amber-900", 2: "bg-slate-200 text-slate-800", 3: "bg-orange-100 text-orange-900" };

export default async function QuizLeaderboard({ params }) {
  const { quizId } = await params;
  const user = await requireUser(`/leaderboard/${quizId}`);
  const quiz = await findViewableQuiz(quizId, user);
  if (!quiz) notFound();

  const rows = await getLeaderboard(quiz._id);
  const mine = rows.find((r) => r.userId === user.id);
  const photos = new Map(
    (
      await collections
        .users()
        .find({ _id: { $in: rows.map((r) => toObjectId(r.userId)).filter(Boolean) } }, { projection: { image: 1 } })
        .toArray()
    ).map((u) => [u._id.toString(), u.image]),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <AutoRefresh seconds={10} />
      <Link href="/leaderboard" className="btn btn-ghost btn-sm mb-4">
        ← All leaderboards
      </Link>

      <div className="card overflow-hidden border border-base-300 bg-base-100 shadow-sm">
        <div className="brand-gradient px-6 py-6 text-white">
          <p className="text-sm font-semibold tracking-wide uppercase opacity-80">🏆 Leaderboard</p>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{quiz.title}</h1>
          <p className="mt-1 text-sm opacity-90">
            {quiz.categoryName} · by {quiz.ownerName} · {rows.length} participant{rows.length === 1 ? "" : "s"} · updates every 10 seconds
          </p>
        </div>

        {mine && (
          <div className="border-b border-base-300 bg-primary/5 px-6 py-3 text-sm">
            Your position: <strong>#{mine.rank}</strong> with <strong>{mine.score}%</strong> in {formatDuration(mine.timeTakenSec)}
          </div>
        )}

        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-20">Rank</th>
                  <th>Name</th>
                  <th className="text-right">Score</th>
                  <th className="text-right">Correct</th>
                  <th className="text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id.toString()} className={r.userId === user.id ? "bg-primary/10 font-semibold" : ""}>
                    <td>
                      <span className={`badge ${PODIUM[r.rank] ?? "badge-ghost"} font-bold whitespace-nowrap`}>
                        {MEDALS[r.rank] ?? ""} #{r.rank}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={r.userName} image={photos.get(r.userId)} size="w-8" />
                        <span>
                          {r.userName}
                          {r.userId === user.id && <span className="badge badge-primary badge-sm ml-2">You</span>}
                        </span>
                      </div>
                    </td>
                    <td className="text-right font-mono">{r.score}%</td>
                    <td className="text-right font-mono opacity-70">
                      {r.correctCount}/{r.total}
                    </td>
                    <td className="text-right font-mono">{formatDuration(r.timeTakenSec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-12 text-center opacity-60">No one has finished this quiz yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}
