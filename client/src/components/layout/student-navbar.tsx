import Link from "next/link";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";

// The student's top bar. The two links jump to sections of the one student page.
export function StudentNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/student" className="font-heading text-lg font-semibold">
          Project Review
        </Link>

        {/* Hidden on phones: the page is one column there, so scrolling is enough. */}
        <nav aria-label="Sections" className="hidden items-center gap-1 sm:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="#submit">Submit</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="#my-submissions">My submissions</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
