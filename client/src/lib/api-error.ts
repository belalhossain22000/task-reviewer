import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

import type { ApiErrorBody, ApiErrorSource } from "@/types/api";

// Every failed request ends up in this one shape, whatever went wrong
// (validation, wrong role, server down, ...). Components never see raw fetch errors.
export interface ApiError {
  // HTTP status, or "NETWORK" when the server could not be reached at all.
  status: number | "NETWORK";
  message: string;
  // Field-level problems, e.g. [{ path: "repoUrl", message: "..." }].
  errorSources: ApiErrorSource[];
  // Seconds to wait before retrying, from the Retry-After header of a 429.
  retryAfter?: number;
}

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

export function toApiError(
  error: FetchBaseQueryError,
  response?: Response
): ApiError {
  if (error.status === "FETCH_ERROR" || error.status === "TIMEOUT_ERROR") {
    return {
      status: "NETWORK",
      message: "Can't reach the server. Check your connection and try again.",
      errorSources: [],
    };
  }

  if (typeof error.status === "number") {
    const body = error.data as Partial<ApiErrorBody> | undefined;
    const retryAfter = Number(response?.headers.get("Retry-After")) || undefined;

    return {
      status: error.status,
      message: body?.message ?? GENERIC_MESSAGE,
      errorSources: body?.errorSources ?? [],
      retryAfter,
    };
  }

  // PARSING_ERROR / CUSTOM_ERROR: the server answered with something that isn't our JSON.
  return {
    status: "originalStatus" in error ? error.originalStatus : 500,
    message: GENERIC_MESSAGE,
    errorSources: [],
  };
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    "errorSources" in value &&
    Array.isArray((value as ApiError).errorSources)
  );
}

// Message to show in a toast or an alert.
export function getErrorMessage(error: unknown): string {
  return isApiError(error) ? error.message : GENERIC_MESSAGE;
}

// { repoUrl: "This repository has already been submitted", ... }
// Lets a form attach each message to its own field. Only the first message per field is kept.
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!isApiError(error)) return {};

  const fields: Record<string, string> = {};
  for (const { path, message } of error.errorSources) {
    if (path && !(path in fields)) fields[path] = message;
  }
  return fields;
}
