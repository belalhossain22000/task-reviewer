"use client";

import { Check, Hand, LockOpen, RotateCcw, X } from "lucide-react";

import type { ReviewControls } from "@/components/review/review-controls";
import { Button } from "@/components/ui/button";
import type { ReviewableProject } from "@/types/api";

// The buttons for one project.
//  - Pending and nobody has it: "Take" (I'm reviewing this).
//  - Pending and I have it: "Release". An admin also gets "Release" on someone else's.
//  - Decided and I'm an admin: "Reopen" puts it back in the queue (asks first).
//  - Approve / Reject: a decision can be changed later, so an approved project still offers
//    Reject and a rejected one still offers Approve; only the button for its current status is
//    left out. If somebody ELSE has taken the project, a mentor can't decide at all (the buttons are
//    disabled); an admin is asked first.
export function ReviewButtons({
  project,
  controls,
}: {
  project: ReviewableProject;
  controls: ReviewControls;
}) {
  const busy = controls.busyId === project.id;
  const isPending = project.status === "PENDING";
  const heldByMe = !!project.claimedBy && project.claimedBy.id === controls.currentUserId;
  const heldByOther = !!project.claimedBy && !heldByMe;
  // A mentor can't decide on a project somebody else has taken (the API refuses too). An admin can,
  // after being asked; see the dashboard.
  const locked = heldByOther && !controls.isAdmin;
  const lockedTitle = locked ? `${project.claimedBy?.name} is reviewing this` : undefined;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {isPending && !project.claimedBy && (
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => controls.take(project)}
          title="Let others know you are reviewing this"
        >
          <Hand />
          Take
          <span className="sr-only"> {project.name}</span>
        </Button>
      )}
      {isPending && (heldByMe || (heldByOther && controls.isAdmin)) && (
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => controls.release(project)}
          title={heldByMe ? "Give it back to the queue" : "Take it away from the person reviewing it"}
        >
          <LockOpen />
          Release
          <span className="sr-only"> {project.name}</span>
        </Button>
      )}
      {!isPending && controls.isAdmin && (
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => controls.reopen(project)}
          title="Put it back in the pending queue"
        >
          <RotateCcw />
          Reopen
          <span className="sr-only"> {project.name}</span>
        </Button>
      )}
      {project.status !== "APPROVED" && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy || locked}
          title={lockedTitle}
          onClick={() => controls.approve(project)}
        >
          <Check />
          Approve
          <span className="sr-only"> {project.name}</span>
        </Button>
      )}
      {project.status !== "REJECTED" && (
        <Button
          size="sm"
          variant="destructive"
          disabled={busy || locked}
          title={lockedTitle}
          onClick={() => controls.reject(project)}
        >
          <X />
          Reject
          <span className="sr-only"> {project.name}</span>
        </Button>
      )}
    </div>
  );
}
