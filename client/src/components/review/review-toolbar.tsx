"use client";

import { SearchInput } from "@/components/common/search-input";
import { QueueFilter } from "@/components/review/queue-filter";
import { ReviewerFilter } from "@/components/review/reviewer-filter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATUS_FILTERS, type StatusFilter } from "@/hooks/use-review-filters";
import type { ProjectStats } from "@/types/api";

const LABELS: Record<StatusFilter, string> = {
  ALL: "All",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const COUNT_KEY: Record<StatusFilter, keyof ProjectStats> = {
  ALL: "total",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// The row above the table: status tabs on the left, search on the right.
export function ReviewToolbar({
  status,
  onStatusChange,
  stats,
  reviewer,
  onReviewerChange,
  reviewers,
  claim,
  onClaimChange,
  searchText,
  onSearchTextChange,
}: {
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  stats: ProjectStats | undefined;
  reviewer: string;
  onReviewerChange: (reviewer: string) => void;
  reviewers: { id: string; name: string }[];
  claim: "" | "mine" | "none";
  onClaimChange: (claim: "" | "mine" | "none") => void;
  searchText: string;
  onSearchTextChange: (text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Scrolls sideways on a narrow phone instead of squeezing the labels. */}
      <div className="-mx-1 overflow-x-auto px-1">
        <Tabs value={status} onValueChange={(value) => onStatusChange(value as StatusFilter)}>
          <TabsList>
            {STATUS_FILTERS.map((filter) => (
              <TabsTrigger key={filter} value={filter}>
                {LABELS[filter]}
                {stats && (
                  <span className="text-xs text-muted-foreground tabular-nums">{stats[COUNT_KEY[filter]]}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <QueueFilter value={claim} onChange={onClaimChange} />
        <ReviewerFilter value={reviewer} onChange={onReviewerChange} people={reviewers} />
        <SearchInput
          value={searchText}
          onChange={onSearchTextChange}
          placeholder="Search project, student or email"
          label="Search projects"
        />
      </div>
    </div>
  );
}
