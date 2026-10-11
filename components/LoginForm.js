"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { authErrorMessage, signIn } from "@/lib/auth-client";
import PasswordInput from "./PasswordInput";

/** Only allow redirects to paths inside this site (no "//evil.com" or full URLs). */
function safeNext(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");

    const { error } = await signIn.email({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });

    if (error) {
      setBusy(false);
      setError(authErrorMessage(error));
      return;
    }
    toast.success("Welcome back!");
    // /dashboard sends each role to its own dashboard.
    router.push(safeNext(searchParams.get("next")));
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
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" placeholder="Email" className="input w-full" />
      </label>
      <PasswordInput id="password" name="password" label="Password" required autoComplete="current-password" />
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy && <span className="loading loading-spinner loading-sm" />}
        {busy ? "Logging in…" : "Login"}
      </button>
    </form>
  );
}
