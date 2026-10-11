import { NextResponse } from "next/server";
import { collections } from "@/lib/db";
import { userWithRole } from "@/lib/session";

export const dynamic = "force-dynamic";

/** The logged-in user's 20 latest notifications + unread count. */
export async function GET() {
  const user = await userWithRole();
  if (!user) return NextResponse.json({ unread: 0, items: [] }, { status: 401 });

  const [unread, items] = await Promise.all([
    collections.notifications().countDocuments({ userId: user.id, read: false }),
    collections.notifications().find({ userId: user.id }).sort({ createdAt: -1 }).limit(20).toArray(),
  ]);

  return NextResponse.json(
    {
      unread,
      items: items.map((n) => ({
        id: n._id.toString(),
        message: n.message,
        link: n.link,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Mark all of the user's notifications as read. */
export async function POST() {
  const user = await userWithRole();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  await collections.notifications().updateMany({ userId: user.id, read: false }, { $set: { read: true } });
  return NextResponse.json({ ok: true });
}
