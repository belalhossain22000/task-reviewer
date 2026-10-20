import {
  baseApi,
  invalidateOnSuccess,
  unwrap,
  unwrapPage,
  type Page,
} from "@/lib/store/base-api";
import type {
  ApiResponse,
  CreateMentorPayload,
  Mentor,
  PaginatedResponse,
  PaginationParams,
} from "@/types/api";

// Mentor management. Every endpoint here is admin only on the server.
export const userApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMentors: build.query<Page<Mentor>, PaginationParams | void>({
      query: (params) => ({ url: "/users/mentors", params: params ?? undefined }),
      transformResponse: (response: PaginatedResponse<Mentor>) =>
        unwrapPage(response),
      providesTags: ["Mentor"],
    }),

    createMentor: build.mutation<Mentor, CreateMentorPayload>({
      query: (body) => ({ url: "/users/mentors", method: "POST", body }),
      transformResponse: (response: ApiResponse<Mentor>) => unwrap(response),
      invalidatesTags: invalidateOnSuccess("Mentor"),
    }),

    setMentorActive: build.mutation<Mentor, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/users/mentors/${id}/active`,
        method: "PATCH",
        body: { isActive },
      }),
      transformResponse: (response: ApiResponse<Mentor>) => unwrap(response),
      invalidatesTags: invalidateOnSuccess("Mentor"),
    }),
  }),
});

export const {
  useGetMentorsQuery,
  useCreateMentorMutation,
  useSetMentorActiveMutation,
} = userApi;
