import Link from "next/link";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

// The student's top bar: product name on the left, theme button and account menu on the right.
// There is only one student page, so there are no navigation links.
export function StudentNavbar() {
  return (
    // The bar is a box inside the same column as the page content (max-w-6xl with the same side
    // padding), so its edges line up with the cards below it. The strip around it stays clear.
    <header className="sticky top-0 z-40 px-4 pt-3 sm:px-6">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 rounded-xl border bg-background/80 px-4 shadow-xs backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link href="/student" className="font-heading text-lg font-semibold">
          Project Review
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
