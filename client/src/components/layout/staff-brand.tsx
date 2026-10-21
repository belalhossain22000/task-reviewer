"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";
import { ROLE_LABELS } from "@/types/api";

// Product name with the role underneath ("Mentor" / "Admin"), so staff always see which
// hat they are wearing. Sits at the top of the sidebar, on desktop and in the phone sheet
// (where `onNavigate` closes the sheet when the name is chosen).
export function StaffBrand({ onNavigate }: { onNavigate?: () => void }) {
  const { role } = useAuth();

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Link href="/review" onClick={onNavigate} className="font-heading text-lg font-semibold">
        Project Review
      </Link>
      {role && <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>}
    </div>
  );
}
