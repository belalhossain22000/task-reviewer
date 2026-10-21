"use client";

import { Lock } from "lucide-react";

import { ExternalLinkItem } from "@/components/common/external-link";
import { RelativeTime } from "@/components/common/relative-time";
import { StatusBadge } from "@/components/common/status-badge";
import { ClaimTimeLeft } from "@/components/review/claim-time-left";
import { ReviewButtons } from "@/components/review/review-buttons";
import type { ReviewControls } from "@/components/review/review-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ReviewableProject } from "@/types/api";

interface ProjectsTableProps {
  projects: ReviewableProject[];
  controls: ReviewControls;
  onOpen: (project: ReviewableProject) => void;
  // True while another page or filter is loading: the old rows stay, faded.
  isFetching: boolean;
}

// The "Reviewer" cell. Once a project is decided: who made the latest decision and when. While
// it is pending: who is reviewing it right now (a lock), or "-" if nobody.
function ReviewerCell({ project, controls }: { project: ReviewableProject; controls: ReviewControls }) {
  if (project.reviewer && project.reviewedAt) {
    return (
      <div className="flex flex-col">
        <span className="truncate">{project.reviewer.name}</span>
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          <RelativeTime iso={project.reviewedAt} />
        </span>
      </div>
    );
  }

  if (project.claimedBy && project.claimedAt && project.claimExpiresAt) {
    const mine = project.claimedBy.id === controls.currentUserId;

    return (
      <div className="flex flex-col" data-claimed-by={project.claimedBy.id}>
        <span className="flex items-center gap-1 truncate">
          <Lock className="size-3 shrink-0 text-status-pending" aria-hidden />
          {mine ? "You" : project.claimedBy.name}
        </span>
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          reviewing, <RelativeTime iso={project.claimedAt} />
        </span>
        <span className="text-xs text-muted-foreground">
          <ClaimTimeLeft expiresAt={project.claimExpiresAt} />
        </span>
      </div>
    );
  }

  return <span className="text-muted-foreground">-</span>;
}

// The same list in two shapes: a real table from `md` up, and one card per project on a phone,
// where six columns would not fit. Both are always in the page; CSS shows the right one.
export function ProjectsTable({ projects, controls, onOpen, isFetching }: ProjectsTableProps) {
  return (
    <div className={cn("transition-opacity", isFetching && "opacity-60")}>
      <div className="hidden rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="max-w-64 whitespace-normal">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => onOpen(project)}
                      className="text-left font-medium break-words hover:underline"
                    >
                      {project.name}
                    </button>
                    <span className="flex gap-3 text-xs">
                      <ExternalLinkItem href={project.repoUrl} label="Repo" />
                      <ExternalLinkItem href={project.liveUrl} label="Live" />
                    </span>
                  </div>
                </TableCell>
                <TableCell className="max-w-56">
                  <div className="flex flex-col">
                    <span className="truncate">{project.student.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{project.student.email}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                  <RelativeTime iso={project.createdAt} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={project.status} />
                </TableCell>
                <TableCell className="max-w-44 text-sm">
                  <ReviewerCell project={project} controls={controls} />
                </TableCell>
                <TableCell>
                  <ReviewButtons project={project} controls={controls} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {projects.map((project) => {
          const mine = project.claimedBy?.id === controls.currentUserId;

          return (
            <li key={project.id} className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onOpen(project)}
                  className="min-w-0 text-left font-medium break-words hover:underline"
                >
                  {project.name}
                </button>
                <StatusBadge status={project.status} />
              </div>
              <p className="flex flex-col text-sm">
                <span>{project.student.name}</span>
                <span className="truncate text-xs text-muted-foreground">{project.student.email}</span>
              </p>
              <span className="flex gap-4 text-sm">
                <ExternalLinkItem href={project.repoUrl} label="Repo" />
                <ExternalLinkItem href={project.liveUrl} label="Live" />
              </span>
              <p className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                <RelativeTime iso={project.createdAt} prefix="Submitted" />
                {project.reviewer && project.reviewedAt && (
                  <span>
                    Reviewed by {project.reviewer.name} <RelativeTime iso={project.reviewedAt} />
                  </span>
                )}
                {!project.reviewer && project.claimedBy && project.claimedAt && project.claimExpiresAt && (
                  <span className="flex items-center gap-1">
                    <Lock className="size-3 text-status-pending" aria-hidden />
                    {mine ? "You are" : `${project.claimedBy.name} is`} reviewing,{" "}
                    <RelativeTime iso={project.claimedAt} /> (<ClaimTimeLeft expiresAt={project.claimExpiresAt} />)
                  </span>
                )}
              </p>
              <ReviewButtons project={project} controls={controls} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Grey placeholders in the shape of the rows, while the first page loads.
export function ProjectsTableSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading projects">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
