import { notFound, redirect } from "next/navigation";
import QuizRunner from "@/components/student/QuizRunner";
import { finalizeAttempt, GRACE_MS, runnerQuestions } from "@/lib/attempts";
import { collections, toObjectId } from "@/lib/db";
import { ROLES } from "@/lib/rules";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Taking Quiz" };

export default async function AttemptPage({ params }) {
  const { id } = await params;
  const user = await requireRole(ROLES.STUDENT);
  const _id = toObjectId(id);
  const attempt = _id && (await collections.attempts().findOne({ _id, userId: user.id }));
  if (!attempt) notFound();
  if (attempt.status === "submitted") redirect(`/student/results/${id}`);

  const quiz = await collections.quizzes().findOne({ _id: attempt.quizId });
  if (!quiz) notFound();

  // Time ran out while the student was away: grade the autosaved answers and show the result.
  if (Date.now() > attempt.deadline.getTime() + GRACE_MS) {
    await finalizeAttempt(attempt, quiz, { submittedAt: attempt.deadline, auto: true });
    redirect(`/student/results/${id}`);
  }

  return (
    <QuizRunner
      attemptId={id}
      title={quiz.title}
      questions={runnerQuestions(attempt, quiz)}
      savedAnswers={attempt.answers ?? {}}
      deadline={attempt.deadline.getTime()}
      serverNow={Date.now()}
    />
  );
}
