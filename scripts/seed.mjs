// Seed categories and demo accounts.  Run with:  npm run seed
// Safe to run more than once: existing categories and accounts are left alone.
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import { randomBytes, randomInt } from "node:crypto";
import { MongoClient } from "mongodb";
import { SAMPLE_GROUPS } from "../lib/sample-sets.mjs";

const env = (name) => process.env[name]?.trim() || undefined;

const uri = env("MONGODB_URI");
if (!uri) {
  console.error("MONGODB_URI is missing. Copy .env.example to .env.local and fill it in first.");
  process.exit(1);
}

const CATEGORIES = ["Math", "Science", "History", "General", "Web Programming", "HTML", "CSS", "JS", "C", "C++"];

// Demo accounts mirror the original database.sql (2 instructors, 3 students).
const DEMO_USERS = [
  { name: "ntn", email: "ntn@quizhero.test", role: "Instructor" },
  { name: "tba", email: "tba@quizhero.test", role: "Instructor" },
  { name: "sheikh", email: "sheikh@quizhero.test", role: "Student" },
  { name: "ohin", email: "ohin@quizhero.test", role: "Student" },
  { name: "salman", email: "salman@quizhero.test", role: "Student" },
];

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

// --- Demo quizzes: one per ready-made set (lib/sample-sets.mjs), shared between instructors "ntn" and "tba" ---
const DRAFT_TITLES = new Set(["Fill in the Blanks: Web Basics"]); // one draft, to show the Draft state
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const accessCode = () => Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");

async function seedDemoQuizzes() {
  const owners = await db.collection("user").find({ email: { $in: ["ntn@quizhero.test", "tba@quizhero.test"] } }).sort({ email: 1 }).toArray();
  if (!owners.length) return;
  // ntn first, then tba
  owners.sort((a, b) => (a.email.startsWith("ntn") ? -1 : b.email.startsWith("ntn") ? 1 : 0));

  const ownerIds = owners.map((o) => o._id.toString());
  const sets = [
    ...Object.values(SAMPLE_GROUPS).flatMap((group) => group.sets),
    // A big pool where every student gets a different random 10 (tests the random-pick feature).
    {
      title: "Web Dev Question Pool (10 random)",
      category: "Web Programming",
      questionsPerStudent: 10,
      questions: SAMPLE_GROUPS.mcq.sets.filter((s) => ["Web Programming", "HTML", "CSS", "JS"].includes(s.category)).flatMap((s) => s.questions),
    },
  ];
  let created = 0;
  for (const [index, set] of sets.entries()) {
    const owner = owners[index % owners.length];
    const ownerId = owner._id.toString();
    // Skip a set that either demo instructor already has (so re-running never duplicates).
    if (await db.collection("quizzes").findOne({ ownerId: { $in: ownerIds }, title: set.title })) continue;

    const category = await db.collection("categories").findOne({ name: set.category });
    const published = !DRAFT_TITLES.has(set.title);
    const now = new Date();
    await db.collection("quizzes").insertOne({
      title: set.title,
      timeLimitSec: Math.max(3, set.questionsPerStudent ?? set.questions.length) * 60,
      categoryId: category._id,
      categoryName: category.name,
      shuffle: true,
      shuffleOptions: true,
      questionsPerStudent: set.questionsPerStudent ?? null,
      questions: set.questions.map((q) => ({ id: randomBytes(6).toString("hex"), ...q })),
      ownerId,
      ownerName: owner.name,
      published,
      accessCode: published ? accessCode() : null,
      ...(published ? { publishedAt: now } : {}),
      createdAt: now,
      updatedAt: now,
    });
    created++;
  }
  console.log(created ? `✔ ${created} demo quizzes created (${sets.length} sets in total)` : "• demo quizzes already exist");
}

// --- Demo results: the 3 demo students have already taken most published quizzes (fills charts & leaderboards) ---
async function seedDemoResults() {
  const students = await db.collection("user").find({ email: { $in: DEMO_USERS.filter((u) => u.role === "Student").map((u) => u.email) } }).toArray();
  if (!students.length) return;
  if (await db.collection("attempts").countDocuments({ userId: { $in: students.map((s) => s._id.toString()) } })) {
    console.log("• demo results already exist");
    return;
  }
  const quizzes = await db.collection("quizzes").find({ published: true }).toArray();
  const skill = [0.85, 0.65, 0.45]; // how often each demo student answers correctly
  let created = 0;

  for (const [si, student] of students.entries()) {
    for (const [qi, quiz] of quizzes.entries()) {
      if ((qi + si) % 4 === 3) continue; // leave some quizzes untaken
      const pool = quiz.questions;
      const picked = quiz.questionsPerStudent ? [...pool].sort(() => Math.random() - 0.5).slice(0, quiz.questionsPerStudent) : pool;
      const results = picked.map((q) => {
        const right = Math.random() < skill[si % skill.length];
        if (q.type === "MCQ") {
          const given = right ? q.correct : (q.correct + 1 + randomInt(q.options.length - 1)) % q.options.length;
          const label = (i) => `${String.fromCharCode(65 + i)}. ${q.options[i]}`;
          return { id: q.id, type: q.type, text: q.text, options: q.options, given: label(given), correctAnswer: label(q.correct), isCorrect: right };
        }
        const wrong = q.type === "TrueFalse" ? (q.correct === "True" ? "False" : "True") : "not sure";
        return { id: q.id, type: q.type, text: q.text, given: right ? q.correct : wrong, correctAnswer: q.correct, isCorrect: right };
      });
      const correctCount = results.filter((r) => r.isCorrect).length;
      const timeTakenSec = Math.min(quiz.timeLimitSec, 40 + randomInt(Math.max(1, quiz.timeLimitSec - 40)));
      const submittedAt = new Date(Date.now() - randomInt(1, 14 * 24 * 3600) * 1000);
      await db.collection("attempts").insertOne({
        quizId: quiz._id,
        quizTitle: quiz.title,
        ownerId: quiz.ownerId,
        userId: student._id.toString(),
        userName: student.name,
        status: "submitted",
        startedAt: new Date(submittedAt.getTime() - timeTakenSec * 1000),
        deadline: new Date(submittedAt.getTime() - timeTakenSec * 1000 + quiz.timeLimitSec * 1000),
        timeLimitSec: quiz.timeLimitSec,
        questionIds: picked.map((q) => q.id),
        optionOrder: {},
        answers: {},
        results,
        correctCount,
        total: results.length,
        score: Math.round((correctCount / results.length) * 100),
        timeTakenSec,
        elapsedSec: timeTakenSec,
        late: false,
        autoSubmitted: false,
        submittedAt,
        lastSavedAt: submittedAt,
      });
      created++;
    }
  }
  console.log(`✔ ${created} demo results created for ${students.length} demo students`);
}

const client = new MongoClient(uri);
const db = client.db(env("MONGODB_DB") || "quizhero");

try {
  // --- Indexes (same as lib/db.js ensureIndexes) ---
  await Promise.all([
    db.collection("categories").createIndex({ name: 1 }, { unique: true }),
    db.collection("quizzes").createIndex(
      { accessCode: 1 },
      // Only real codes must be unique; drafts without a code (null) are ignored.
      { name: "accessCode_unique", unique: true, partialFilterExpression: { accessCode: { $type: "string" } } },
    ),
    db.collection("quizzes").createIndex({ ownerId: 1, createdAt: -1 }),
    db.collection("quizzes").createIndex({ published: 1, createdAt: -1 }),
    db.collection("attempts").createIndex({ quizId: 1, userId: 1 }, { unique: true }),
    db.collection("attempts").createIndex({ quizId: 1, status: 1, score: -1, timeTakenSec: 1 }),
    db.collection("attempts").createIndex({ userId: 1, submittedAt: -1 }),
    db.collection("notifications").createIndex({ userId: 1, createdAt: -1 }),
  ]);

  // --- Categories ---
  for (const name of CATEGORIES) {
    await db.collection("categories").updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
  }
  console.log(`✔ ${CATEGORIES.length} categories ready`);

  // --- Demo accounts (password comes from SEED_PASSWORD in .env.local, never from code) ---
  const password = env("SEED_PASSWORD");
  if (!password) {
    console.log("ℹ SEED_PASSWORD not set — skipping demo accounts.");
  } else if (!PASSWORD_RULE.test(password)) {
    console.log("⚠ SEED_PASSWORD must have 8+ chars, an uppercase letter, a number and a symbol — skipping demo accounts.");
  } else {
    // A minimal BetterAuth instance so passwords are hashed exactly like real sign-ups.
    const auth = betterAuth({
      secret: env("BETTER_AUTH_SECRET") || "seed-script-only-secret-not-used-for-sessions",
      database: mongodbAdapter(db, { client }),
      emailAndPassword: { enabled: true },
      user: { additionalFields: { role: { type: "string", required: false, defaultValue: "Student" } } },
    });

    for (const demo of DEMO_USERS) {
      const existing = await db.collection("user").findOne({ email: demo.email });
      if (existing) {
        console.log(`• ${demo.email} already exists`);
        continue;
      }
      await auth.api.signUpEmail({ body: { name: demo.name, email: demo.email, password } });
      await db.collection("user").updateOne({ email: demo.email }, { $set: { role: demo.role } });
      console.log(`✔ created ${demo.role.toLowerCase()} ${demo.email}`);
    }
    console.log("  Demo accounts use the SEED_PASSWORD from .env.local.");
    await seedDemoQuizzes();
    await seedDemoResults();
  }
} catch (error) {
  console.error("Seeding failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
