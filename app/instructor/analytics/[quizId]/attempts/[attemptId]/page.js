import Link from "next/link";
import { notFound } from "next/navigation";
import AnswerBreakdown from "@/components/AnswerBreakdown";
import LocalTime from "@/components/LocalTime";
import { collections, toObjectId } from "@/lib/db";
import { formatDuration } from "@/lib/format";
import { ROLES } from "@/lib/rules";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Student Answers" };

export default async function AttemptReviewPage({ params }) {
  const { quizId, attemptId } = await params;
  const user = await requireRole(ROLES.INSTRUCTOR);
  const _id = toObjectId(attemptId);
  const quizObjectId = toObjectId(quizId);
  // ownerId on the attempt: only the instructor who owns the quiz can open it.
  const attempt = _id && quizObjectId && (await collections.attempts().findOne({ _id, quizId: quizObjectId, ownerId: user.id, status: "submitted" }));
  if (!attempt) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href={`/instructor/analytics/${quizId}`} className="btn btn-ghost btn-sm mb-4">
        ← Back to quiz analytics
      </Link>
      <div className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <p className="text-sm opacity-60">{attempt.quizTitle}</p>
          <h1 className="text-2xl font-extrabold">{attempt.userName}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="badge badge-primary badge-lg">{attempt.score}%</span>
            <span className="badge badge-ghost badge-lg">
              {attempt.correctCount}/{attempt.total} correct
            </span>
            <span className="badge badge-ghost badge-lg">⏱ {formatDuration(attempt.timeTakenSec)}</span>
            {attempt.autoSubmitted && <span className="badge badge-warning badge-lg">⏰ auto-submitted</span>}
          </div>
          <p className="mt-2 text-sm opacity-60">
            Submitted <LocalTime iso={attempt.submittedAt.toISOString()} />
          </p>
        </div>
      </div>
      <h2 className="mt-8 mb-4 text-xl font-bold">Answers</h2>
      <AnswerBreakdown results={attempt.results} who="Student's" />
    </div>
  );
}
