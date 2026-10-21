"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useLogoutMutation } from "@/features/auth/auth-api";
import { useAuth } from "@/providers/auth-provider";
import type { Role } from "@/types/api";

// proxy.ts has already checked the login cookie before this page rendered. This hook is the
// safety net for what the cookie alone can't tell. Two cases, both meaning "this session is
// out of date":
//  - the account was deactivated after the token was issued, so the API refuses it even though
//    the token is still valid;
//  - the account's role changed, so the role in the API no longer matches the one inside the
//    token (and proxy.ts, which only reads the token, would send them back here).
// Either way the fix is the same: clear the cookie and log in again.
// Pass a module-level constant for `roles` so the effect doesn't re-run on every render.
export function useSessionGuard(roles: readonly Role[]) {
  const { user, isLoading, loadError } = useAuth();
  const router = useRouter();
  const [logout] = useLogoutMutation();
  const leaving = useRef(false);

  // 403 from /auth/me means "deactivated"; any other failure means the server has a problem.
  const isDeactivated = loadError?.status === 403;
  const serverError = loadError && !isDeactivated ? loadError : null;
  const isReady = !!user && roles.includes(user.role);

  useEffect(() => {
    if (isLoading || serverError || leaving.current) return;
    if (isReady) return;

    leaving.current = true;

    // The cookie has to go first. While it exists, proxy.ts thinks the visitor is logged in and
    // would bounce /login straight back here, and we would loop forever.
    const reason = user
      ? "Your access has changed. Please log in again."
      : loadError?.message;
    logout()
      .unwrap()
      .catch(() => undefined)
      .finally(() => {
        if (reason) toast.error(reason);
        router.replace("/login");
      });
  }, [isLoading, serverError, isReady, user, loadError, logout, router]);

  return { isReady, serverError };
}
