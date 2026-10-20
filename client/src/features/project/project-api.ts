import {
  baseApi,
  invalidateOnSuccess,
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
  ReviewProjectPayload,
} from "@/types/api";

export const projectApi = baseApi.injectEndpoints({
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

    getProjectStats: build.query<ProjectStats, void>({
      query: () => "/projects/stats",
      transformResponse: (response: ApiResponse<ProjectStats>) => unwrap(response),
      providesTags: ["Stats"],
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
      // A decision changes the table (the row may leave the current filter)
      // and the Pending / Approved / Rejected counts.
      invalidatesTags: invalidateOnSuccess("Project", "Stats"),
    }),
  }),
});

export const {
  useSubmitProjectMutation,
  useGetMyProjectsQuery,
  useGetProjectsQuery,
  useGetProjectStatsQuery,
  useReviewProjectMutation,
} = projectApi;
