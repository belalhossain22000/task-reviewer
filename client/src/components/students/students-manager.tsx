"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
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
import { SearchInput } from "@/components/common/search-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetStudentsQuery, useSetStudentActiveMutation } from "@/features/user/user-api";
import { useDebounce } from "@/hooks/use-debounce";
import { getErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { Student } from "@/types/api";

const PAGE_SIZE = 10;

// "3 projects" opens the review table filtered to that student (the table's search matches
// the email). A student with no projects just shows 0.
function ProjectsCell({ student }: { student: Student }) {
  if (student.projectCount === 0) return <span className="text-muted-foreground">0</span>;

  return (
    <Link
      href={`/review?q=${encodeURIComponent(student.email)}`}
      className="text-link hover:underline"
      title="See this student's projects in the review table"
    >
      {student.projectCount} {student.projectCount === 1 ? "project" : "projects"}
    </Link>
  );
}

// The admin's student list: who has signed up, how much they have submitted, and a switch to
// turn an account off (they can't log in, and an open session ends) or back on.
export function StudentsManager() {
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  // The list reloads when typing pauses, not on every keystroke.
  const search = useDebounce(searchText.trim(), 300);

  const { data, error, isLoading, isFetching, refetch } = useGetStudentsQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });
  const [setActive, { isLoading: isToggling, originalArgs }] = useSetStudentActiveMutation();
  const busyId = isToggling ? originalArgs?.id : undefined;

  const [deactivating, setDeactivating] = useState<Student | null>(null);

  const change = async (student: Student, isActive: boolean) => {
    try {
      await setActive({ id: student.id, isActive }).unwrap();
      toast.success(isActive ? `${student.name} can log in again` : `${student.name} can no longer log in`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivating) return;
    await change(deactivating, false);
    setDeactivating(null);
  };

  // A different search is a different list: start again at page 1.
  const onSearchChange = (text: string) => {
    setSearchText(text);
    setPage(1);
  };

  const students = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Students" description="Everyone who has signed up to submit projects.">
        <SearchInput
          value={searchText}
          onChange={onSearchChange}
          placeholder="Search name or email"
          label="Search students"
        />
      </PageHeader>

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading students">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : error && !data ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : data && students.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={search ? `No students match "${search}"` : "No students yet"}
          description={search ? "Try a different name or email." : "Students appear here after they sign up."}
        >
          {search && (
            <Button variant="outline" size="sm" onClick={() => onSearchChange("")}>
              Clear search
            </Button>
          )}
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
                    <TableHead>Joined</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="max-w-64 truncate text-muted-foreground">{student.email}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                        <RelativeTime iso={student.createdAt} />
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        <ProjectsCell student={student} />
                      </TableCell>
                      <TableCell>
                        <ActiveBadge isActive={student.isActive} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <ActiveToggleButton
                            name={student.name}
                            isActive={student.isActive}
                            busy={busyId === student.id}
                            onActivate={() => change(student, true)}
                            onDeactivate={() => setDeactivating(student)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="flex flex-col gap-3 md:hidden">
              {students.map((student) => (
                <li key={student.id} className="flex flex-col gap-3 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium break-words">{student.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{student.email}</p>
                    </div>
                    <ActiveBadge isActive={student.isActive} />
                  </div>
                  <p className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                    <RelativeTime iso={student.createdAt} prefix="Joined" />
                    <ProjectsCell student={student} />
                  </p>
                  <div>
                    <ActiveToggleButton
                      name={student.name}
                      isActive={student.isActive}
                      busy={busyId === student.id}
                      onActivate={() => change(student, true)}
                      onDeactivate={() => setDeactivating(student)}
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

      <ConfirmDialog
        open={!!deactivating}
        title={`Deactivate ${deactivating?.name ?? "this student"}?`}
        description="They will not be able to log in, and any session they have open ends on their next request. Their projects stay in the review list. You can activate them again at any time."
        confirmLabel="Deactivate"
        destructive
        busy={isToggling}
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivating(null)}
      />
    </div>
  );
}
