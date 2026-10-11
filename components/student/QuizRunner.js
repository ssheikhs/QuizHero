"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { saveAnswers, submitAttempt } from "@/app/student/actions";
import { callAction } from "@/lib/call-action";
import { formatClock, optionLetter } from "@/lib/format";

const isAnswered = (value) => value !== undefined && value !== null && value !== "";

export default function QuizRunner({ attemptId, title, questions, savedAnswers, deadline, serverNow }) {
  const router = useRouter();
  const [answers, setAnswers] = useState(savedAnswers);
  const [current, setCurrent] = useState(() => Math.max(0, questions.findIndex((q) => !isAnswered(savedAnswers[q.id]))));
  // The deadline comes from the server; correct for a wrong clock on this device.
  const clockOffset = useRef(null);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil((deadline - serverNow) / 1000));
  const [saveState, setSaveState] = useState("saved"); // saved | pending | saving | error
  const [retry, setRetry] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);
  const answersRef = useRef(answers);
  const confirmDialog = useRef(null);

  answersRef.current = answers;
  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length;
  const question = questions[current];

  const submit = useCallback(
    async ({ auto = false } = {}) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      confirmDialog.current?.close();
      if (auto) toast("⏰ Time is up! Submitting your quiz…", { duration: 4000 });

      const result = await callAction(submitAttempt, attemptId, answersRef.current, { auto });
      if (result.ok) {
        router.replace(result.url);
        router.refresh();
        return;
      }
      submittedRef.current = false;
      setSubmitting(false);
      toast.error(`${result.error} Your answers are saved — try again.`);
    },
    [attemptId, router],
  );

  // Countdown driven by the server deadline, so reloading or switching device never resets it.
  useEffect(() => {
    if (clockOffset.current === null) clockOffset.current = serverNow - Date.now();
    const tick = () => {
      const left = Math.ceil((deadline - (Date.now() + clockOffset.current)) / 1000);
      setSecondsLeft(left);
      if (left <= 0) submit({ auto: true });
    };
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [deadline, serverNow, submit]);

  // Autosave shortly after each change.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (submittedRef.current) return;
    setSaveState("pending");
    const timer = setTimeout(async () => {
      setSaveState("saving");
      const result = await callAction(saveAnswers, attemptId, answers);
      if (result.ok) return setSaveState("saved");
      if (result.submitted || result.expired) return submit({ auto: true });
      setSaveState("error");
      setTimeout(() => setRetry((n) => n + 1), 5000); // e.g. Wi-Fi dropped — try again shortly
    }, 700);
    return () => clearTimeout(timer);
  }, [answers, retry, attemptId, submit]);

  // Warn before closing the tab while a save is still on its way.
  useEffect(() => {
    const warn = (event) => {
      if (saveState !== "saved" && !submittedRef.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  const answer = (value) => setAnswers((prev) => ({ ...prev, [question.id]: value }));

  function requestSubmit() {
    if (answeredCount < questions.length) confirmDialog.current?.showModal();
    else submit();
  }

  const lowTime = secondsLeft <= 60;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header: title, timer, progress */}
      <div className="sticky top-16 z-20 -mx-4 mb-6 border-b border-base-300 bg-base-200/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{title}</h1>
            <p className="text-sm opacity-70">
              {answeredCount} of {questions.length} answered ·{" "}
              <span className={saveState === "error" ? "text-error" : ""}>
                {saveState === "saved" ? "✓ All answers saved" : saveState === "error" ? "⚠ Offline — retrying…" : "Saving…"}
              </span>
            </p>
          </div>
          <div
            className={`badge badge-lg gap-1 px-4 py-4 font-mono text-lg font-bold ${lowTime ? "badge-error animate-pulse" : "badge-primary"}`}
            role="timer"
            aria-live={lowTime ? "assertive" : "off"}
            aria-label={`Time left ${formatClock(secondsLeft)}`}
          >
            ⏱ {formatClock(secondsLeft)}
          </div>
        </div>
        <progress className="progress progress-primary mt-3 w-full" value={answeredCount} max={questions.length} />
      </div>

      {/* Question navigator */}
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Questions">
        {questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setCurrent(i)}
            aria-current={i === current ? "step" : undefined}
            className={`btn btn-sm btn-square ${i === current ? "btn-primary" : isAnswered(answers[q.id]) ? "btn-success btn-soft" : "btn-ghost border-base-300"}`}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      {/* Current question */}
      <div className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <p className="text-sm font-semibold opacity-60">
            Question {current + 1} of {questions.length}
          </p>
          <h2 className="text-xl font-semibold whitespace-pre-wrap">{question.text}</h2>

          <div className="mt-4 space-y-2">
            {question.type === "MCQ" &&
              question.options.map((option, i) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-box border p-3 transition ${answers[question.id] === option.value ? "border-primary bg-primary/10" : "border-base-300 hover:bg-base-200"}`}
                >
                  <input
                    type="radio"
                    className="radio radio-primary"
                    name={`q-${question.id}`}
                    checked={answers[question.id] === option.value}
                    onChange={() => answer(option.value)}
                  />
                  <span className="font-semibold">{optionLetter(i)}.</span>
                  <span>{option.label}</span>
                </label>
              ))}

            {question.type === "TrueFalse" && (
              <div className="grid grid-cols-2 gap-3">
                {["True", "False"].map((value) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center justify-center gap-3 rounded-box border p-4 text-lg font-semibold transition ${answers[question.id] === value ? "border-primary bg-primary/10" : "border-base-300 hover:bg-base-200"}`}
                  >
                    <input type="radio" className="radio radio-primary" name={`q-${question.id}`} checked={answers[question.id] === value} onChange={() => answer(value)} />
                    {value}
                  </label>
                ))}
              </div>
            )}

            {question.type === "FillBlank" && (
              <input
                key={question.id}
                className="input input-lg w-full"
                placeholder="Type your answer here"
                autoComplete="off"
                maxLength={200}
                value={answers[question.id] ?? ""}
                onChange={(e) => answer(e.target.value)}
              />
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-2">
            <button type="button" className="btn btn-ghost" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
              ← Previous
            </button>
            {current < questions.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={() => setCurrent((c) => c + 1)}>
                Next →
              </button>
            ) : (
              <button type="button" className="btn btn-success" disabled={submitting} onClick={requestSubmit}>
                {submitting && <span className="loading loading-spinner loading-sm" />} Submit quiz
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button type="button" className="btn btn-outline btn-success" disabled={submitting} onClick={requestSubmit}>
          {submitting ? "Submitting…" : "Submit quiz now"}
        </button>
      </div>

      <dialog ref={confirmDialog} className="modal">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Submit with unanswered questions?</h3>
          <p className="py-3">
            You&apos;ve answered {answeredCount} of {questions.length}. Unanswered questions count as wrong, and you can&apos;t change answers after
            submitting.
          </p>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={() => confirmDialog.current?.close()}>
              Keep answering
            </button>
            <button type="button" className="btn btn-success" onClick={() => submit()}>
              Submit anyway
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label="Close">close</button>
        </form>
      </dialog>
    </div>
  );
}
