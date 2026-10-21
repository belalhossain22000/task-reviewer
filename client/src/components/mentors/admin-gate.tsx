"use client";

import { SessionLoading } from "@/components/common/session-states";
import { useSessionGuard } from "@/hooks/use-session-guard";
import type { Role } from "@/types/api";

const ADMIN_ONLY: readonly Role[] = ["ADMIN"];

// Wraps pages only an admin may open. proxy.ts already keeps mentors out by reading the cookie;
// this covers a session that is out of date (the token says admin, the account no longer is):
// the guard ends it and sends the person to log in again.
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { isReady } = useSessionGuard(ADMIN_ONLY);

  if (!isReady) return <SessionLoading />;
  return <>{children}</>;
}
