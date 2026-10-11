import { notFound } from "next/navigation";
import DeleteQuizButton from "@/components/quiz/DeleteQuizButton";
import QuizBuilder from "@/components/quiz/QuizBuilder";
import { collections } from "@/lib/db";
import { findOwnedQuiz, getCategories, toBuilderQuiz } from "@/lib/quizzes";
import { ROLES } from "@/lib/rules";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Edit Quiz" };

export default async function EditQuizPage({ params }) {
  const { id } = await params;
  const user = await requireRole(ROLES.INSTRUCTOR);
  const quiz = await findOwnedQuiz(id, user.id);
  if (!quiz) notFound(); // also hides other instructors' quizzes

  const [categories, submissions] = await Promise.all([
    getCategories(),
    collections.attempts().countDocuments({ quizId: quiz._id, status: "submitted" }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Edit quiz</h1>
          <p className="mt-1 opacity-70">
            {quiz.published ? (
              <>
                Published · access code <span className="font-mono font-bold">{quiz.accessCode}</span>
              </>
            ) : (
              "Draft — not visible to students yet."
            )}
          </p>
        </div>
        <DeleteQuizButton quizId={id} title={quiz.title} redirectTo="/instructor/quizzes" />
      </div>

      {submissions > 0 && (
        <div className="alert alert-warning alert-soft mb-6">
          {submissions} student{submissions === 1 ? " has" : "s have"} already submitted this quiz. Their saved results won&apos;t change; edits apply to
          new attempts only.
        </div>
      )}

      <QuizBuilder categories={categories} initial={toBuilderQuiz(quiz)} />
    </div>
  );
}
