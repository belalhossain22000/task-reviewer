import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/providers/auth-provider";
import { StoreProvider } from "@/providers/store-provider";
import { ThemeProvider } from "@/providers/theme-provider";

// One font for the whole app. `variable` exposes it as --font-sans, which globals.css
// maps to Tailwind's `font-sans`.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Project Review",
    template: "%s | Project Review",
  },
  description: "Submit your project and get it reviewed by a mentor.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: next-themes adds the `dark` class to <html> before React
    // loads, so server and browser markup differ on purpose. It only silences this one tag.
    <html lang="en" suppressHydrationWarning className={cn(inter.variable, "antialiased")}>
      <body className="min-h-dvh">
        {/* Order matters: the store comes before AuthProvider (it uses RTK Query), and the
            theme comes before the Toaster (it reads the current theme). */}
        <ThemeProvider>
          <StoreProvider>
            <AuthProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </AuthProvider>
          </StoreProvider>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
