import { MongoClient, ObjectId } from "mongodb";

// Read an env variable without stray spaces/new lines (easy to add by accident when pasting keys).
export const env = (name) => process.env[name]?.trim() || undefined;

const uri = env("MONGODB_URI");
if (!uri) {
  throw new Error("MONGODB_URI is missing. Copy .env.example to .env.local and fill it in.");
}

// One MongoDB client per server instance (reused across hot reloads in development).
const globalForMongo = globalThis;
export const client = globalForMongo._quizHeroMongo ?? new MongoClient(uri);
if (process.env.NODE_ENV !== "production") globalForMongo._quizHeroMongo = client;

export const db = client.db(env("MONGODB_DB") || "quizhero");

export const collections = {
  users: () => db.collection("user"), // owned by BetterAuth
  categories: () => db.collection("categories"),
  quizzes: () => db.collection("quizzes"),
  attempts: () => db.collection("attempts"),
  notifications: () => db.collection("notifications"),
  avatars: () => db.collection("avatars"),
};

/**
 * Parse a string into an ObjectId, or return null.
 * Only plain 24-char hex strings are accepted, so objects like { $ne: null } can never reach a query.
 */
export function toObjectId(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{24}$/i.test(value)) return null;
  return new ObjectId(value);
}

/** Create the indexes the app relies on (safe to call repeatedly). */
export async function ensureIndexes() {
  await Promise.all([
    collections.categories().createIndex({ name: 1 }, { unique: true }),
    collections.quizzes().createIndex(
      { accessCode: 1 },
      // Only real codes must be unique; drafts without a code (null) are ignored.
      { name: "accessCode_unique", unique: true, partialFilterExpression: { accessCode: { $type: "string" } } },
    ),
    collections.quizzes().createIndex({ ownerId: 1, createdAt: -1 }),
    collections.quizzes().createIndex({ published: 1, createdAt: -1 }),
    collections.attempts().createIndex({ quizId: 1, userId: 1 }, { unique: true }),
    collections.attempts().createIndex({ quizId: 1, status: 1, score: -1, timeTakenSec: 1 }),
    collections.attempts().createIndex({ userId: 1, submittedAt: -1 }),
    collections.notifications().createIndex({ userId: 1, createdAt: -1 }),
  ]);
}

// Make sure indexes exist once per server instance (the unique ones enforce app rules).
let indexesReady;
export function indexesOnce() {
  indexesReady ??= ensureIndexes().catch((error) => {
    indexesReady = undefined;
    console.error("[db] ensureIndexes failed:", error?.message);
  });
  return indexesReady;
}
