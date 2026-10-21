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
  CreateMentorPayload,
  Mentor,
  PaginatedResponse,
  PaginationParams,
  Student,
  StudentListParams,
  User,
} from "@/types/api";

// Mentor management. Every endpoint here is admin only on the server.
export const userApi = baseApi.injectEndpoints({
  overrideExisting: OVERRIDE_ON_HOT_RELOAD,
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

    // Students sign themselves up; the admin can only look at them and switch an account off or on.
    getStudents: build.query<Page<Student>, StudentListParams | void>({
      query: (params) => ({ url: "/users/students", params: params ?? undefined }),
      transformResponse: (response: PaginatedResponse<Student>) => unwrapPage(response),
      providesTags: ["Student"],
    }),

    setStudentActive: build.mutation<User, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/users/students/${id}/active`,
        method: "PATCH",
        body: { isActive },
      }),
      transformResponse: (response: ApiResponse<User>) => unwrap(response),
      invalidatesTags: invalidateOnSuccess("Student"),
    }),

    setMentorActive: build.mutation<User, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/users/mentors/${id}/active`,
        method: "PATCH",
        body: { isActive },
      }),
      transformResponse: (response: ApiResponse<User>) => unwrap(response),
      invalidatesTags: invalidateOnSuccess("Mentor"),
    }),
  }),
});

export const {
  useGetMentorsQuery,
  useCreateMentorMutation,
  useSetMentorActiveMutation,
  useGetStudentsQuery,
  useSetStudentActiveMutation,
} = userApi;
