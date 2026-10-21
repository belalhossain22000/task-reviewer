"use client";

import { toast } from "sonner";

import {
  useClaimProjectMutation,
  useReleaseProjectMutation,
  useReopenProjectMutation,
  useReviewProjectMutation,
} from "@/features/project/project-api";
import { getErrorMessage } from "@/lib/api-error";
import type { ReviewableProject } from "@/types/api";

// Approve and reject, with their toasts, in one place. The table row, the phone card and the
// detail sheet all use these, so they behave the same everywhere.
// After either one succeeds, RTK Query marks the table and the counts stale and they reload
// by themselves (see project-api.ts).
export function useReviewActions() {
  const [reviewProject, review] = useReviewProjectMutation();
  const [claimProject, claim] = useClaimProjectMutation();
  const [releaseProject, release] = useReleaseProjectMutation();
  const [reopenProject, reopen] = useReopenProjectMutation();

  // The project being worked on right now, so only its buttons are disabled.
  const busyId =
    (review.isLoading && review.originalArgs?.id) ||
    (claim.isLoading && claim.originalArgs) ||
    (release.isLoading && release.originalArgs) ||
    (reopen.isLoading && reopen.originalArgs) ||
    undefined;

  // Resolves true on success. A failure is shown as a toast and resolves false.
  const approve = async (project: ReviewableProject) => {
    try {
      await reviewProject({ id: project.id, status: "APPROVED" }).unwrap();
      toast.success(`Approved "${project.name}"`);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  // Throws on failure instead: the reject dialog shows the problem next to its note field.
  const reject = async (project: ReviewableProject, note: string) => {
    await reviewProject({ id: project.id, status: "REJECTED", note }).unwrap();
    toast.success(`Rejected "${project.name}"`);
  };

  // "I'm reviewing this". A failure (usually "someone else took it first") is a toast; the list
  // refreshes by itself and then shows who has it.
  const take = async (project: ReviewableProject) => {
    try {
      await claimProject(project.id).unwrap();
      toast.success(`You are reviewing "${project.name}"`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const giveBack = async (project: ReviewableProject) => {
    try {
      await releaseProject(project.id).unwrap();
      toast.success(`Released "${project.name}"`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const reopenIt = async (project: ReviewableProject) => {
    try {
      await reopenProject(project.id).unwrap();
      toast.success(`"${project.name}" is pending again`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return { approve, reject, take, release: giveBack, reopen: reopenIt, busyId };
}

export type ReviewActions = ReturnType<typeof useReviewActions>;
