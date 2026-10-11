import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { homeFor } from "@/lib/rules";

// Sends each role to its own dashboard (used after login / sign up).
export default async function DashboardRedirect() {
  const user = await requireUser("/dashboard");
  redirect(homeFor(user.role));
}
