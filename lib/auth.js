import { timingSafeEqual } from "node:crypto";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { client, db, env } from "./db";
import { NAME_MAX, PASSWORD_HINT, PASSWORD_RULE, ROLES } from "./rules";

/** Constant-time check of the instructor invite code from .env.local. */
function isValidInviteCode(code) {
  const expected = env("INSTRUCTOR_INVITE_CODE");
  if (!expected || typeof code !== "string" || !code.trim()) return false;
  const a = Buffer.from(code.trim());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Name changes follow the sign-up rules; the photo can only be the user's own avatar served from MongoDB. */
async function checkProfileUpdate(ctx) {
  const { name, image } = ctx.body ?? {};
  if (name !== undefined && (typeof name !== "string" || !name.trim() || name.trim().length > NAME_MAX)) {
    throw new APIError("BAD_REQUEST", { message: `Name is required (max ${NAME_MAX} characters).` });
  }
  if (image !== undefined && image !== null) {
    const session = await getSessionFromCtx(ctx);
    const prefix = session ? `/api/avatar/${session.user.id}?v=` : null;
    const isOwnAvatar = prefix && typeof image === "string" && image.startsWith(prefix) && /^\d+$/.test(image.slice(prefix.length));
    if (!isOwnAvatar) {
      throw new APIError("BAD_REQUEST", { message: "Upload a photo on the profile page instead." });
    }
  }
}

/** Return a clean origin ("https://example.com") or undefined if the value isn't a valid URL. */
function toOrigin(value) {
  if (!value) return undefined;
  try {
    const url = new URL(value.trim().startsWith("http") ? value.trim() : `https://${value.trim()}`);
    return url.origin;
  } catch {
    return undefined;
  }
}

const productionOrigin = toOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);

// Prefer BETTER_AUTH_URL, fall back to Vercel's production domain, otherwise let BetterAuth use the request origin.
const baseURL = toOrigin(process.env.BETTER_AUTH_URL) ?? productionOrigin;

const trustedOrigins = [
  baseURL,
  productionOrigin,
  toOrigin(process.env.VERCEL_URL),
  toOrigin(process.env.VERCEL_BRANCH_URL),
].filter(Boolean);

export const auth = betterAuth({
  appName: "QuizHero",
  ...(baseURL ? { baseURL } : {}),
  secret: env("BETTER_AUTH_SECRET"),
  database: mongodbAdapter(db, { client }),
  emailAndPassword: {
    enabled: true, // passwords are hashed by BetterAuth (scrypt), never stored as plain text
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      // input:false → the browser can never choose its own role.
      role: { type: "string", required: false, defaultValue: ROLES.STUDENT, input: false },
    },
  },
  trustedOrigins,
  hooks: {
    // Server-side checks for sign up, so the rules hold even if someone calls the API directly.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/update-user") return checkProfileUpdate(ctx);
      if (ctx.path === "/change-password") {
        if (typeof ctx.body?.newPassword !== "string" || !PASSWORD_RULE.test(ctx.body.newPassword)) {
          throw new APIError("BAD_REQUEST", { message: PASSWORD_HINT });
        }
        return;
      }
      if (ctx.path !== "/sign-up/email") return;
      const { name, password, instructorCode } = ctx.body ?? {};
      if (typeof name !== "string" || !name.trim() || name.trim().length > NAME_MAX) {
        throw new APIError("BAD_REQUEST", { message: `Name is required (max ${NAME_MAX} characters).` });
      }
      if (typeof password !== "string" || !PASSWORD_RULE.test(password)) {
        throw new APIError("BAD_REQUEST", { message: PASSWORD_HINT });
      }
      if (instructorCode && !isValidInviteCode(instructorCode)) {
        throw new APIError("BAD_REQUEST", { message: "Invalid instructor invite code." });
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        // The role is decided here, on the server, from the invite code only.
        before: async (user, ctx) => {
          const role = isValidInviteCode(ctx?.body?.instructorCode) ? ROLES.INSTRUCTOR : ROLES.STUDENT;
          return { data: { ...user, name: user.name.trim(), role } };
        },
      },
    },
  },
  plugins: [nextCookies()], // keep last
});
