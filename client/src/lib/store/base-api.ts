import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
} from "@reduxjs/toolkit/query/react";

import { toApiError, type ApiError } from "@/lib/api-error";
import type { ApiMeta, ApiResponse, PaginatedResponse } from "@/types/api";

const rawBaseQuery = fetchBaseQuery({
  // Same origin as the app: next.config.ts forwards /api/* to Express. That keeps the
  // login cookie on this origin (so proxy.ts can read it) and avoids CORS entirely.
  baseUrl: "/api",
  credentials: "same-origin",
});

// Login, signup and /auth/me are expected to answer 401 when nobody is logged in.
const isAuthRequest = (args: string | FetchArgs) => {
  const url = typeof args === "string" ? args : args.url;
  return url.startsWith("/auth/");
};

// Wraps fetchBaseQuery to do two things for every request:
//  1. turn any failure into our ApiError shape;
//  2. if a protected call gets 401 (the session expired), mark `Me` as stale. getMe then
//     runs again, gets 401 too, and the route guard sends the user to /login.
//     (We don't wipe the whole cache here: pages that are still mounted would re-request
//     and could trigger the wipe again in a loop. Stale data from the old session is
//     cleared by login / signup / logout instead.)
// The explicit type matters: it lets this function mention `baseApi` below without
// making TypeScript treat the definition as circular.
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, ApiError> = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (!result.error) return result;

  const error = toApiError(result.error, result.meta?.response);

  if (error.status === 401 && !isAuthRequest(args)) {
    api.dispatch(baseApi.util.invalidateTags(["Me"]));
  }

  return { error };
};

export const TAG_TYPES = ["Me", "Project", "MyProject", "Stats", "Mentor"] as const;

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
  // Cache labels: a query "provides" tags, a mutation "invalidates" them, and every
  // query holding an invalidated tag is fetched again automatically.
  tagTypes: TAG_TYPES,
  // Re-fetch when the tab regains focus or the network comes back, so the review
  // table never goes stale and an expired session is noticed.
  refetchOnFocus: true,
  refetchOnReconnect: true,
  // Each feature adds its own endpoints with baseApi.injectEndpoints(...).
  endpoints: () => ({}),
});

/* ---------- Helpers shared by the feature APIs ---------- */

// RTK Query runs `invalidatesTags` even when the mutation FAILED. Without this, a form
// rejected with 400 / 409 / 429 would still make every list refetch for nothing.
// Use it as: invalidatesTags: invalidateOnSuccess("Project", "Stats")
export const invalidateOnSuccess =
  (...tags: (typeof TAG_TYPES)[number][]) =>
  (_result: unknown, error: unknown) =>
    error ? [] : tags;

export interface Page<T> {
  data: T[];
  meta: ApiMeta;
}

// The API wraps everything as { success, message, data }. Keep only `data`.
export const unwrap = <T>(response: ApiResponse<T>) => response.data;

// For lists, keep `data` and `meta` (pagination info).
export const unwrapPage = <T>(response: PaginatedResponse<T>): Page<T> => ({
  data: response.data,
  meta: response.meta,
});
