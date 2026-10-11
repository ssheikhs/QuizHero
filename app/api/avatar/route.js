import { headers } from "next/headers";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { collections } from "@/lib/db";
import { userWithRole } from "@/lib/session";

export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024; // same 2 MB limit as the original upload_photo.php
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const SIZE = 256; // stored as a 256×256 WebP (~10–20 KB), small enough to keep in MongoDB

const fail = (error, status = 400) => NextResponse.json({ ok: false, error }, { status });

/** Upload a new profile photo: validate → decode & resize with sharp → store in MongoDB. */
export async function POST(request) {
  const user = await userWithRole();
  if (!user) return fail("Please log in again.", 401);

  // Reject oversized bodies before reading them.
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BYTES + 64 * 1024) return fail("Photo must be 2 MB or smaller.", 413);

  let file;
  try {
    file = (await request.formData()).get("photo");
  } catch {
    return fail("Upload a photo file.");
  }
  if (!file || typeof file === "string") return fail("Upload a photo file.");
  if (file.size > MAX_BYTES) return fail("Photo must be 2 MB or smaller.", 413);
  if (!ALLOWED_TYPES.has(file.type)) return fail("Use a JPG, PNG, GIF or WebP image.", 415);

  let data;
  try {
    // Decoding proves it really is an image (a renamed .exe or HTML file fails here),
    // and re-encoding strips metadata (GPS location etc.) and any embedded payload.
    data = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000, animated: false })
      .rotate() // respect phone camera orientation
      .resize(SIZE, SIZE, { fit: "cover", position: "attention" })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return fail("That file isn't a valid image.", 415);
  }

  const version = Date.now();
  await collections
    .avatars()
    .updateOne({ _id: user.id }, { $set: { data, contentType: "image/webp", size: data.length, updatedAt: new Date(version) } }, { upsert: true });

  const image = `/api/avatar/${user.id}?v=${version}`; // new URL each time → browsers never show a stale photo
  await auth.api.updateUser({ headers: await headers(), body: { image } });
  return NextResponse.json({ ok: true, image });
}

/** Remove the profile photo (back to initials). */
export async function DELETE() {
  const user = await userWithRole();
  if (!user) return fail("Please log in again.", 401);
  await collections.avatars().deleteOne({ _id: user.id });
  await auth.api.updateUser({ headers: await headers(), body: { image: null } });
  return NextResponse.json({ ok: true });
}
