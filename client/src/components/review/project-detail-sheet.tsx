"use client";

import { Lock } from "lucide-react";

import { ExternalLinkItem } from "@/components/common/external-link";
import { RelativeTime } from "@/components/common/relative-time";
import { StatusBadge } from "@/components/common/status-badge";
import { ClaimTimeLeft } from "@/components/review/claim-time-left";
import { ReviewButtons } from "@/components/review/review-buttons";
import type { ReviewControls } from "@/components/review/review-controls";
import { ReviewHistory } from "@/components/review/review-history";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ReviewableProject } from "@/types/api";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

// Everything about one project in a panel from the right: the full description and links that
// the table row has no room for, who is reviewing it, and every decision made on it. The
// decision buttons are here too, so a decision can be made after reading it all.
export function ProjectDetailSheet({
  project,
  onClose,
  controls,
}: {
  project: ReviewableProject | null;
  onClose: () => void;
  controls: ReviewControls;
}) {
  // Deciding closes the panel first, so a confirmation or the reject dialog never opens on top
  // of it; the toast tells how it went.
  const decide = (action: (project: ReviewableProject) => void) => (target: ReviewableProject) => {
    onClose();
    action(target);
  };

  const sheetControls: ReviewControls = {
    ...controls,
    approve: decide(controls.approve),
    reject: decide(controls.reject),
    reopen: decide(controls.reopen),
  };

  return (
    <Sheet open={!!project} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        {project && (
          <>
            <SheetHeader className="gap-2 pr-10">
              <SheetTitle className="break-words">{project.name}</SheetTitle>
              <SheetDescription asChild>
                <div className="flex items-center gap-2">
                  <StatusBadge status={project.status} />
                  <span>
                    <RelativeTime iso={project.createdAt} prefix="Submitted" />
                  </span>
                </div>
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-4 pb-4">
              <Separator />

              {project.claimedBy && project.claimedAt && project.claimExpiresAt && (
                <p
                  className="flex items-center gap-1.5 rounded-md bg-status-pending-soft px-3 py-2 text-sm text-status-pending-foreground"
                  data-slot="claim-banner"
                >
                  <Lock className="size-4 shrink-0" aria-hidden />
                  <span>
                    {project.claimedBy.id === controls.currentUserId ? "You are" : `${project.claimedBy.name} is`}{" "}
                    reviewing this, <RelativeTime iso={project.claimedAt} />.{" "}
                    <ClaimTimeLeft expiresAt={project.claimExpiresAt} />
                    {project.claimedBy.id !== controls.currentUserId && !controls.isAdmin && (
                      <> Approve and Reject are locked until they finish or it runs out.</>
                    )}
                  </span>
                </p>
              )}

              <Section title="Student">
                <p className="text-sm">
                  {project.student.name}
                  <span className="block text-muted-foreground">{project.student.email}</span>
                </p>
              </Section>

              <Section title="Links">
                <div className="flex flex-col gap-1 text-sm">
                  <ExternalLinkItem href={project.repoUrl} label={project.repoUrl} className="break-all" />
                  <ExternalLinkItem href={project.liveUrl} label={project.liveUrl} className="break-all" />
                </div>
              </Section>

              <Section title="Description">
                <p className="text-sm break-words whitespace-pre-line">{project.description}</p>
              </Section>

              <Section title="Decisions">
                <ReviewHistory projectId={project.id} />
              </Section>

              <Separator />

              <ReviewButtons project={project} controls={sheetControls} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
