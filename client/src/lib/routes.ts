import type { Role } from "@/types/api";

// Where each role lands after login, and where it is sent when it opens a page it may not use.
// Shared by proxy.ts (server side) and the login / signup forms (browser).
export const HOME_BY_ROLE: Record<Role, string> = {
  STUDENT: "/student",
  MENTOR: "/review",
  ADMIN: "/review",
};
