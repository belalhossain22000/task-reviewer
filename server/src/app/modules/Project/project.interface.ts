import { ProjectStatus } from "@prisma/client";

export interface ICreateProjectPayload {
  name: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
}

export interface IPaginationQuery {
  page: number;
  limit: number;
}

// Project as the API returns it to a student. The duplicate-detection keys stay internal.
export interface IProject {
  id: string;
  name: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
  status: ProjectStatus;
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

export interface IPaginatedResult<T> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: T[];
}

// Mentor / admin view: the same project plus who submitted and who reviewed it.
export interface IReviewableProject extends IProject {
  student: { id: string; name: string; email: string };
  reviewer: { id: string; name: string } | null;
  // Who is currently reviewing it. Only set while the claim is still valid (see CLAIM_TTL_MINUTES).
  claimedBy: { id: string; name: string } | null;
  claimedAt: Date | null;
  // When the claim runs out (claimedAt + CLAIM_TTL_MINUTES); null when there is no valid claim.
  claimExpiresAt: Date | null;
}

// A student's own list: paging plus optional filters.
export interface IMyProjectsQuery extends IPaginationQuery {
  status?: ProjectStatus;
  search?: string;
}

export interface IProjectListQuery extends IPaginationQuery {
  status?: ProjectStatus;
  search?: string;
  // Only projects whose latest decision was made by this person.
  reviewerId?: string;
  // "mine" = taken by `viewerId`; "none" = pending and not taken by anyone.
  claim?: "mine" | "none";
  viewerId?: string;
  sortBy: "createdAt" | "name" | "status";
  sortOrder: "asc" | "desc";
}

export interface IReviewPayload {
  status: "APPROVED" | "REJECTED";
  note?: string;
}

// One decision in a project's history.
export interface IReviewEntry {
  id: string;
  status: ProjectStatus;
  note: string | null;
  createdAt: Date;
  reviewer: { id: string; name: string };
}

export interface IProjectStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}
