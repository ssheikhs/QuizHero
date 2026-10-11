"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { publishQuiz, unpublishQuiz } from "@/app/instructor/quizzes/actions";
import { callAction } from "@/lib/call-action";
import DeleteQuizButton from "./DeleteQuizButton";

export default function MyQuizzesTable({ quizzes }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  const visible = quizzes.filter((q) => q.title.toLowerCase().includes(search.trim().toLowerCase()));

  async function togglePublish(quiz) {
    setBusyId(quiz.id);
    const result = await callAction(quiz.published ? unpublishQuiz : publishQuiz, quiz.id);
    setBusyId(null);
    if (!result.ok) return toast.error(result.error);
    toast.success(quiz.published ? "Quiz unpublished" : `Published! Access code: ${result.accessCode}`);
    router.refresh();
  }

  async function copy(code) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied ${code}`);
    } catch {
      toast.error("Couldn't copy — select the code and copy it manually.");
    }
  }

  if (!quizzes.length) {
    return (
      <div className="card border border-base-300 bg-base-100">
        <div className="card-body items-center py-16 text-center">
          <p className="text-5xl">📝</p>
          <h2 className="mt-2 text-xl font-bold">You haven&apos;t created any quizzes yet</h2>
          <p className="opacity-70">Create your first quiz — you can start from a ready-made question set.</p>
          <Link href="/instructor/quizzes/new" className="btn btn-primary mt-4">
            Create a quiz
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body">
        <input
          type="search"
          className="input w-full"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search quizzes by title"
        />
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Access code</th>
                <th className="text-center">Questions</th>
                <th className="text-center">Participants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((q) => (
                <tr key={q.id} className="hover:bg-base-200/60">
                  <td>
                    <p className="font-semibold">{q.title}</p>
                    <p className="text-xs opacity-60">
                      {q.category} · {q.minutes} min
                    </p>
                  </td>
                  <td>
                    {q.published ? <span className="badge badge-success badge-soft">Published</span> : <span className="badge badge-ghost">Draft</span>}
                  </td>
                  <td>
                    {q.accessCode ? (
                      <div className="flex items-center gap-1">
                        <code className={`rounded bg-base-200 px-2 py-1 font-mono font-bold ${q.published ? "" : "opacity-40"}`}>{q.accessCode}</code>
                        <button type="button" className="btn btn-ghost btn-xs" onClick={() => copy(q.accessCode)} aria-label={`Copy code ${q.accessCode}`}>
                          Copy
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm opacity-50">Publish to get a code</span>
                    )}
                  </td>
                  <td className="text-center">
                    {q.perStudent ? (
                      <span title={`Each student gets ${q.perStudent} random questions from ${q.questionCount}`}>
                        {q.perStudent} <span className="opacity-60">of {q.questionCount}</span>
                      </span>
                    ) : (
                      q.questionCount
                    )}
                  </td>
                  <td className="text-center">{q.participants}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <Link href={`/instructor/quizzes/${q.id}/edit`} className="btn btn-outline btn-xs">
                        Edit
                      </Link>
                      <button
                        type="button"
                        className={`btn btn-xs ${q.published ? "btn-ghost" : "btn-primary"}`}
                        disabled={busyId === q.id}
                        onClick={() => togglePublish(q)}
                      >
                        {busyId === q.id ? <span className="loading loading-spinner loading-xs" /> : q.published ? "Unpublish" : "Publish"}
                      </button>
                      <Link href={`/instructor/analytics/${q.id}`} className="btn btn-ghost btn-xs">
                        Analytics
                      </Link>
                      <DeleteQuizButton quizId={q.id} title={q.title} small />
                    </div>
                  </td>
                </tr>
              ))}
              {!visible.length && (
                <tr>
                  <td colSpan={6} className="py-8 text-center opacity-60">
                    No quizzes match “{search}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
