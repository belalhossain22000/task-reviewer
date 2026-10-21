import {
  baseApi,
  invalidateOnSuccess,
  OVERRIDE_ON_HOT_RELOAD,
  unwrap,
  unwrapPage,
  type Page,
} from "@/lib/store/base-api";
import type {
  ApiResponse,
  CreateProjectPayload,
  PaginatedResponse,
  PaginationParams,
  Project,
  ProjectListParams,
  ProjectStats,
  ReviewableProject,
  ReviewEntry,
  ReviewProjectPayload,
} from "@/types/api";

export const projectApi = baseApi.injectEndpoints({
  overrideExisting: OVERRIDE_ON_HOT_RELOAD,
  endpoints: (build) => ({
    /* ----- Student ----- */

    submitProject: build.mutation<Project, CreateProjectPayload>({
      query: (body) => ({ url: "/projects", method: "POST", body }),
      transformResponse: (response: ApiResponse<Project>) => unwrap(response),
      // The student's own list has a new row.
      invalidatesTags: invalidateOnSuccess("MyProject"),
    }),

    getMyProjects: build.query<Page<Project>, PaginationParams | void>({
      query: (params) => ({ url: "/projects/mine", params: params ?? undefined }),
      transformResponse: (response: PaginatedResponse<Project>) =>
        unwrapPage(response),
      providesTags: ["MyProject"],
    }),

    /* ----- Mentor / admin ----- */

    // Filtering, search, sorting and pagination all happen on the server;
    // changing any param is simply a different cache entry.
    getProjects: build.query<Page<ReviewableProject>, ProjectListParams | void>({
      query: (params) => ({ url: "/projects", params: params ?? undefined }),
      transformResponse: (response: PaginatedResponse<ReviewableProject>) =>
        unwrapPage(response),
      providesTags: ["Project"],
    }),

    // All decisions on one project, newest first.
    getProjectHistory: build.query<ReviewEntry[], string>({
      query: (id) => `/projects/${id}/history`,
      transformResponse: (response: ApiResponse<ReviewEntry[]>) => unwrap(response),
      providesTags: ["History"],
    }),

    getProjectStats: build.query<ProjectStats, void>({
      query: () => "/projects/stats",
      transformResponse: (response: ApiResponse<ProjectStats>) => unwrap(response),
      providesTags: ["Stats"],
    }),

    // "I'm reviewing this": take a pending project so others see it is being looked at, or give
    // it back. These invalidate even when they FAIL (e.g. someone else took it first), because
    // then our list is out of date and has to be refreshed to show who has it.
    claimProject: build.mutation<ReviewableProject, string>({
      query: (id) => ({ url: `/projects/${id}/claim`, method: "POST" }),
      transformResponse: (response: ApiResponse<ReviewableProject>) => unwrap(response),
      invalidatesTags: ["Project"],
    }),

    releaseProject: build.mutation<ReviewableProject, string>({
      query: (id) => ({ url: `/projects/${id}/claim`, method: "DELETE" }),
      transformResponse: (response: ApiResponse<ReviewableProject>) => unwrap(response),
      invalidatesTags: ["Project"],
    }),

    // Admin only: put an approved or rejected project back in the queue.
    reopenProject: build.mutation<ReviewableProject, string>({
      query: (id) => ({ url: `/projects/${id}/reopen`, method: "PATCH" }),
      transformResponse: (response: ApiResponse<ReviewableProject>) => unwrap(response),
      invalidatesTags: invalidateOnSuccess("Project", "Stats", "History", "Mentor"),
    }),

    reviewProject: build.mutation<
      ReviewableProject,
      { id: string } & ReviewProjectPayload
    >({
      query: ({ id, ...body }) => ({
        url: `/projects/${id}/review`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiResponse<ReviewableProject>) =>
        unwrap(response),
      // A decision changes the table (the row may leave the current filter), the
      // Pending / Approved / Rejected counts, a project's history, and a mentor's review count.
      // When it FAILS, the likely reason is that somebody took the project meanwhile, so the table
      // is refreshed to show who has it.
      invalidatesTags: (_result, error) =>
        error ? ["Project"] : ["Project", "Stats", "History", "Mentor"],
    }),
  }),
});

export const {
  useSubmitProjectMutation,
  useGetMyProjectsQuery,
  useGetProjectsQuery,
  useGetProjectStatsQuery,
  useGetProjectHistoryQuery,
  useClaimProjectMutation,
  useReleaseProjectMutation,
  useReviewProjectMutation,
  useReopenProjectMutation,
} = projectApi;
