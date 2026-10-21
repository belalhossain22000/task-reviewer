"use client";

import { Inbox } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PaginationControls } from "@/components/common/pagination-controls";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ProjectDetailSheet } from "@/components/review/project-detail-sheet";
import { ProjectsTable, ProjectsTableSkeleton } from "@/components/review/projects-table";
import { RejectDialog } from "@/components/review/reject-dialog";
import type { ReviewControls } from "@/components/review/review-controls";
import { ReviewToolbar } from "@/components/review/review-toolbar";
import { StatsCards } from "@/components/review/stats-cards";
import { Button } from "@/components/ui/button";
import { useGetProjectsQuery, useGetProjectStatsQuery } from "@/features/project/project-api";
import { useGetMentorsQuery } from "@/features/user/user-api";
import { useDebounce } from "@/hooks/use-debounce";
import { useReviewActions } from "@/hooks/use-review-actions";
import { useReviewFilters } from "@/hooks/use-review-filters";
import { getErrorMessage } from "@/lib/api-error";
import { useAuth } from "@/providers/auth-provider";
import type { ReviewableProject } from "@/types/api";

const PAGE_SIZE = 10;

// The whole /review page below its title: numbers, filters, table and the two panels (detail
// sheet, reject dialog). The filters live in the URL (useReviewFilters); everything on screen
// is a function of them, and the server does the filtering, searching and paging.
export function ReviewDashboard() {
  const { status, page, search, reviewer, claim, setFilters } = useReviewFilters();
  const { user, role } = useAuth();

  /* ----- search box: what is typed, vs what is in the URL ----- */
  const [searchText, setSearchText] = useState(search);
  const debouncedText = useDebounce(searchText, 300);
  // The value last written to, or read from, the URL. Comparing against it (rather than
  // against `search` directly) is what stops the box and the URL from overwriting each other
  // while the user is typing, or after they press the back button.
  const syncedSearch = useRef(search);
  const setFiltersRef = useRef(setFilters);
  useEffect(() => {
    setFiltersRef.current = setFilters;
  });

  useEffect(() => {
    const typed = debouncedText.trim();
    if (typed === syncedSearch.current) return;
    syncedSearch.current = typed;
    setFiltersRef.current({ search: typed });
  }, [debouncedText]);

  useEffect(() => {
    // The URL changed by itself (back / forward / "Clear filters"): show it in the box.
    if (search === syncedSearch.current) return;
    syncedSearch.current = search;
    setSearchText(search);
  }, [search]);

  /* ----- data ----- */
  const { data, error, isLoading, isFetching, refetch } = useGetProjectsQuery({
    page,
    limit: PAGE_SIZE,
    status,
    search: search || undefined,
    reviewer: reviewer || undefined,
    claim: claim || undefined,
  }, {
    // Other mentors take and decide projects while this page is open: look again every minute
    // (only while this tab is the one being looked at) so "taken by ..." stays true. Not more
    // often: the API's global limit is per IP, and a whole office of mentors can share one.
    pollingInterval: 60_000,
    skipPollingIfUnfocused: true,
  });
  const { data: stats, isLoading: statsLoading } = useGetProjectStatsQuery();
  // Only an admin may list mentors, so only an admin gets them in the "reviewed by" drop-down.
  const { data: mentors } = useGetMentorsQuery({ limit: 50 }, { skip: role !== "ADMIN" });

  // If the last project of the last page was just decided, that page is now empty: step back.
  useEffect(() => {
    if (data && data.data.length === 0 && data.meta.page > 1) {
      setFiltersRef.current({ page: Math.max(1, data.meta.totalPages) });
    }
  }, [data]);

  /* ----- actions + the two panels ----- */
  const actions = useReviewActions();
  const [detail, setDetail] = useState<ReviewableProject | null>(null);
  const [rejecting, setRejecting] = useState<ReviewableProject | null>(null);
  // A decision on a project somebody else is reviewing waits here for "decide anyway?".
  const [conflict, setConflict] = useState<{ project: ReviewableProject; kind: "approve" | "reject" } | null>(null);

  // "Reopen" waits here for a yes.
  const [reopening, setReopening] = useState<ReviewableProject | null>(null);

  const heldByOther = (project: ReviewableProject) => !!project.claimedBy && project.claimedBy.id !== user?.id;

  // "Take" is a soft claim, not a lock: nobody is stopped from deciding. They are only asked first,
  // so two people don't end up deciding the same project without knowing.
  const controls: ReviewControls = {
    currentUserId: user?.id,
    isAdmin: role === "ADMIN",
    busyId: actions.busyId,
    approve: (project) => (heldByOther(project) ? setConflict({ project, kind: "approve" }) : void actions.approve(project)),
    reject: (project) => (heldByOther(project) ? setConflict({ project, kind: "reject" }) : setRejecting(project)),
    reopen: setReopening,
    take: (project) => void actions.take(project),
    release: (project) => void actions.release(project),
  };

  const continueAnyway = () => {
    if (!conflict) return;
    const { project, kind } = conflict;
    setConflict(null);
    if (kind === "approve") void actions.approve(project);
    else setRejecting(project);
  };

  const clearFilters = () => setFilters({ status: "ALL", search: "", reviewer: "", claim: "" });
  const hasFilters = status !== "ALL" || search !== "" || reviewer !== "" || claim !== "";

  return (
    <div className="flex flex-col gap-6">
      <StatsCards
        stats={stats}
        isLoading={statsLoading}
        active={status}
        onSelect={(filter) => setFilters({ status: filter })}
      />

      <ReviewToolbar
        status={status}
        onStatusChange={(next) => setFilters({ status: next })}
        stats={stats}
        reviewer={reviewer}
        onReviewerChange={(next) => setFilters({ reviewer: next })}
        reviewers={mentors?.data ?? []}
        claim={claim}
        onClaimChange={(next) => setFilters({ claim: next })}
        searchText={searchText}
        onSearchTextChange={setSearchText}
      />

      {isLoading ? (
        <ProjectsTableSkeleton />
      ) : error && !data ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : data && data.data.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={
            !hasFilters
              ? "No submissions yet"
              : search
                ? `No projects match "${search}"`
                : reviewer || claim
                  ? "No projects match these filters"
                  : `No ${status.toLowerCase()} projects`
          }
          description={
            hasFilters
              ? "Try a different search, status or reviewer."
              : "Projects will appear here as students submit them."
          }
        >
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </EmptyState>
      ) : data ? (
        <div className="flex flex-col gap-4">
          <ProjectsTable
            projects={data.data}
            controls={controls}
            onOpen={setDetail}
            isFetching={isFetching}
          />
          <PaginationControls
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            limit={data.meta.limit}
            onPageChange={(next) => setFilters({ page: next })}
            disabled={isFetching}
          />
        </div>
      ) : null}

      <ProjectDetailSheet
        project={detail}
        onClose={() => setDetail(null)}
        controls={controls}
      />
      <ConfirmDialog
        open={!!conflict}
        title={`${conflict?.project.claimedBy?.name ?? "Someone"} is reviewing this`}
        description={`"${conflict?.project.name ?? "This project"}" was taken by ${conflict?.project.claimedBy?.name ?? "another reviewer"}. Do you want to ${conflict?.kind === "approve" ? "approve" : "reject"} it anyway?`}
        confirmLabel={conflict?.kind === "approve" ? "Approve anyway" : "Reject anyway"}
        destructive={conflict?.kind === "reject"}
        onConfirm={continueAnyway}
        onCancel={() => setConflict(null)}
      />
      <ConfirmDialog
        open={!!reopening}
        title="Move back to pending?"
        description={`"${reopening?.name ?? "This project"}" goes back to the queue and its current decision and note are cleared. The decision stays in its history.`}
        confirmLabel="Reopen"
        onConfirm={() => {
          if (reopening) void actions.reopen(reopening);
          setReopening(null);
        }}
        onCancel={() => setReopening(null)}
      />
      <RejectDialog project={rejecting} onClose={() => setRejecting(null)} onReject={actions.reject} />
    </div>
  );
}
