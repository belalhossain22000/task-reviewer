"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormAlert } from "@/components/common/form-alert";

// Shown instead of a page while we are still asking the API who is logged in.
// A neutral skeleton, so nobody sees a flash of a page they are about to be sent away from.
export function SessionLoading() {
  return (
    <div className="flex min-h-dvh flex-col" aria-busy="true" aria-label="Loading">
      <div className="flex h-14 items-center justify-between border-b px-4 sm:px-6">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="size-9 rounded-full" />
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

// Shown when the API itself can't be reached (server down, 500). The user is NOT sent to
// /login here: they are probably still logged in, the problem is on our side.
export function SessionError({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4">
      <FormAlert message={message} />
      <Button onClick={() => window.location.reload()}>Try again</Button>
    </div>
  );
}
