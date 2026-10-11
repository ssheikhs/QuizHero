import { randomBytes, randomInt } from "node:crypto";
import { collections, indexesOnce, toObjectId } from "./db";

// No 0/O or 1/I/L, so codes are easy to read out loud and type.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ACCESS_CODE_PATTERN = /^[A-Z0-9]{8}$/;

/** Cryptographically random 8-character access code. */
export function generateAccessCode() {
  let code = "";
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

export const newQuestionId = () => randomBytes(6).toString("hex");

/** All categories, sorted by name, as plain objects for client components. */
export async function getCategories() {
  const rows = await collections.categories().find({}).sort({ name: 1 }).toArray();
  return rows.map((c) => ({ id: c._id.toString(), name: c.name }));
}

/** Keep existing question ids (so in-progress attempts keep working) and give new questions one. */
export function withQuestionIds(questions) {
  const seen = new Set();
  return questions.map((q) => {
    let id = q.id && !seen.has(q.id) ? q.id : newQuestionId();
    while (seen.has(id)) id = newQuestionId();
    seen.add(id);
    return { ...q, id };
  });
}

/** A quiz owned by this instructor, or null. */
export async function findOwnedQuiz(quizId, ownerId) {
  const _id = toObjectId(quizId);
  if (!_id) return null;
  return collections.quizzes().findOne({ _id, ownerId });
}

/** Plain, serialisable version of a quiz for the builder (includes answers — instructor only). */
export function toBuilderQuiz(quiz) {
  return {
    id: quiz._id.toString(),
    title: quiz.title,
    timeLimitMin: Math.round(quiz.timeLimitSec / 60),
    categoryId: quiz.categoryId.toString(),
    shuffle: quiz.shuffle,
    shuffleOptions: quiz.shuffleOptions ?? true,
    questionsPerStudent: quiz.questionsPerStudent ?? null,
    published: quiz.published,
    accessCode: quiz.accessCode ?? null,
    questions: quiz.questions.map((q) => ({ ...q })),
  };
}

/**
 * Publish a quiz: reuse its code if it had one, otherwise create a unique one.
 * The unique index on accessCode guarantees no two quizzes share a code; on the
 * (very unlikely) clash we simply try a new code.
 */
export async function publishWithCode(quizId, ownerId) {
  await indexesOnce();
  const quiz = await collections.quizzes().findOne({ _id: quizId, ownerId }, { projection: { accessCode: 1 } });
  if (!quiz) return null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const accessCode = quiz.accessCode ?? generateAccessCode();
    try {
      await collections.quizzes().updateOne(
        { _id: quizId, ownerId },
        { $set: { published: true, accessCode, publishedAt: new Date(), updatedAt: new Date() } },
      );
      return accessCode;
    } catch (error) {
      if (error?.code !== 11000 || quiz.accessCode) throw error; // only retry on a duplicate new code
    }
  }
  throw new Error("Could not generate a unique access code. Please try again.");
}
