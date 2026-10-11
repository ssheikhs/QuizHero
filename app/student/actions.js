"use server";

import { redirect } from "next/navigation";
import { buildAttempt, finalizeAttempt, GRACE_MS, sanitizeAnswers } from "@/lib/attempts";
import { collections, indexesOnce, toObjectId } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { ACCESS_CODE_PATTERN } from "@/lib/quizzes";
import { ROLES } from "@/lib/rules";
import { userWithRole } from "@/lib/session";

const NOT_ALLOWED = { ok: false, error: "Only students can take quizzes. Please log in with a student account." };

/** The student's own attempt + its quiz, or nulls. Another student's attempt id finds nothing. */
async function loadOwnAttempt(attemptId, userId) {
  const _id = toObjectId(attemptId);
  if (!_id) return {};
  const attempt = await collections.attempts().findOne({ _id, userId });
  if (!attempt) return {};
  const quiz = await collections.quizzes().findOne({ _id: attempt.quizId });
  return { attempt, quiz };
}

/** Join form (useActionState): validates the code, then resumes, shows the result, or starts a new attempt. */
export async function joinQuiz(_prev, formData) {
  const user = await userWithRole(ROLES.STUDENT);
  if (!user) return NOT_ALLOWED;

  const raw = formData.get("code");
  const code = typeof raw === "string" ? raw.replace(/\s+/g, "").toUpperCase() : "";
  if (!ACCESS_CODE_PATTERN.test(code)) return { ok: false, error: "Access codes are 8 letters/numbers, e.g. F65MNCCN.", code };

  const quiz = await collections.quizzes().findOne({ accessCode: code, published: true });
  if (!quiz) return { ok: false, error: "No published quiz uses that code. Check it with your instructor.", code };

  // One attempt per student per quiz: continue it or show its result.
  const existing = await collections.attempts().findOne({ quizId: quiz._id, userId: user.id }, { projection: { status: 1 } });
  if (existing) redirect(existing.status === "submitted" ? `/student/results/${existing._id}` : `/student/attempt/${existing._id}`);

  if (!quiz.questions?.length) return { ok: false, error: "This quiz has no questions yet.", code };

  await indexesOnce();
  let attemptId;
  try {
    ({ insertedId: attemptId } = await collections.attempts().insertOne(buildAttempt(quiz, user)));
  } catch (error) {
    if (error?.code !== 11000) throw error;
    // Double-click / two tabs: the unique index kept it to one attempt — use that one.
    const other = await collections.attempts().findOne({ quizId: quiz._id, userId: user.id }, { projection: { _id: 1 } });
    redirect(`/student/attempt/${other._id}`);
  }
  await notify(user.id, `You started quiz "${quiz.title}".`, `/student/attempt/${attemptId}`);
  redirect(`/student/attempt/${attemptId}`);
}

/** Autosave. Only accepted while the attempt is open (plus a short grace period). */
export async function saveAnswers(attemptId, answers) {
  const user = await userWithRole(ROLES.STUDENT);
  if (!user) return NOT_ALLOWED;
  const { attempt, quiz } = await loadOwnAttempt(attemptId, user.id);
  if (!attempt || !quiz) return { ok: false, error: "Attempt not found." };
  if (attempt.status !== "in_progress") return { ok: false, error: "This quiz was already submitted.", submitted: true };
  if (Date.now() > attempt.deadline.getTime() + GRACE_MS) return { ok: false, error: "Time is up.", expired: true };

  const clean = sanitizeAnswers(answers, attempt, quiz);
  await collections
    .attempts()
    .updateOne({ _id: attempt._id, status: "in_progress" }, { $set: { answers: clean, lastSavedAt: new Date() } });
  return { ok: true, savedAt: Date.now() };
}

/** Submit (button or timer). Grades on the server and returns where to go next. */
export async function submitAttempt(attemptId, answers, { auto = false } = {}) {
  const user = await userWithRole(ROLES.STUDENT);
  if (!user) return NOT_ALLOWED;
  const { attempt, quiz } = await loadOwnAttempt(attemptId, user.id);
  if (!attempt || !quiz) return { ok: false, error: "Attempt not found." };

  const resultUrl = `/student/results/${attempt._id}`;
  if (attempt.status === "submitted") return { ok: true, url: resultUrl };

  // Answers sent after the grace period are ignored; the last autosaved answers count instead.
  const inTime = Date.now() <= attempt.deadline.getTime() + GRACE_MS;
  const finalAnswers = inTime ? sanitizeAnswers(answers, attempt, quiz) : (attempt.answers ?? {});
  await finalizeAttempt(attempt, quiz, {
    answers: finalAnswers,
    submittedAt: inTime ? new Date() : attempt.deadline,
    auto: auto || !inTime,
  });
  return { ok: true, url: resultUrl };
}
