"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// Dark mode works by putting a `dark` class on <html> (see the `.dark` block in globals.css).
// The theme settings live here once, so the root layout just wraps the app in <ThemeProvider>.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
