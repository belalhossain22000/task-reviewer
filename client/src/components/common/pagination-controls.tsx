import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

// "Showing 6–10 of 23" with Previous / Next. The buttons only appear when there is more than
// one page. Used under the student's list and the mentor's table.
export function PaginationControls({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  disabled = false,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  // True while a page is loading, so a double click can't skip a page.
  disabled?: boolean;
}) {
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {from}–{to} of {total}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={disabled || page <= 1}
          >
            <ChevronLeft />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={disabled || page >= totalPages}
          >
            Next
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
