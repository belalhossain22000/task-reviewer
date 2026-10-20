"use client";

import { createContext, useContext, useMemo } from "react";

import { useGetMeQuery } from "@/features/auth/auth-api";
import { isApiError, type ApiError } from "@/lib/api-error";
import type { Role, User } from "@/types/api";

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  // True until /auth/me has answered at least once. While this is true we don't know
  // yet whether anybody is logged in, so nothing should redirect.
  isLoading: boolean;
  // Set when /auth/me failed for a reason other than "not logged in" (server down, 500).
  // Lets a guard say "can't reach the server" instead of wrongly sending the user to /login.
  loadError: ApiError | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Cookies are httpOnly, so JavaScript can't read them. The only way to learn who is
// logged in is to ask the API (GET /auth/me), and this provider does that once for the app.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, error, isLoading, isUninitialized } = useGetMeQuery();

  const value = useMemo<AuthContextValue>(() => {
    const user = data ?? null;
    // 401 is the normal answer for "nobody is logged in", not a failure.
    const apiError = isApiError(error) ? error : null;
    const loadError = apiError && apiError.status !== 401 ? apiError : null;

    return {
      user,
      role: user?.role ?? null,
      isAuthenticated: user !== null,
      isLoading: isLoading || isUninitialized,
      loadError,
    };
  }, [data, error, isLoading, isUninitialized]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
