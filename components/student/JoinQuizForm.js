"use client";

import { useActionState } from "react";
import { joinQuiz } from "@/app/student/actions";

export default function JoinQuizForm({ initialCode = "", compact = false }) {
  const [state, formAction, pending] = useActionState(joinQuiz, null);

  return (
    <form action={formAction} className="space-y-3">
      <div className={compact ? "join w-full" : "flex flex-col gap-3 sm:flex-row"}>
        <input
          name="code"
          required
          defaultValue={state?.code ?? initialCode}
          maxLength={12}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="Enter access code"
          aria-label="Quiz access code"
          className={`input font-mono text-lg tracking-[0.3em] uppercase placeholder:font-sans placeholder:text-base placeholder:tracking-normal placeholder:normal-case ${compact ? "join-item w-full" : "input-lg w-full"}`}
        />
        <button type="submit" className={`btn btn-primary ${compact ? "join-item" : "btn-lg"}`} disabled={pending}>
          {pending && <span className="loading loading-spinner loading-sm" />}
          {pending ? "Joining…" : "Join"}
        </button>
      </div>
      {state?.error && (
        <div role="alert" className="alert alert-error alert-soft text-sm">
          {state.error}
        </div>
      )}
    </form>
  );
}
