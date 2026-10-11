import { z } from "zod";

// Quiz rules shared by the builder (browser) and the server actions.
// Every value that reaches MongoDB goes through these schemas first, so only plain
// strings / numbers / booleans of the expected shape are ever stored or queried.

export const QUESTION_TYPES = ["MCQ", "TrueFalse", "FillBlank"];
export const TYPE_LABELS = { MCQ: "Multiple Choice", TrueFalse: "True / False", FillBlank: "Fill in the Blank" };
export const LIMITS = { title: 120, text: 500, option: 200, answer: 200, minOptions: 2, maxOptions: 6, maxQuestions: 100, maxMinutes: 180 };

const objectIdString = z.string().regex(/^[a-f0-9]{24}$/i, "Pick a category.");
const questionId = z.string().regex(/^[a-z0-9]{6,32}$/i).optional();
const questionText = z.string().trim().min(1, "Question text is required.").max(LIMITS.text, `Max ${LIMITS.text} characters.`);

const mcq = z
  .object({
    id: questionId,
    type: z.literal("MCQ"),
    text: questionText,
    options: z
      .array(z.string().trim().min(1, "Options can't be empty.").max(LIMITS.option))
      .min(LIMITS.minOptions, `Add at least ${LIMITS.minOptions} options.`)
      .max(LIMITS.maxOptions, `Max ${LIMITS.maxOptions} options.`),
    correct: z.number().int().min(0),
  })
  .refine((q) => q.correct < q.options.length, { message: "Pick the correct option.", path: ["correct"] })
  .refine((q) => q.options.some((o) => !o) || new Set(q.options.map((o) => o.toLowerCase())).size === q.options.length, {
    message: "Options must be different from each other.",
    path: ["options"],
  });

const trueFalse = z.object({
  id: questionId,
  type: z.literal("TrueFalse"),
  text: questionText,
  correct: z.enum(["True", "False"], { message: "Pick True or False." }),
});

const fillBlank = z.object({
  id: questionId,
  type: z.literal("FillBlank"),
  text: questionText,
  correct: z.string().trim().min(1, "Enter the correct answer.").max(LIMITS.answer),
});

export const questionSchema = z.discriminatedUnion("type", [mcq, trueFalse, fillBlank]);

export const quizSchema = z
  .object({
  title: z.string().trim().min(1, "Quiz title is required.").max(LIMITS.title, `Max ${LIMITS.title} characters.`),
  timeLimitMin: z
    .number({ message: "Enter a time limit." })
    .int("Use whole minutes.")
    .min(1, "Time limit must be at least 1 minute.")
    .max(LIMITS.maxMinutes, `Max ${LIMITS.maxMinutes} minutes.`),
  categoryId: objectIdString,
  shuffle: z.boolean(),
  shuffleOptions: z.boolean(),
  // null = every student gets every question; a number = each student gets that many, picked at random.
  questionsPerStudent: z
    .number({ message: "Enter a whole number or leave it empty." })
    .int("Use a whole number.")
    .min(1, "At least 1 question per student.")
    .nullable(),
  questions: z
    .array(questionSchema)
    .min(1, "Add at least one question.")
    .max(LIMITS.maxQuestions, `Max ${LIMITS.maxQuestions} questions.`),
  })
  .refine(
    (quiz) =>
      typeof quiz.questionsPerStudent !== "number" || !Array.isArray(quiz.questions) || quiz.questionsPerStudent <= quiz.questions.length,
    {
      message: "Can't be more than the number of questions in the quiz.",
      path: ["questionsPerStudent"],
      when: () => true, // check even while other fields still have errors
    },
  );

/** Turn zod issues into { "questions.0.text": "message", ... } for showing next to fields. */
export function fieldErrors(error) {
  const out = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    out[key] ??= issue.message;
  }
  return out;
}
