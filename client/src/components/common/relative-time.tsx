"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime, formatRelativeTime } from "@/lib/format";

// "3 days ago" you can read at a glance; hover for the exact moment. `prefix` is an optional
// word in front ("Submitted 3 days ago").
export function RelativeTime({ iso, prefix }: { iso: string; prefix?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time dateTime={iso} className="cursor-default">
          {prefix && `${prefix} `}
          {formatRelativeTime(iso)}
        </time>
      </TooltipTrigger>
      <TooltipContent>{formatDateTime(iso)}</TooltipContent>
    </Tooltip>
  );
}
