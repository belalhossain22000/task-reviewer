import { configureStore } from "@reduxjs/toolkit";

import { baseApi } from "./base-api";

// A function, not a ready-made store: with the Next.js App Router the server renders for
// many users, so each request/tab must get its own store and never share one.
export const makeStore = () =>
  configureStore({
    reducer: {
      // The only state in the store is RTK Query's cache. Filters and pagination
      // live in the URL, not here.
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
