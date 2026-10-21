import { UserCheck, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";

// The one button that switches an account: "Deactivate" when it is on, "Activate" when it is
// off. The person's name is read out to screen readers so that, in a list, each button is
// distinguishable. Turning an account OFF is the caller's cue to ask "are you sure?".
export function ActiveToggleButton({
  name,
  isActive,
  busy,
  onActivate,
  onDeactivate,
}: {
  name: string;
  isActive: boolean;
  busy: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  return isActive ? (
    <Button size="sm" variant="outline" disabled={busy} onClick={onDeactivate}>
      <UserX />
      Deactivate
      <span className="sr-only"> {name}</span>
    </Button>
  ) : (
    <Button size="sm" variant="outline" disabled={busy} onClick={onActivate}>
      <UserCheck />
      Activate
      <span className="sr-only"> {name}</span>
    </Button>
  );
}
