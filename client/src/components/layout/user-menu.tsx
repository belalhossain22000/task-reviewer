"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogoutMutation } from "@/features/auth/auth-api";
import { getErrorMessage } from "@/lib/api-error";
import { getInitials } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { ROLE_LABELS } from "@/types/api";

// The round avatar in the top bar. Opens who you are (name, email, role) and the log out
// button. Used by both the student navbar and the staff top bar.
export function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();

  if (!user) return <Skeleton className="size-9 rounded-full" />;

  const onLogout = async () => {
    try {
      await logout().unwrap();
      router.replace("/login");
    } catch (error) {
      // The cookie was not cleared, so the user is still logged in. Say so, don't redirect.
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
          <Avatar size="sm">
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-1.5 font-normal">
          <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          <Badge variant="secondary" className="mt-0.5">
            {ROLE_LABELS[user.role]}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={isLoading} onSelect={onLogout}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
