import Link from "next/link";
import MyQuizzesTable from "@/components/quiz/MyQuizzesTable";
import { collections } from "@/lib/db";
import { ROLES } from "@/lib/rules";
import { requireRole } from "@/lib/session";

export const metadata = { title: "My Quizzes" };

export default async function MyQuizzesPage() {
  const user = await requireRole(ROLES.INSTRUCTOR);

  const quizzes = await collections
    .quizzes()
    .aggregate([
      { $match: { ownerId: user.id } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "attempts",
          let: { quizId: "$_id" },
          pipeline: [{ $match: { $expr: { $eq: ["$quizId", "$$quizId"] }, status: "submitted" } }, { $count: "n" }],
          as: "submitted",
        },
      },
      {
        $project: {
          title: 1,
          categoryName: 1,
          timeLimitSec: 1,
          published: 1,
          accessCode: 1,
          questionsPerStudent: 1,
          questionCount: { $size: "$questions" },
          participants: { $ifNull: [{ $first: "$submitted.n" }, 0] },
        },
      },
    ])
    .toArray();

  const rows = quizzes.map((q) => ({
    id: q._id.toString(),
    title: q.title,
    category: q.categoryName,
    minutes: Math.round(q.timeLimitSec / 60),
    published: q.published,
    accessCode: q.accessCode ?? null,
    questionCount: q.questionCount,
    perStudent: q.questionsPerStudent ?? null,
    participants: q.participants,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">My Quizzes</h1>
          <p className="mt-1 opacity-70">Manage the quizzes you&apos;ve created.</p>
        </div>
        <Link href="/instructor/quizzes/new" className="btn btn-primary">
          + New Quiz
        </Link>
      </div>
      <MyQuizzesTable quizzes={rows} />
    </div>
  );
}
