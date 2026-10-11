import { requireRole } from "@/lib/session";
import { ROLES } from "@/lib/rules";

// Every page under /student is for students only. Instructors are sent to their own dashboard.
export default async function StudentLayout({ children }) {
  await requireRole(ROLES.STUDENT, "/student");
  return children;
}
