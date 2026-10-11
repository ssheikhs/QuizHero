import { requireRole } from "@/lib/session";
import { ROLES } from "@/lib/rules";

// Every page under /instructor is for instructors only. Students are sent to their own dashboard.
// (Server actions and API routes re-check the role themselves; layouts don't protect those.)
export default async function InstructorLayout({ children }) {
  await requireRole(ROLES.INSTRUCTOR, "/instructor");
  return children;
}
