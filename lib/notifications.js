import { collections } from "./db";

/** Store a notification for one user. Never throws — a failed notification must not break grading. */
export async function notify(userId, message, link = null) {
  try {
    await collections.notifications().insertOne({
      userId: String(userId),
      message: String(message).slice(0, 300),
      link,
      read: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[notify] failed:", error?.message);
  }
}
