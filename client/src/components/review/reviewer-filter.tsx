"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Radix's Select can't have an empty value, so "anyone" gets a word of its own here and is
// turned back into "" (no filter) on the way out.
const ANYONE = "ANYONE";

// "Reviewed by": show only the projects whose LATEST decision was made by one person.
// Everyone gets "Anyone" and "Me"; an admin also gets every mentor (passed in `people`).
export function ReviewerFilter({
  value,
  onChange,
  people,
}: {
  value: string;
  onChange: (value: string) => void;
  people: { id: string; name: string }[];
}) {
  // A link can carry a reviewer we have no name for (loading, or another admin).
  const known = value === "" || value === "me" || people.some((person) => person.id === value);

  return (
    <Select value={value || ANYONE} onValueChange={(next) => onChange(next === ANYONE ? "" : next)}>
      <SelectTrigger className="w-full sm:w-44" aria-label="Filter by reviewer">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANYONE}>Reviewed by anyone</SelectItem>
        <SelectItem value="me">Reviewed by me</SelectItem>
        {people.map((person) => (
          <SelectItem key={person.id} value={person.id}>
            {person.name}
          </SelectItem>
        ))}
        {!known && <SelectItem value={value}>Selected reviewer</SelectItem>}
      </SelectContent>
    </Select>
  );
}
