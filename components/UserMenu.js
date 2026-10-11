"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { signOut } from "@/lib/auth-client";
import { homeFor } from "@/lib/rules";
import Avatar from "./Avatar";

export default function UserMenu({ user }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    const { error } = await signOut();
    setBusy(false);
    if (error) {
      toast.error("Couldn't log out. Please try again.");
      return;
    }
    toast.success("Logged out");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="dropdown dropdown-end">
      <button tabIndex={0} className="btn btn-ghost btn-circle" aria-label="Account menu">
        <Avatar name={user.name} image={user.image} size="w-9" />
      </button>
      <div tabIndex={0} className="dropdown-content z-50 mt-3 w-64 rounded-box bg-base-100 p-3 text-base-content shadow-lg">
        <div className="mb-2 border-b border-base-300 px-2 pb-3">
          <p className="truncate font-semibold">{user.name}</p>
          <p className="truncate text-sm opacity-70">{user.email}</p>
          <span className={`badge badge-sm mt-2 ${user.role === "Instructor" ? "badge-primary" : "badge-secondary"}`}>
            {user.role}
          </span>
        </div>
        <ul className="menu w-full p-0">
          <li>
            <Link href={homeFor(user.role)}>Dashboard</Link>
          </li>
          <li>
            <Link href="/profile">Profile &amp; photo</Link>
          </li>
          <li>
            <button type="button" onClick={handleSignOut} disabled={busy} className="text-error">
              {busy ? "Logging out…" : "Log out"}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
