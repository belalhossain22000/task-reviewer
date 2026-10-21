"use client";

import { SessionError, SessionLoading } from "@/components/common/session-states";
import { StudentNavbar } from "@/components/layout/student-navbar";
import { useSessionGuard } from "@/hooks/use-session-guard";
import type { Role } from "@/types/api";

const STUDENT_ONLY: readonly Role[] = ["STUDENT"];

// The frame around every student page: top bar + content column. Until the API has confirmed
// who is logged in, a skeleton is shown instead, so a page never flashes for the wrong person.
export function StudentShell({ children }: { children: React.ReactNode }) {
  const { isReady, serverError } = useSessionGuard(STUDENT_ONLY);

  if (serverError) return <SessionError message={serverError.message} />;
  if (!isReady) return <SessionLoading />;

  return (
    <div className="flex min-h-dvh flex-col">
      <StudentNavbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
