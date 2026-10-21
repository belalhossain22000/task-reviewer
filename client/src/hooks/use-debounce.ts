"use client";

import { useEffect, useState } from "react";

// Returns `value`, but only after it has stopped changing for `delay` ms. Used for the search
// box: the table should not reload on every keystroke, only when the typing pauses.
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
