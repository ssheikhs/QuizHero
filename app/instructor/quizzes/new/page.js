import QuizBuilder from "@/components/quiz/QuizBuilder";
import { getCategories } from "@/lib/quizzes";

export const metadata = { title: "Create Quiz" };

export default async function NewQuizPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Create a new quiz</h1>
      <p className="mt-1 mb-6 opacity-70">Add questions by hand or start from a ready-made set, then save as a draft or publish.</p>
      {categories.length ? (
        <QuizBuilder categories={categories} />
      ) : (
        <div className="alert alert-warning">No categories found. Run <code>npm run seed</code> first.</div>
      )}
    </div>
  );
}
