"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { PROJECT_STATUSES, type ProjectStatus } from "@/types/api";

export const STATUS_FILTERS = ["ALL", ...PROJECT_STATUSES] as const;
export type StatusFilter = "ALL" | ProjectStatus;

export interface ReviewFilters {
  status: StatusFilter;
  page: number;
  search: string;
  // "" = anyone, "me" = the person using the page, otherwise the id of a mentor / admin.
  reviewer: string;
  // "" = all projects, "mine" = taken by me, "none" = pending and not taken by anyone.
  claim: "" | "mine" | "none";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The review table's filters live in the address bar (?status=PENDING&q=chat&page=2), not in
// component state. That way a refresh keeps them, the back button steps through them, and a
// mentor can send a link to "all rejected projects". Anything missing or invalid in the URL
// falls back to the default, and defaults are left out of the URL to keep it short.
export function useReviewFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawStatus = searchParams.get("status");
  const rawReviewer = searchParams.get("reviewer") ?? "";
  const rawClaim = searchParams.get("claim");
  const filters: ReviewFilters = {
    status: STATUS_FILTERS.find((s) => s === rawStatus) ?? "ALL",
    page: Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1),
    search: searchParams.get("q") ?? "",
    reviewer: rawReviewer === "me" || UUID.test(rawReviewer) ? rawReviewer : "",
    claim: rawClaim === "mine" || rawClaim === "none" ? rawClaim : "",
  };
  const { status, page, search, reviewer, claim } = filters;

  const setFilters = useCallback(
    (patch: Partial<ReviewFilters>) => {
      const next = { status, page, search, reviewer, claim, ...patch };
      // Any different filter is a different list, so start again at page 1.
      if (!("page" in patch) && ("status" in patch || "search" in patch || "reviewer" in patch || "claim" in patch)) {
        next.page = 1;
      }

      const params = new URLSearchParams();
      if (next.status !== "ALL") params.set("status", next.status);
      if (next.search) params.set("q", next.search);
      if (next.reviewer) params.set("reviewer", next.reviewer);
      if (next.claim) params.set("claim", next.claim);
      if (next.page > 1) params.set("page", String(next.page));

      const query = params.toString();
      const url = query ? `${pathname}?${query}` : pathname;

      // Typing in the search box would fill the history with one entry per pause, so that
      // replaces the current entry; choosing a tab or a page is a step the back button keeps.
      const onlySearch = Object.keys(patch).every((key) => key === "search");
      const navigate = onlySearch ? router.replace : router.push;
      navigate(url, { scroll: false });
    },
    [status, page, search, reviewer, claim, pathname, router]
  );

  return { ...filters, setFilters };
}
