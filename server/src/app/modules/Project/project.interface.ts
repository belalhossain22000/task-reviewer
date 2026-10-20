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
