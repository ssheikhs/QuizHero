import Link from "next/link";
import { collections } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Leaderboards" };

export default async function LeaderboardIndex() {
  await requireUser("/leaderboard");

  const quizzes = await collections
    .quizzes()
    .aggregate([
      { $match: { published: true } },
      {
        $lookup: {
          from: "attempts",
          let: { quizId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$quizId", "$$quizId"] }, status: "submitted" } },
            { $sort: { score: -1, timeTakenSec: 1, submittedAt: 1 } },
            { $group: { _id: null, n: { $sum: 1 }, top: { $first: { name: "$userName", score: "$score" } } } },
          ],
          as: "stats",
        },
      },
      { $project: { title: 1, categoryName: 1, ownerName: 1, publishedAt: 1, stats: { $first: "$stats" } } },
      { $sort: { "stats.n": -1, publishedAt: -1 } },
    ])
    .toArray();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">🏆 Leaderboards</h1>
      <p className="mt-1 mb-6 opacity-70">Pick a quiz to see its ranking — highest score first, then fastest time.</p>

      {quizzes.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {quizzes.map((q) => (
            <li key={q._id.toString()}>
              <Link
                href={`/leaderboard/${q._id}`}
                className="card border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="card-body gap-1 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-bold">{q.title}</h2>
                    <span className="badge badge-ghost shrink-0">{q.stats?.n ?? 0} participants</span>
                  </div>
                  <p className="text-sm opacity-60">
                    {q.categoryName} · by {q.ownerName}
                  </p>
                  <p className="mt-1 text-sm">
                    {q.stats?.top ? (
                      <>
                        🥇 <strong>{q.stats.top.name}</strong> — {q.stats.top.score}%
                      </>
                    ) : (
                      <span className="opacity-50">No submissions yet</span>
                    )}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="opacity-60">No published quizzes yet.</p>
      )}
    </div>
  );
}
