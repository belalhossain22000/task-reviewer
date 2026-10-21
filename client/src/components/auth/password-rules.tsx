import { Check, Circle } from "lucide-react";

import { cn } from "@/lib/utils";
import { PASSWORD_RULES } from "@/lib/validations";

// A checklist that ticks off each password rule as the user types, so they know what is
// still missing before they press the button. Used by the signup and mentor forms.
// `invalid` (the field failed validation) turns the rules that are still unmet red, so the
// checklist itself shows what to fix and the form doesn't need to repeat it in words.
export function PasswordRules({ value, invalid = false }: { value: string; invalid?: boolean }) {
  return (
    <ul aria-label="Password requirements" className="flex flex-col gap-1 text-xs">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);

        return (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-1.5",
              met ? "text-foreground" : invalid ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {met ? (
              <Check className="size-3.5 text-primary" aria-hidden />
            ) : (
              <Circle className="size-3.5" aria-hidden />
            )}
            {rule.label}
            <span className="sr-only">{met ? " (done)" : " (not yet)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
