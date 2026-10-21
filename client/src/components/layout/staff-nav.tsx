"use client";

import { ClipboardCheck, GraduationCap, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import type { Role } from "@/types/api";

// The links of the staff area. To add a page, add a row; `roles` decides who sees the link.
const NAV_ITEMS: { href: string; label: string; icon: LucideIcon; roles: Role[] }[] = [
  { href: "/review", label: "Review", icon: ClipboardCheck, roles: ["MENTOR", "ADMIN"] },
  { href: "/admin/students", label: "Students", icon: GraduationCap, roles: ["ADMIN"] },
  { href: "/admin/mentors", label: "Mentors", icon: Users, roles: ["ADMIN"] },
];

// Used twice: in the desktop sidebar, and inside the sheet that slides in on a phone.
// `onNavigate` lets the sheet close itself when a link is chosen.
export function StaffNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role } = useAuth();

  const items = NAV_ITEMS.filter((item) => role && item.roles.includes(role));

  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              isActive && "bg-secondary font-medium text-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
