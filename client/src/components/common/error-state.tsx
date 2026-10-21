import { RotateCw } from "lucide-react";

import { FormAlert } from "@/components/common/form-alert";
import { Button } from "@/components/ui/button";

// A list or table that could not be loaded: what went wrong, and a way to try again.
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <FormAlert message={message} />
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCw />
        Try again
      </Button>
    </div>
  );
}
