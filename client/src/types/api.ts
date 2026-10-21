// Shapes of what the Express API sends and receives. They mirror the backend modules
// (Auth, Project, User). Dates arrive as ISO strings because they travel as JSON.

/* ---------- Enums ---------- */

export const ROLES = ["STUDENT", "MENTOR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

// How a role is written for people ("MENTOR" is for the code, "Mentor" for the screen).
export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Student",
  MENTOR: "Mentor",
  ADMIN: "Admin",
};

export const PROJECT_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/* ---------- Response envelopes ---------- */

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Every successful response looks like this.
export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: ApiMeta;
}

// Lists always carry `meta` for pagination.
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ApiMeta;
}

// One field-level problem. `path` is the form field ("" when it is not about a field).
export interface ApiErrorSource {
  path: string;
  message: string;
}

// Every failed response looks like this.
export interface ApiErrorBody {
  success: false;
  message: string;
  errorSources: ApiErrorSource[];
}

/* ---------- Entities ---------- */

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

// A mentor is a User whose role is MENTOR.
export type Mentor = User;

// A project as a student sees it.
export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
  status: ProjectStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

// A project as a mentor / admin sees it: plus who submitted and who reviewed it.
export interface ReviewableProject extends Project {
  student: Pick<User, "id" | "name" | "email">;
  reviewer: Pick<User, "id" | "name"> | null;
}

export interface ProjectStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

/* ---------- Request payloads ---------- */

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CreateProjectPayload {
  name: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
}

export interface ReviewProjectPayload {
  status: Exclude<ProjectStatus, "PENDING">;
  note?: string;
}

export interface CreateMentorPayload {
  name: string;
  email: string;
  password: string;
}

/* ---------- Query parameters ---------- */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export type ProjectSortBy = "createdAt" | "name" | "status";

// `status: "ALL"` (or leaving it out) means no status filter.
export interface ProjectListParams extends PaginationParams {
  status?: ProjectStatus | "ALL";
  search?: string;
  sortBy?: ProjectSortBy;
  sortOrder?: "asc" | "desc";
}
