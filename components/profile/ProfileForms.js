"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { updateName } from "@/app/profile/actions";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { callAction } from "@/lib/call-action";
import { NAME_MAX, PASSWORD_HINT, PASSWORD_RULE } from "@/lib/rules";
import Avatar from "../Avatar";
import PasswordInput from "../PasswordInput";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export default function ProfileForms({ user }) {
  const router = useRouter();
  const fileInput = useRef(null);
  const [image, setImage] = useState(user.image);
  const [uploading, setUploading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function uploadPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file again
    if (!file) return;
    // Quick checks for a friendly message — the server validates again and re-encodes the image.
    if (!TYPES.includes(file.type)) return toast.error("Use a JPG, PNG, GIF or WebP image.");
    if (file.size > MAX_BYTES) return toast.error("Photo must be 2 MB or smaller.");

    setUploading(true);
    const body = new FormData();
    body.append("photo", file);
    try {
      const res = await fetch("/api/avatar", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Upload failed.");
      setImage(data.image);
      toast.success("Photo updated");
      router.refresh(); // navbar avatar
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    setUploading(true);
    const res = await fetch("/api/avatar", { method: "DELETE" }).catch(() => null);
    setUploading(false);
    if (!res?.ok) return toast.error("Couldn't remove the photo.");
    setImage(null);
    toast.success("Photo removed");
    router.refresh();
  }

  async function saveName(event) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name"));
    setSavingName(true);
    const result = await callAction(updateName, name);
    setSavingName(false);
    if (!result.ok) return toast.error(result.error);
    toast.success("Name updated");
    router.refresh();
  }

  async function changePassword(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("current"));
    const newPassword = String(data.get("new"));
    if (!PASSWORD_RULE.test(newPassword)) return toast.error(PASSWORD_HINT);
    if (newPassword !== data.get("confirm")) return toast.error("New passwords do not match.");

    setSavingPassword(true);
    const { error } = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    setSavingPassword(false);
    if (error) return toast.error(error.code === "INVALID_PASSWORD" ? "Current password is wrong." : authErrorMessage(error));
    form.reset();
    toast.success("Password changed. Other devices were logged out.");
  }

  return (
    <div className="space-y-6">
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Profile photo</h2>
          <div className="flex flex-wrap items-center gap-6">
            <Avatar name={user.name} image={image} size="w-28" />
            <div className="space-y-2">
              <input ref={fileInput} type="file" accept={TYPES.join(",")} className="hidden" onChange={uploadPhoto} />
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-primary" disabled={uploading} onClick={() => fileInput.current?.click()}>
                  {uploading && <span className="loading loading-spinner loading-sm" />}
                  {image ? "Change photo" : "Upload photo"}
                </button>
                {image && (
                  <button type="button" className="btn btn-ghost text-error" disabled={uploading} onClick={removePhoto}>
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs opacity-60">JPG, PNG, GIF or WebP, up to 2 MB. It&apos;s cropped to a square and resized.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <form className="card-body" onSubmit={saveName}>
          <h2 className="card-title">Display name</h2>
          <p className="text-sm opacity-60">Shown on leaderboards and to your instructors.</p>
          <div className="join w-full">
            <input name="name" defaultValue={user.name} required maxLength={NAME_MAX} className="input join-item w-full" aria-label="Display name" />
            <button type="submit" className="btn btn-primary join-item" disabled={savingName}>
              {savingName && <span className="loading loading-spinner loading-sm" />} Save
            </button>
          </div>
        </form>
      </section>

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <form className="card-body space-y-3" onSubmit={changePassword}>
          <h2 className="card-title">Change password</h2>
          <PasswordInput id="current" name="current" label="Current password" required autoComplete="current-password" />
          <PasswordInput id="new" name="new" label="New password" required autoComplete="new-password" />
          <PasswordInput id="confirm" name="confirm" label="Confirm new password" required autoComplete="new-password" />
          <p className="text-xs opacity-60">8+ characters with an uppercase letter, a number and a symbol.</p>
          <div>
            <button type="submit" className="btn btn-primary" disabled={savingPassword}>
              {savingPassword && <span className="loading loading-spinner loading-sm" />} Change password
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
