import type { ReviewableProject } from "@/types/api";

// Everything the table, the phone cards and the detail panel need to act on a project, handed
// down from the dashboard so they all behave the same. `approve` and `reject` already ask "are
// you sure?" when somebody else is reviewing the project; the callers don't have to know.
export interface ReviewControls {
  currentUserId: string | undefined;
  isAdmin: boolean;
  // The project being worked on right now: only its buttons are disabled.
  busyId: string | undefined;
  approve: (project: ReviewableProject) => void;
  reject: (project: ReviewableProject) => void;
  // Admin only: back to pending (asks first).
  reopen: (project: ReviewableProject) => void;
  take: (project: ReviewableProject) => void;
  release: (project: ReviewableProject) => void;
}
