"use client";

import { setupListeners } from "@reduxjs/toolkit/query";
import { useEffect, useState } from "react";
import { Provider } from "react-redux";

import { makeStore } from "@/lib/store/store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // The initializer runs once per mounted provider, so the store is created once
  // and survives re-renders.
  const [store] = useState(makeStore);

  // Turns on refetchOnFocus / refetchOnReconnect (set in base-api.ts).
  useEffect(() => setupListeners(store.dispatch), [store]);

  return <Provider store={store}>{children}</Provider>;
}
