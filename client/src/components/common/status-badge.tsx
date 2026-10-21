import { CircleCheck, CircleX, Clock, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/api";

// The one place that decides how a project status looks. Every list, table and detail view
// uses this, so Pending / Approved / Rejected always have the same colour and icon.
// Status is shown as icon + text, never colour alone (readable for colour-blind users).
// The class names are written out in full on purpose: Tailwind only generates classes it can
// find as whole strings in the source.
const STATUS_STYLE: Record<
  ProjectStatus,
  { label: string; icon: LucideIcon; badge: string; iconColor: string }
> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    badge: "bg-status-pending-soft text-status-pending-foreground",
    iconColor: "text-status-pending",
  },
  APPROVED: {
    label: "Approved",
    icon: CircleCheck,
    badge: "bg-status-approved-soft text-status-approved-foreground",
    iconColor: "text-status-approved",
  },
  REJECTED: {
    label: "Rejected",
    icon: CircleX,
    badge: "bg-status-rejected-soft text-status-rejected-foreground",
    iconColor: "text-status-rejected",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const { label, icon: Icon, badge, iconColor } = STATUS_STYLE[status];

  return (
    <Badge variant="secondary" data-status={status} className={cn(badge, className)}>
      <Icon className={iconColor} aria-hidden />
      {label}
    </Badge>
  );
}
