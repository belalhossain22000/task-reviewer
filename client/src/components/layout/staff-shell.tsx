"use client";

import { SessionError, SessionLoading } from "@/components/common/session-states";
import { StaffSidebar } from "@/components/layout/staff-sidebar";
import { StaffTopbar } from "@/components/layout/staff-topbar";
import { useSessionGuard } from "@/hooks/use-session-guard";
import type { Role } from "@/types/api";

const STAFF: readonly Role[] = ["MENTOR", "ADMIN"];

// The frame around every mentor / admin page: sidebar on the left, top bar and content on the
// right. Like the student shell, it shows a skeleton until the API has confirmed who this is.
export function StaffShell({ children }: { children: React.ReactNode }) {
  const { isReady, serverError } = useSessionGuard(STAFF);

  if (serverError) return <SessionError message={serverError.message} />;
  if (!isReady) return <SessionLoading />;

  return (
    <div className="flex min-h-dvh">
      <StaffSidebar />
      {/* min-w-0 lets a wide table scroll inside the column instead of stretching the page. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <StaffTopbar />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
