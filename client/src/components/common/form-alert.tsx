import { CircleAlert } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

// The red box at the top of a form for a problem that belongs to the whole form, not to one
// field ("Invalid email or password", "Too many attempts", "Can't reach the server").
export function FormAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
