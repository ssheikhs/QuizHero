"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { deleteQuiz } from "@/app/instructor/quizzes/actions";
import { callAction } from "@/lib/call-action";

export default function DeleteQuizButton({ quizId, title, redirectTo, small = false }) {
  const router = useRouter();
  const dialog = useRef(null);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    const result = await callAction(deleteQuiz, quizId);
    setBusy(false);
    dialog.current?.close();
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Quiz deleted");
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <>
      <button type="button" className={`btn btn-error btn-outline ${small ? "btn-xs" : "btn-sm"}`} onClick={() => dialog.current?.showModal()}>
        Delete
      </button>
      <dialog ref={dialog} className="modal">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Delete this quiz?</h3>
          <p className="py-3">
            <strong>{title}</strong> will be removed permanently, together with all of its questions and leaderboard results.
          </p>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={() => dialog.current?.close()} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="btn btn-error" onClick={handleDelete} disabled={busy}>
              {busy && <span className="loading loading-spinner loading-sm" />} Delete permanently
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label="Close">close</button>
        </form>
      </dialog>
    </>
  );
}
