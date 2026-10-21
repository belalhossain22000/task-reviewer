import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";

// A link that opens in a new tab. `rel="noopener noreferrer"` stops the other site from getting
// a handle on this one, and the hidden text tells screen readers it leaves the page.
export function ExternalLinkItem({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("inline-flex items-center gap-1 text-link hover:underline", className)}
    >
      <span className="truncate">{label}</span>
      <ExternalLink className="size-3 shrink-0" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
