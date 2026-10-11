import { TYPE_LABELS } from "@/lib/quiz-schema";

/** Question-by-question result list (student result page and instructor attempt view). */
export default function AnswerBreakdown({ results, who = "Your" }) {
  return (
    <ol className="space-y-3">
      {results.map((r, i) => (
        <li key={r.id} className={`card border-l-4 bg-base-100 shadow-sm ${r.isCorrect ? "border-success" : "border-error"}`}>
          <div className="card-body gap-2 py-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold whitespace-pre-wrap">
                {i + 1}. {r.text}
              </p>
              <span className={`badge shrink-0 ${r.isCorrect ? "badge-success" : "badge-error"}`}>{r.isCorrect ? "✓ Correct" : "✗ Wrong"}</span>
            </div>
            <p className="text-xs opacity-50">{TYPE_LABELS[r.type]}</p>
            <div className="grid gap-1 text-sm sm:grid-cols-2">
              <p>
                <span className="opacity-60">{who} answer: </span>
                {r.given ? <span className={r.isCorrect ? "text-success" : "text-error"}>{r.given}</span> : <em className="opacity-60">Not answered</em>}
              </p>
              {!r.isCorrect && (
                <p>
                  <span className="opacity-60">Correct answer: </span>
                  <span className="font-semibold text-success">{r.correctAnswer}</span>
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
