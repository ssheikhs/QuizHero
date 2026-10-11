"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDuration } from "@/lib/format";

/** "My Quiz Participants" from the original dashboard, with the filter-by-quiz dropdown. */
export default function ParticipantsByQuiz({ quizzes, rows }) {
  const [quizId, setQuizId] = useState("all");
  const titles = new Map(quizzes.map((q) => [q.id, q.title]));
  const visible = quizId === "all" ? rows : rows.filter((r) => r.quizId === quizId);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="card-title">My quiz participants</h2>
        <label className="flex items-center gap-2 text-sm">
          <span className="opacity-70">Filter by quiz:</span>
          <select className="select select-sm w-64" value={quizId} onChange={(e) => setQuizId(e.target.value)}>
            <option value="all">All quizzes</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length ? (
        <div className="max-h-[28rem] overflow-auto">
          <table className="table-pin-rows table">
            <thead>
              <tr>
                <th>Student</th>
                {quizId === "all" && <th>Quiz</th>}
                <th className="text-right">Score</th>
                <th className="text-right">Time</th>
                <th>Submitted</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="hover:bg-base-200/60">
                  <td className="font-medium">{r.name}</td>
                  {quizId === "all" && <td className="opacity-70">{titles.get(r.quizId)}</td>}
                  <td className="text-right font-mono">{r.score}%</td>
                  <td className="text-right font-mono">{formatDuration(r.time)}</td>
                  <td className="text-sm opacity-70" suppressHydrationWarning>
                    {new Date(r.submittedAt).toLocaleString()}
                  </td>
                  <td>
                    <Link href={`/instructor/analytics/${r.quizId}/attempts/${r.id}`} className="btn btn-ghost btn-xs">
                      Answers
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-6 opacity-60">{quizzes.length ? "No participants yet." : "You haven't created any quizzes yet."}</p>
      )}
    </>
  );
}
