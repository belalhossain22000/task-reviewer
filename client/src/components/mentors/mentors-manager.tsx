"use client";

import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ActiveBadge } from "@/components/common/active-badge";
import { ActiveToggleButton } from "@/components/common/active-toggle-button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { PaginationControls } from "@/components/common/pagination-controls";
import { RelativeTime } from "@/components/common/relative-time";
import { AddMentorDialog } from "@/components/mentors/add-mentor-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetMentorsQuery, useSetMentorActiveMutation } from "@/features/user/user-api";
import { getErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { Mentor } from "@/types/api";

const PAGE_SIZE = 10;

// "5 reviews" opens the review table filtered to the projects this mentor decided last. A
// mentor who hasn't decided anything yet shows 0.
function ReviewsCell({ mentor }: { mentor: Mentor }) {
  if (mentor.reviewCount === 0) return <span className="text-muted-foreground">0</span>;

  return (
    <Link
      href={`/review?reviewer=${mentor.id}`}
      className="text-link hover:underline"
      title="See the projects this person decided on"
    >
      {mentor.reviewCount} {mentor.reviewCount === 1 ? "review" : "reviews"}
    </Link>
  );
}

// The admin's mentor list: see who can review, add a mentor, switch one on or off.
export function MentorsManager() {
  const [page, setPage] = useState(1);
  const { data, error, isLoading, isFetching, refetch } = useGetMentorsQuery({ page, limit: PAGE_SIZE });
  const [setActive, { isLoading: isToggling, originalArgs }] = useSetMentorActiveMutation();
  const busyId = isToggling ? originalArgs?.id : undefined;

  const [adding, setAdding] = useState(false);
  const [deactivating, setDeactivating] = useState<Mentor | null>(null);

  const change = async (mentor: Mentor, isActive: boolean) => {
    try {
      await setActive({ id: mentor.id, isActive }).unwrap();
      toast.success(isActive ? `${mentor.name} can log in again` : `${mentor.name} can no longer log in`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivating) return;
    await change(deactivating, false);
    setDeactivating(null);
  };

  const mentors = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Mentors" description="People who can review submitted projects.">
        <Button onClick={() => setAdding(true)}>
          <Plus />
          Add mentor
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading mentors">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : error && !data ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : data && mentors.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No mentors yet"
          description="Add a mentor so someone can review the projects students submit."
        >
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus />
            Add mentor
          </Button>
        </EmptyState>
      ) : data ? (
        <div className="flex flex-col gap-4">
          <div className={cn("transition-opacity", isFetching && "opacity-60")}>
            <div className="hidden rounded-lg border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead>Reviews</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mentors.map((mentor) => (
                    <TableRow key={mentor.id}>
                      <TableCell className="font-medium">{mentor.name}</TableCell>
                      <TableCell className="max-w-64 truncate text-muted-foreground">{mentor.email}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                        <RelativeTime iso={mentor.createdAt} />
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        <ReviewsCell mentor={mentor} />
                      </TableCell>
                      <TableCell>
                        <ActiveBadge isActive={mentor.isActive} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <ActiveToggleButton
                            name={mentor.name}
                            isActive={mentor.isActive}
                            busy={busyId === mentor.id}
                            onActivate={() => change(mentor, true)}
                            onDeactivate={() => setDeactivating(mentor)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="flex flex-col gap-3 md:hidden">
              {mentors.map((mentor) => (
                <li key={mentor.id} className="flex flex-col gap-3 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium break-words">{mentor.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{mentor.email}</p>
                    </div>
                    <ActiveBadge isActive={mentor.isActive} />
                  </div>
                  <p className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                    <RelativeTime iso={mentor.createdAt} prefix="Added" />
                    <ReviewsCell mentor={mentor} />
                  </p>
                  <div>
                    <ActiveToggleButton
                      name={mentor.name}
                      isActive={mentor.isActive}
                      busy={busyId === mentor.id}
                      onActivate={() => change(mentor, true)}
                      onDeactivate={() => setDeactivating(mentor)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <PaginationControls
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            limit={data.meta.limit}
            onPageChange={setPage}
            disabled={isFetching}
          />
        </div>
      ) : null}

      <AddMentorDialog open={adding} onClose={() => setAdding(false)} />

      <ConfirmDialog
        open={!!deactivating}
        title={`Deactivate ${deactivating?.name ?? "this mentor"}?`}
        description="They will not be able to log in, and any session they have open ends on their next request. You can activate them again at any time."
        confirmLabel="Deactivate"
        destructive
        busy={isToggling}
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivating(null)}
      />
    </div>
  );
}
