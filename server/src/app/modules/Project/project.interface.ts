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
}

export interface IProjectListQuery extends IPaginationQuery {
  status?: ProjectStatus;
  search?: string;
  sortBy: "createdAt" | "name" | "status";
  sortOrder: "asc" | "desc";
}

export interface IReviewPayload {
  status: "APPROVED" | "REJECTED";
  note?: string;
}

export interface IProjectStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}
