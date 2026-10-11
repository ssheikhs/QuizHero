"use client";

import { useState } from "react";

/** Password field with a show/hide toggle (as in the original sign-up page). */
export default function PasswordInput({ id, label, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="floating-label w-full" htmlFor={id}>
      <span>{label}</span>
      <div className="input w-full">
        <input id={id} type={visible ? "text" : "password"} placeholder={label} className="grow" {...props} />
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "🙈" : "👁️"}
        </button>
      </div>
    </label>
  );
}
