import JoinQuizForm from "@/components/student/JoinQuizForm";

export const metadata = { title: "Join a Quiz" };

export default async function JoinPage({ searchParams }) {
  const { code } = await searchParams;

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="card border border-base-300 bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="text-center text-3xl font-extrabold">🔑 Join a quiz</h1>
          <p className="mb-4 text-center opacity-70">Enter the 8-character access code your instructor shared.</p>
          <JoinQuizForm initialCode={typeof code === "string" ? code.slice(0, 12) : ""} />
          <ul className="mt-6 list-disc space-y-1 pl-5 text-sm opacity-70">
            <li>The timer starts as soon as you join and keeps running if you leave the page.</li>
            <li>Your answers are saved automatically — come back with the same code to resume.</li>
            <li>When time runs out the quiz is submitted automatically.</li>
            <li>You can take each quiz once.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
