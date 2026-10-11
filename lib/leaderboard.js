import { finalizeExpiredAttempts } from "./attempts";
import { collections, toObjectId } from "./db";
import { ROLES } from "./rules";

/**
 * A quiz the viewer may see the leaderboard of: any published quiz, or the instructor's own drafts.
 * Returns null otherwise (the page shows 404).
 */
export async function findViewableQuiz(quizId, viewer) {
  const _id = toObjectId(quizId);
  if (!_id) return null;
  const quiz = await collections.quizzes().findOne({ _id }, { projection: { questions: 0 } });
  if (!quiz) return null;
  if (quiz.published) return quiz;
  return viewer?.role === ROLES.INSTRUCTOR && quiz.ownerId === viewer.id ? quiz : null;
}

/** Ranked rows: highest score first, then fastest time, then who finished first. */
export async function getLeaderboard(quizId, limit = 100) {
  await finalizeExpiredAttempts({ quizId });
  const rows = await collections
    .attempts()
    .find(
      { quizId, status: "submitted" },
      { projection: { userId: 1, userName: 1, score: 1, correctCount: 1, total: 1, timeTakenSec: 1, submittedAt: 1 } },
    )
    .sort({ score: -1, timeTakenSec: 1, submittedAt: 1 })
    .limit(limit)
    .toArray();
  return rows.map((row, i) => ({ ...row, rank: i + 1 }));
}
