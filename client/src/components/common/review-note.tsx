import { MessageSquareText } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/api";

// The mentor's written reason for a decision. For a rejection it is the most important thing
// on the screen, so it takes the rejected colours; an approval note is quieter.
export function ReviewNote({ note, status }: { note: string; status: ProjectStatus }) {
  return (
    <div
      className={cn(
        "flex gap-2 rounded-md px-3 py-2 text-sm",
        status === "REJECTED"
          ? "bg-status-rejected-soft text-status-rejected-foreground"
          : "bg-muted text-foreground"
      )}
    >
      <MessageSquareText className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs font-medium opacity-80">Mentor&apos;s note</p>
        <p className="break-words whitespace-pre-line">{note}</p>
      </div>
    </div>
  );
}
