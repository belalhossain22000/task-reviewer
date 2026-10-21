"use client";

import { CircleCheck, CircleX, Clock, Layers, type LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { StatusFilter } from "@/hooks/use-review-filters";
import { cn } from "@/lib/utils";
import type { ProjectStats } from "@/types/api";

const CARDS: { filter: StatusFilter; label: string; value: keyof ProjectStats; icon: LucideIcon; iconColor: string }[] = [
  { filter: "ALL", label: "Total", value: "total", icon: Layers, iconColor: "text-muted-foreground" },
  { filter: "PENDING", label: "Pending", value: "pending", icon: Clock, iconColor: "text-status-pending" },
  { filter: "APPROVED", label: "Approved", value: "approved", icon: CircleCheck, iconColor: "text-status-approved" },
  { filter: "REJECTED", label: "Rejected", value: "rejected", icon: CircleX, iconColor: "text-status-rejected" },
];

// Four numbers across the top. They count ALL projects: they don't change with the search or
// the tab below. Each one is also a shortcut: click it to show just those projects.
export function StatsCards({
  stats,
  isLoading,
  active,
  onSelect,
}: {
  stats: ProjectStats | undefined;
  isLoading: boolean;
  active: StatusFilter;
  onSelect: (filter: StatusFilter) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {CARDS.map(({ filter, label, value, icon: Icon, iconColor }) => {
        const isActive = active === filter;

        return (
          <button
            key={filter}
            type="button"
            onClick={() => onSelect(filter)}
            aria-pressed={isActive}
            className={cn(
              "flex flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              isActive && "border-primary ring-1 ring-primary"
            )}
          >
            <span className="flex items-center justify-between text-sm text-muted-foreground">
              {label}
              <Icon className={cn("size-4", iconColor)} aria-hidden />
            </span>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <span className="text-3xl font-semibold tabular-nums">{stats ? stats[value] : "–"}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
