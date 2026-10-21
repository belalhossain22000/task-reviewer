import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// "Active" can log in; "Inactive" can't (and is thrown out of a session that is already open).
// Written out in full so Tailwind finds the class names.
export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="secondary"
      data-active={isActive}
      className={cn(
        isActive ? "bg-status-approved-soft text-status-approved-foreground" : "bg-muted text-muted-foreground"
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
