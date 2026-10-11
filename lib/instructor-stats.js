import { finalizeExpiredAttempts } from "./attempts";
import { collections } from "./db";

/** Per-quiz numbers for one instructor's quizzes (newest quiz first). */
export async function getQuizStats(ownerId) {
  await finalizeExpiredAttempts({ ownerId });

  const [quizzes, grouped] = await Promise.all([
    collections
      .quizzes()
      .find({ ownerId }, { projection: { title: 1, published: 1, categoryName: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .toArray(),
    collections
      .attempts()
      .aggregate([
        { $match: { ownerId } },
        {
          $group: {
            _id: "$quizId",
            participants: { $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
            avgScore: { $avg: "$score" }, // $avg ignores in-progress attempts (no score yet)
            highest: { $max: "$score" },
            avgTime: { $avg: "$timeTakenSec" },
          },
        },
      ])
      .toArray(),
  ]);

  const byQuiz = new Map(grouped.map((g) => [g._id.toString(), g]));
  return quizzes.map((q) => {
    const g = byQuiz.get(q._id.toString());
    return {
      id: q._id.toString(),
      title: q.title,
      category: q.categoryName,
      published: q.published,
      participants: g?.participants ?? 0,
      inProgress: g?.inProgress ?? 0,
      avgScore: g?.avgScore == null ? null : Math.round(g.avgScore * 10) / 10,
      highest: g?.highest ?? null,
      avgTime: g?.avgTime == null ? null : Math.round(g.avgTime),
    };
  });
}

/** Same colour bands as the original analytics page (green ≥ 80, yellow ≥ 50, red below). */
export function scoreBand(score) {
  if (score == null) return { badge: "badge-ghost", bar: "progress", label: "No data" };
  if (score >= 80) return { badge: "badge-success", bar: "progress progress-success", label: "Strong" };
  if (score >= 50) return { badge: "badge-warning", bar: "progress progress-warning", label: "Fair" };
  return { badge: "badge-error", bar: "progress progress-error", label: "Weak" };
}
