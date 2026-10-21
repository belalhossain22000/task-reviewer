"use client";

import { useState } from "react";

import { ExternalLinkItem } from "@/components/common/external-link";
import { RelativeTime } from "@/components/common/relative-time";
import { ReviewNote } from "@/components/common/review-note";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { displayUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/api";

// Longer than this and the description is folded to a few lines with a "Show more" button.
const LONG_DESCRIPTION = 180;

export function ProjectCard({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = project.description.length > LONG_DESCRIPTION;

  return (
    <li className="flex flex-col gap-3 rounded-lg border p-4" data-slot="project-card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-heading min-w-0 font-medium break-words">{project.name}</h3>
        <StatusBadge status={project.status} />
      </div>

      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:gap-4">
        <ExternalLinkItem href={project.repoUrl} label={displayUrl(project.repoUrl)} />
        <ExternalLinkItem href={project.liveUrl} label={displayUrl(project.liveUrl)} />
      </div>

      <div className="flex flex-col items-start gap-1">
        <p
          className={cn(
            "text-sm break-words whitespace-pre-line text-muted-foreground",
            isLong && !expanded && "line-clamp-3"
          )}
        >
          {project.description}
        </p>
        {isLong && (
          <Button
            variant="link"
            size="xs"
            className="h-auto p-0"
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "Show less" : "Show more"}
          </Button>
        )}
      </div>

      {project.reviewNote && <ReviewNote note={project.reviewNote} status={project.status} />}

      <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
        <RelativeTime iso={project.createdAt} prefix="Submitted" />
        {project.reviewedAt && <RelativeTime iso={project.reviewedAt} prefix="Reviewed" />}
      </p>
    </li>
  );
}
