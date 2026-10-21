"use client";

import { useNow } from "@/hooks/use-now";
import { formatTimeLeft } from "@/lib/format";

// "28 min left": how long a "Take" still holds. It counts down by itself; once it reaches zero
// the next refresh of the list drops the claim.
export function ClaimTimeLeft({ expiresAt }: { expiresAt: string }) {
  const now = useNow();

  return (
    <span data-slot="claim-time-left" className="whitespace-nowrap">
      {formatTimeLeft(expiresAt, now)}
    </span>
  );
}
