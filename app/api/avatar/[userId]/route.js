import { collections } from "@/lib/db";

export const runtime = "nodejs";

/** Serve a profile photo stored in MongoDB. URLs carry ?v=<timestamp>, so they can be cached forever. */
export async function GET(_request, { params }) {
  const { userId } = await params;
  if (!/^[a-f0-9]{24}$/i.test(userId)) return new Response("Not found", { status: 404 });

  const avatar = await collections.avatars().findOne({ _id: userId });
  if (!avatar) return new Response("Not found", { status: 404 });

  const bytes = Buffer.from(avatar.data.buffer.subarray(0, avatar.data.length())); // BSON Binary → exact bytes
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/webp", // always re-encoded by us — never the uploader's claimed type
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
