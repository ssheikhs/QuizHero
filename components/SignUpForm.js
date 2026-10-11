"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { authErrorMessage, signUp } from "@/lib/auth-client";
import { NAME_MAX, PASSWORD_HINT, PASSWORD_RULE } from "@/lib/rules";
import PasswordInput from "./PasswordInput";

export default function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    const confirm = String(form.get("confirm"));
    const instructorCode = isInstructor ? String(form.get("instructorCode") ?? "").trim() : "";

    // Quick checks here for friendly messages; the server checks the same rules again.
    if (!PASSWORD_RULE.test(password)) return setError(PASSWORD_HINT);
    if (password !== confirm) return setError("Passwords do not match.");
    if (isInstructor && !instructorCode) return setError("Enter your instructor invite code.");

    setBusy(true);
    setError("");
    const { error } = await signUp.email({ name, email, password, ...(instructorCode ? { instructorCode } : {}) });

    if (error) {
      setBusy(false);
      setError(authErrorMessage(error));
      return;
    }
    toast.success("Account created — welcome to QuizHero!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div role="alert" className="alert alert-error alert-soft text-sm">
          {error}
        </div>
      )}
      <label className="floating-label w-full">
        <span>Full name</span>
        <input name="name" required maxLength={NAME_MAX} autoComplete="name" placeholder="Full name" className="input w-full" />
      </label>
      <label className="floating-label w-full">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" placeholder="Email" className="input w-full" />
      </label>
      <div>
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          required
          autoComplete="new-password"
          pattern={PASSWORD_RULE.source}
          title={PASSWORD_HINT}
        />
        <p className="mt-1 text-xs opacity-60">8+ characters with an uppercase letter, a number and a symbol.</p>
      </div>
      <PasswordInput id="confirm" name="confirm" label="Confirm password" required autoComplete="new-password" />

      <label className="label cursor-pointer gap-3">
        <input
          type="checkbox"
          className="toggle toggle-primary toggle-sm"
          checked={isInstructor}
          onChange={(e) => setIsInstructor(e.target.checked)}
        />
        <span className="text-sm">I&apos;m an instructor (invite code required)</span>
      </label>
      {isInstructor && (
        <label className="floating-label w-full">
          <span>Instructor invite code</span>
          <input name="instructorCode" required autoComplete="off" placeholder="Instructor invite code" className="input w-full" />
        </label>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy && <span className="loading loading-spinner loading-sm" />}
        {busy ? "Creating account…" : "Sign up"}
      </button>
    </form>
  );
}
