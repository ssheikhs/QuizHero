import { randomInt } from "node:crypto";
import { collections } from "./db";
import { formatClock, optionLetter } from "./format";
import { notify } from "./notifications";

// Answers that arrive this long after the deadline are still accepted (slow networks, the final autosave).
export const GRACE_MS = 10_000;

/** Fisher–Yates shuffle with a cryptographic RNG (returns a new array). */
function shuffled(items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Build a new attempt for a student. The question selection, question order and MCQ option order
 * are decided here once and stored, so a resumed attempt shows exactly the same quiz.
 */
export function buildAttempt(quiz, user) {
  const allIds = quiz.questions.map((q) => q.id);
  const perStudent = quiz.questionsPerStudent && quiz.questionsPerStudent < allIds.length ? quiz.questionsPerStudent : null;

  let questionIds = perStudent ? shuffled(allIds).slice(0, perStudent) : allIds;
  if (perStudent && !quiz.shuffle) questionIds = allIds.filter((id) => questionIds.includes(id)); // random pick, original order
  else if (quiz.shuffle) questionIds = shuffled(questionIds);

  const optionOrder = {};
  for (const q of quiz.questions) {
    if (q.type === "MCQ" && questionIds.includes(q.id)) {
      const indexes = q.options.map((_, i) => i);
      optionOrder[q.id] = quiz.shuffleOptions === false ? indexes : shuffled(indexes);
    }
  }

  const now = new Date();
  return {
    quizId: quiz._id,
    quizTitle: quiz.title,
    ownerId: quiz.ownerId,
    userId: user.id,
    userName: user.name,
    status: "in_progress",
    startedAt: now,
    deadline: new Date(now.getTime() + quiz.timeLimitSec * 1000),
    timeLimitSec: quiz.timeLimitSec,
    questionIds,
    optionOrder,
    answers: {},
    lastSavedAt: now,
  };
}

/** Questions for the quiz page, in this attempt's order — WITHOUT correct answers. */
export function runnerQuestions(attempt, quiz) {
  const byId = new Map(quiz.questions.map((q) => [q.id, q]));
  return attempt.questionIds
    .map((id) => byId.get(id))
    .filter(Boolean) // a question the instructor deleted mid-attempt is skipped
    .map((q) => ({
      id: q.id,
      type: q.type,
      text: q.text,
      // MCQ options in this student's order; `value` is the original index, which says nothing about correctness.
      options:
        q.type === "MCQ"
          ? (attempt.optionOrder?.[q.id] ?? q.options.map((_, i) => i)).filter((i) => i < q.options.length).map((i) => ({ value: i, label: q.options[i] }))
          : undefined,
    }));
}

/**
 * Keep only well-formed answers to questions in this attempt.
 * MCQ → original option index, True/False → "True"/"False", Fill-in-the-Blank → text (max 200 chars).
 * Anything else (objects, operators, unknown ids) is dropped.
 */
export function sanitizeAnswers(raw, attempt, quiz) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const byId = new Map(quiz.questions.map((q) => [q.id, q]));
  const clean = {};
  for (const id of attempt.questionIds) {
    if (!Object.hasOwn(raw, id)) continue;
    const q = byId.get(id);
    const value = raw[id];
    if (!q) continue;
    if (q.type === "MCQ" && Number.isInteger(value) && value >= 0 && value < q.options.length) clean[id] = value;
    else if (q.type === "TrueFalse" && (value === "True" || value === "False")) clean[id] = value;
    else if (q.type === "FillBlank" && typeof value === "string" && value.trim()) clean[id] = value.slice(0, 200);
  }
  return clean;
}

// Same leniency as the original grader: ignore upper/lower case and extra spaces.
const normalize = (text) => String(text).trim().replace(/\s+/g, " ").toLowerCase();

/** Grade an attempt against the quiz and return the fields to store (including a per-question snapshot). */
export function grade(attempt, quiz, answers, submittedAt) {
  const byId = new Map(quiz.questions.map((q) => [q.id, q]));
  const results = [];

  for (const id of attempt.questionIds) {
    const q = byId.get(id);
    if (!q) continue;
    const given = answers[id];
    const answered = given !== undefined && given !== null && given !== "";

    if (q.type === "MCQ") {
      const order = (attempt.optionOrder?.[id] ?? q.options.map((_, i) => i)).filter((i) => i < q.options.length);
      const shown = order.map((i) => q.options[i]);
      const label = (originalIndex) => `${optionLetter(order.indexOf(originalIndex))}. ${q.options[originalIndex]}`;
      results.push({
        id,
        type: q.type,
        text: q.text,
        options: shown,
        given: answered ? label(given) : null,
        correctAnswer: label(q.correct),
        isCorrect: answered && given === q.correct,
      });
    } else {
      results.push({
        id,
        type: q.type,
        text: q.text,
        given: answered ? String(given) : null,
        correctAnswer: q.correct,
        isCorrect: answered && normalize(given) === normalize(q.correct),
      });
    }
  }

  const correctCount = results.filter((r) => r.isCorrect).length;
  const total = results.length;
  const elapsedSec = Math.max(0, Math.round((submittedAt - attempt.startedAt) / 1000));

  return {
    status: "submitted",
    answers,
    results,
    correctCount,
    total,
    score: total ? Math.round((correctCount / total) * 100) : 0,
    // Like the original: the saved time never exceeds the limit (so leaderboards stay fair)…
    timeTakenSec: Math.min(elapsedSec, attempt.timeLimitSec),
    // …but the real elapsed time decides whether it was late.
    elapsedSec,
    late: submittedAt.getTime() > attempt.deadline.getTime() + GRACE_MS,
    submittedAt,
  };
}

/**
 * Grade and close an in-progress attempt exactly once (safe if two requests race),
 * then send the notifications. Returns the stored attempt, or null if it was already submitted.
 */
export async function finalizeAttempt(attempt, quiz, { answers = attempt.answers ?? {}, submittedAt = new Date(), auto = false } = {}) {
  const fields = { ...grade(attempt, quiz, answers, submittedAt), autoSubmitted: auto };
  const updated = await collections
    .attempts()
    .findOneAndUpdate({ _id: attempt._id, status: "in_progress" }, { $set: fields }, { returnDocument: "after" });
  if (!updated) return null; // someone else finalized it first — don't notify twice

  const quizTitle = `"${quiz.title}"`;
  await Promise.all([
    notify(updated.userId, `You completed quiz ${quizTitle} with score ${updated.score}%.`, `/student/results/${updated._id}`),
    notify(quiz.ownerId, `${updated.userName} completed your quiz ${quizTitle} with score ${updated.score}%.`, `/instructor/analytics/${quiz._id}`),
    // Tell the instructor when time ran out (auto-submit) or the submission arrived late.
    (updated.late || auto) &&
      notify(
        quiz.ownerId,
        auto && !updated.late
          ? `${updated.userName}'s attempt at ${quizTitle} was auto-submitted when the time limit (${formatClock(attempt.timeLimitSec)}) ran out.`
          : `Late submission: ${updated.userName} submitted ${quizTitle} late (took ${formatClock(updated.elapsedSec)}, limit ${formatClock(attempt.timeLimitSec)}).`,
        `/instructor/analytics/${quiz._id}`,
      ),
  ]);
  return updated;
}

/**
 * Close attempts whose time ran out while the student was away (browser closed, offline…),
 * grading whatever answers were autosaved. Called before showing results, leaderboards and dashboards.
 */
export async function finalizeExpiredAttempts(filter = {}) {
  const expired = await collections
    .attempts()
    .find({ ...filter, status: "in_progress", deadline: { $lt: new Date(Date.now() - GRACE_MS) } })
    .limit(200)
    .toArray();
  if (!expired.length) return 0;

  const quizzes = await collections
    .quizzes()
    .find({ _id: { $in: expired.map((a) => a.quizId) } })
    .toArray();
  const byId = new Map(quizzes.map((q) => [q._id.toString(), q]));

  let count = 0;
  for (const attempt of expired) {
    const quiz = byId.get(attempt.quizId.toString());
    if (!quiz) continue;
    // The attempt ended at its deadline, not "now" — so it isn't counted as late.
    if (await finalizeAttempt(attempt, quiz, { submittedAt: attempt.deadline, auto: true })) count++;
  }
  return count;
}
