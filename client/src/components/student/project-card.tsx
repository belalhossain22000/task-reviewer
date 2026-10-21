"use client";

import { ExternalLink, MessageSquareText } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { displayUrl, formatDateTime, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/api";

// Longer than this and the description is folded to a few lines with a "Show more" button.
const LONG_DESCRIPTION = 180;

function ExternalLinkItem({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-link hover:underline"
    >
      <span className="truncate">{label}</span>
      <ExternalLink className="size-3 shrink-0" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

// Relative time ("2 days ago") you can read at a glance; hover for the exact moment.
function Time({ iso, prefix }: { iso: string; prefix: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time dateTime={iso} className="cursor-default">
          {prefix} {formatRelativeTime(iso)}
        </time>
      </TooltipTrigger>
      <TooltipContent>{formatDateTime(iso)}</TooltipContent>
    </Tooltip>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = project.description.length > LONG_DESCRIPTION;
  const hasNote = !!project.reviewNote;

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

      {/* The mentor's reason. For a rejection this is the most important thing on the card. */}
      {hasNote && (
        <div
          className={cn(
            "flex gap-2 rounded-md px-3 py-2 text-sm",
            project.status === "REJECTED"
              ? "bg-status-rejected-soft text-status-rejected-foreground"
              : "bg-muted text-foreground"
          )}
        >
          <MessageSquareText className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-medium opacity-80">Mentor&apos;s note</p>
            <p className="break-words whitespace-pre-line">{project.reviewNote}</p>
          </div>
        </div>
      )}

      <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
        <Time iso={project.createdAt} prefix="Submitted" />
        {project.reviewedAt && <Time iso={project.reviewedAt} prefix="Reviewed" />}
      </p>
    </li>
  );
}
