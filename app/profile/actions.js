"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { collections } from "@/lib/db";
import { NAME_MAX } from "@/lib/rules";
import { userWithRole } from "@/lib/session";

/** Change the display name everywhere it's shown (account, quizzes owned, leaderboard rows). */
export async function updateName(name) {
  const user = await userWithRole();
  if (!user) return { ok: false, error: "Please log in again." };
  if (typeof name !== "string" || !name.trim() || name.trim().length > NAME_MAX) {
    return { ok: false, error: `Name is required (max ${NAME_MAX} characters).` };
  }
  const clean = name.trim();

  await auth.api.updateUser({ headers: await headers(), body: { name: clean } });
  await Promise.all([
    collections.quizzes().updateMany({ ownerId: user.id }, { $set: { ownerName: clean } }),
    collections.attempts().updateMany({ userId: user.id }, { $set: { userName: clean } }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true };
}
