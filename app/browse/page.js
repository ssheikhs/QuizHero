import Link from "next/link";
import { collections, toObjectId } from "@/lib/db";
import { getCategories } from "@/lib/quizzes";
import { ROLES } from "@/lib/rules";
import { getSession } from "@/lib/session";

export const metadata = { title: "Browse Quizzes" };

const SORTS = {
  newest: { label: "Newest first", sort: { publishedAt: -1, _id: -1 } },
  oldest: { label: "Oldest first", sort: { publishedAt: 1, _id: 1 } },
  popular: { label: "Most popular", sort: { participants: -1, publishedAt: -1 } },
};

/** Escape regex special characters so a search is always matched as plain text. */
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default async function BrowsePage({ searchParams }) {
  const params = await searchParams;
  // Only accept plain strings of the expected shape from the URL.
  const categoryId = toObjectId(typeof params.category === "string" ? params.category : "");
  const search = typeof params.search === "string" ? params.search.trim().slice(0, 60) : "";
  const sortKey = typeof params.sort === "string" && SORTS[params.sort] ? params.sort : "newest";

  const match = { published: true };
  if (categoryId) match.categoryId = categoryId;
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: "i" };
    match.$or = [{ title: pattern }, { ownerName: pattern }];
  }

  const [categories, session, quizzes] = await Promise.all([
    getCategories(),
    getSession(),
    collections
      .quizzes()
      .aggregate([
        { $match: match },
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
            ownerName: 1,
            timeLimitSec: 1,
            publishedAt: 1,
            questionCount: { $ifNull: ["$questionsPerStudent", { $size: "$questions" }] },
            poolSize: { $size: "$questions" },
            participants: { $ifNull: [{ $first: "$submitted.n" }, 0] },
          },
        },
        { $sort: SORTS[sortKey].sort },
        { $limit: 60 },
      ])
      .toArray(),
  ]);

  const role = session?.user.role;

  return (
    <>
      <section className="brand-gradient px-4 py-12 text-center text-white">
        <h1 className="text-4xl font-extrabold">Browse Quizzes</h1>
        <p className="mt-2 opacity-90">Find published quizzes by searching titles or instructors.</p>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Plain GET form: filters live in the URL, so results can be bookmarked and shared. */}
        <form method="get" className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body grid gap-3 md:grid-cols-[1fr_2fr_1fr_auto] md:items-end">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Category</legend>
              <select name="category" defaultValue={categoryId?.toString() ?? ""} className="select w-full">
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Search</legend>
              <input type="search" name="search" defaultValue={search} maxLength={60} placeholder="Quiz title or instructor…" className="input w-full" />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Sort by</legend>
              <select name="sort" defaultValue={sortKey} className="select w-full">
                {Object.entries(SORTS).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </fieldset>
            <button type="submit" className="btn btn-primary">
              Apply filters
            </button>
          </div>
        </form>

        {quizzes.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <article key={quiz._id.toString()} className="card border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="card-body">
                  <span className="badge badge-secondary badge-soft">{quiz.categoryName}</span>
                  <h2 className="card-title mt-1">{quiz.title}</h2>
                  <p className="text-sm opacity-70">Instructor: {quiz.ownerName}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm opacity-80">
                    <span>
                      ❓ {quiz.questionCount} questions
                      {quiz.poolSize > quiz.questionCount && <span className="opacity-70"> (random from {quiz.poolSize})</span>}
                    </span>
                    <span>⏱️ {Math.round(quiz.timeLimitSec / 60)} min</span>
                    <span>👥 {quiz.participants} participants</span>
                  </div>
                  <div className="card-actions mt-3 justify-end">
                    <Link href={`/leaderboard/${quiz._id}`} className="btn btn-ghost btn-sm">
                      Leaderboard
                    </Link>
                    {role === ROLES.STUDENT && (
                      <Link href="/student/join" className="btn btn-primary btn-sm">
                        I have the code
                      </Link>
                    )}
                    {!session && (
                      <Link href="/login" className="btn btn-primary btn-sm">
                        Log in to take
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 card border border-base-300 bg-base-100">
            <div className="card-body items-center py-16 text-center">
              <p className="text-5xl">🔍</p>
              <h2 className="text-xl font-bold">No quizzes found</h2>
              <p className="opacity-70">Try a different category or search term.</p>
              {role === ROLES.INSTRUCTOR && (
                <Link href="/instructor/quizzes/new" className="btn btn-primary mt-4">
                  Create a new quiz
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
