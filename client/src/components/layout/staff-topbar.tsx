"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { StaffBrand } from "@/components/layout/staff-brand";
import { StaffNav } from "@/components/layout/staff-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// The bar across the top of the staff pages. On a phone it also holds the menu button that
// opens the sidebar as a sheet.
export function StaffTopbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    // Spans the whole column next to the sidebar, with the same side padding as the page content
    // below it, so the avatar lines up with the right edge of the content.
    <header className="sticky top-0 z-40 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <div className="flex h-14 w-full items-center justify-between gap-2">
        <div className="md:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 gap-6 p-4">
              {/* Required by the dialog behind the sheet so screen readers can name it. */}
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">Pages you can open</SheetDescription>
              <StaffBrand onNavigate={() => setMenuOpen(false)} />
              <StaffNav onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
