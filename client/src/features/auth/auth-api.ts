import { baseApi, invalidateOnSuccess, OVERRIDE_ON_HOT_RELOAD, TAG_TYPES, unwrap } from "@/lib/store/base-api";
import type {
  ApiResponse,
  LoginPayload,
  SignupPayload,
  User,
} from "@/types/api";

export const authApi = baseApi.injectEndpoints({
  overrideExisting: OVERRIDE_ON_HOT_RELOAD,
  endpoints: (build) => ({
    // Who is logged in? This is the single source of truth for "am I logged in".
    // A 401 here just means "nobody", and the AuthProvider treats it that way.
    getMe: build.query<User, void>({
      query: () => "/auth/me",
      transformResponse: (response: ApiResponse<User>) => unwrap(response),
      providesTags: ["Me"],
    }),

    login: build.mutation<User, LoginPayload>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (response: ApiResponse<User>) => unwrap(response),
      // A new session starts: refetch getMe with the new cookie, and mark everything else
      // stale so nothing cached for the previous user can show up for this one.
      invalidatesTags: invalidateOnSuccess(...TAG_TYPES),
    }),

    signup: build.mutation<User, SignupPayload>({
      query: (body) => ({ url: "/auth/signup", method: "POST", body }),
      transformResponse: (response: ApiResponse<User>) => unwrap(response),
      invalidatesTags: invalidateOnSuccess(...TAG_TYPES),
    }),

    logout: build.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      transformResponse: () => undefined,
      // Only after the server really cleared the cookie: drop every cached result,
      // so the next user on this browser can't see the previous user's data.
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(baseApi.util.resetApiState());
        } catch {
          // The caller shows the error; the user stays logged in.
        }
      },
    }),
  }),
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useSignupMutation,
  useLogoutMutation,
} = authApi;
