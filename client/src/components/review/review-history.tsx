"use client";

import { RelativeTime } from "@/components/common/relative-time";
import { ReviewNote } from "@/components/common/review-note";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetProjectHistoryQuery } from "@/features/project/project-api";
import { getErrorMessage } from "@/lib/api-error";

// Every decision ever made on one project, newest first: who made it, when, and why. An admin
// moving the project back to the queue shows as a "Pending, reopened by ..." entry. The top
// one is what the project shows now; the rest are the decisions it replaced (for example a
// rejection that a different mentor later turned into an approval).
export function ReviewHistory({ projectId }: { projectId: string }) {
  const { data, error, isLoading, refetch } = useGetProjectHistoryQuery(projectId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading history">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-40" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <p className="text-sm text-destructive">
        {getErrorMessage(error)}{" "}
        <Button variant="link" size="xs" className="h-auto p-0" onClick={refetch}>
          Try again
        </Button>
      </p>
    );
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No decision has been made yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-4" aria-label="Decisions, newest first">
      {data.map((entry, index) => (
        <li key={entry.id} className="flex flex-col gap-1.5" data-slot="history-entry">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge status={entry.status} />
            <span>
              {entry.status === "PENDING" ? "reopened by" : "by"}{" "}
              <span className="font-medium">{entry.reviewer.name}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              <RelativeTime iso={entry.createdAt} />
            </span>
            {index === 0 && data.length > 1 && (
              <span className="text-xs font-medium text-muted-foreground">(latest)</span>
            )}
          </div>
          {entry.note && <ReviewNote note={entry.note} status={entry.status} />}
        </li>
      ))}
    </ol>
  );
}
