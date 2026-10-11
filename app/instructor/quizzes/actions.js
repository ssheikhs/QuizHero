"use server";

import { revalidatePath } from "next/cache";
import { collections, toObjectId } from "@/lib/db";
import { fieldErrors, quizSchema } from "@/lib/quiz-schema";
import { publishWithCode, withQuestionIds } from "@/lib/quizzes";
import { ROLES } from "@/lib/rules";
import { userWithRole } from "@/lib/session";

// Every action re-checks the role and quiz ownership on the server —
// a student (or anyone calling the action directly) gets an error, never data.

const NOT_ALLOWED = { ok: false, error: "Only instructors can do this. Please log in again." };
const NOT_FOUND = { ok: false, error: "Quiz not found, or you don't own it." };

function refresh(quizId) {
  revalidatePath("/instructor", "layout");
  revalidatePath("/browse");
  if (quizId) revalidatePath(`/leaderboard/${quizId}`);
}

/** Validate builder input and turn it into the stored shape. */
async function toQuizFields(input) {
  const parsed = quizSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { ok: false, error: "Please fix the highlighted fields.", fields: fieldErrors(parsed.error) } };
  }
  const data = parsed.data;
  const category = await collections.categories().findOne({ _id: toObjectId(data.categoryId) });
  if (!category) return { error: { ok: false, error: "Pick a valid category.", fields: { categoryId: "Pick a category." } } };

  return {
    fields: {
      title: data.title,
      timeLimitSec: data.timeLimitMin * 60,
      categoryId: category._id,
      categoryName: category.name,
      shuffle: data.shuffle,
      shuffleOptions: data.shuffleOptions,
      questionsPerStudent: data.questionsPerStudent,
      questions: withQuestionIds(data.questions),
    },
  };
}

export async function createQuiz(input, { publish = false } = {}) {
  const user = await userWithRole(ROLES.INSTRUCTOR);
  if (!user) return NOT_ALLOWED;

  const { fields, error } = await toQuizFields(input);
  if (error) return error;

  const now = new Date();
  const { insertedId } = await collections.quizzes().insertOne({
    ...fields,
    ownerId: user.id,
    ownerName: user.name,
    published: false,
    accessCode: null,
    createdAt: now,
    updatedAt: now,
  });

  const accessCode = publish ? await publishWithCode(insertedId, user.id) : null;
  refresh();
  return { ok: true, id: insertedId.toString(), accessCode };
}

export async function updateQuiz(quizId, input, { publish = false } = {}) {
  const user = await userWithRole(ROLES.INSTRUCTOR);
  if (!user) return NOT_ALLOWED;
  const _id = toObjectId(quizId);
  if (!_id) return NOT_FOUND;

  const { fields, error } = await toQuizFields(input);
  if (error) return error;

  const result = await collections.quizzes().updateOne(
    { _id, ownerId: user.id },
    { $set: { ...fields, ownerName: user.name, updatedAt: new Date() } },
  );
  if (!result.matchedCount) return NOT_FOUND;

  const accessCode = publish ? await publishWithCode(_id, user.id) : null;
  refresh(quizId);
  return { ok: true, id: quizId, accessCode };
}

export async function publishQuiz(quizId) {
  const user = await userWithRole(ROLES.INSTRUCTOR);
  if (!user) return NOT_ALLOWED;
  const _id = toObjectId(quizId);
  if (!_id) return NOT_FOUND;

  const quiz = await collections.quizzes().findOne({ _id, ownerId: user.id }, { projection: { questions: 1 } });
  if (!quiz) return NOT_FOUND;
  if (!quiz.questions?.length) return { ok: false, error: "Add at least one question before publishing." };

  const accessCode = await publishWithCode(_id, user.id);
  refresh(quizId);
  return { ok: true, accessCode };
}

export async function unpublishQuiz(quizId) {
  const user = await userWithRole(ROLES.INSTRUCTOR);
  if (!user) return NOT_ALLOWED;
  const _id = toObjectId(quizId);
  if (!_id) return NOT_FOUND;

  // The access code is kept, so publishing again gives students the same code.
  const result = await collections.quizzes().updateOne(
    { _id, ownerId: user.id },
    { $set: { published: false, updatedAt: new Date() } },
  );
  if (!result.matchedCount) return NOT_FOUND;
  refresh(quizId);
  return { ok: true };
}

export async function deleteQuiz(quizId) {
  const user = await userWithRole(ROLES.INSTRUCTOR);
  if (!user) return NOT_ALLOWED;
  const _id = toObjectId(quizId);
  if (!_id) return NOT_FOUND;

  const result = await collections.quizzes().deleteOne({ _id, ownerId: user.id });
  if (!result.deletedCount) return NOT_FOUND;
  // Remove its attempts too (the old app deleted questions + leaderboard rows).
  await collections.attempts().deleteMany({ quizId: _id });
  refresh(quizId);
  return { ok: true };
}
