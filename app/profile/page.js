import ProfileForms from "@/components/profile/ProfileForms";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/profile");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Your profile</h1>
      <p className="mt-1 mb-6 opacity-70">
        {user.email} · <span className="badge badge-primary badge-soft">{user.role}</span>
      </p>
      <ProfileForms user={{ id: user.id, name: user.name, image: user.image ?? null }} />
    </div>
  );
}
