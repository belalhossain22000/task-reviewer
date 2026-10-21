"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Radix's Select can't have an empty value, so "no filter" gets a word of its own.
const ALL = "ALL";

// Work-queue filter: all projects, only the ones I have taken, or only the pending ones nobody
// has taken yet (what is left to pick up).
export function QueueFilter({
  value,
  onChange,
}: {
  value: "" | "mine" | "none";
  onChange: (value: "" | "mine" | "none") => void;
}) {
  return (
    <Select
      value={value || ALL}
      onValueChange={(next) => onChange(next === ALL ? "" : (next as "mine" | "none"))}
    >
      <SelectTrigger className="w-full sm:w-44" aria-label="Filter by who is reviewing">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All projects</SelectItem>
        <SelectItem value="mine">Taken by me</SelectItem>
        <SelectItem value="none">Not taken yet</SelectItem>
      </SelectContent>
    </Select>
  );
}
