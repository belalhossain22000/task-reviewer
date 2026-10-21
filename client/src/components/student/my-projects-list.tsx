"use client";

import { FolderOpen, SearchX } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PaginationControls } from "@/components/common/pagination-controls";
import { SearchInput } from "@/components/common/search-input";
import { ProjectCard } from "@/components/student/project-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetMyProjectsQuery } from "@/features/project/project-api";
import { useDebounce } from "@/hooks/use-debounce";
import { getErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { PROJECT_STATUSES, type ProjectStatus } from "@/types/api";

const PAGE_SIZE = 5;

type StatusFilter = "ALL" | ProjectStatus;
const STATUS_FILTERS: StatusFilter[] = ["ALL", ...PROJECT_STATUSES];

const LABELS: Record<StatusFilter, string> = {
  ALL: "All",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading your projects">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function MyProjectsList() {
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [searchText, setSearchText] = useState("");
  // The server is asked after a short pause in typing, not on every key.
  const search = useDebounce(searchText, 300).trim();

  // A different filter is a different list, so it starts again at page 1. The page is stored
  // together with the filters it belongs to; if they have changed since, it counts as page 1.
  const filterKey = `${status}|${search}`;
  const [pageState, setPageState] = useState({ page: 1, filterKey });
  const page = pageState.filterKey === filterKey ? pageState.page : 1;

  const { data, error, isLoading, isFetching, refetch } = useGetMyProjectsQuery({
    page,
    limit: PAGE_SIZE,
    status,
    search: search || undefined,
  });

  const hasFilters = status !== "ALL" || searchText.trim() !== "";
  const clearFilters = () => {
    setStatus("ALL");
    setSearchText("");
  };

  // Submitting a project marks this query stale (see project-api.ts), so a new project
  // shows up here without any code in this component.
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          My submissions
          {data && data.meta.total > 0 && <Badge variant="secondary">{data.meta.total}</Badge>}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Only worth showing once there is something to filter; it stays while a filter is on,
            even when that filter matches nothing, so it can be changed or cleared. */}
        {(hasFilters || (data && data.meta.total > 0)) && (
          <div className="flex flex-col gap-3">
            {/* Scrolls sideways on a narrow phone instead of squeezing the labels. `overflow-y-hidden`: the
          tabs are 1px taller than the box, which would otherwise show a tiny vertical scrollbar. */}
            <div className="-mx-1 overflow-x-auto overflow-y-hidden px-1">
              <Tabs value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
                <TabsList>
                  {STATUS_FILTERS.map((filter) => (
                    <TabsTrigger key={filter} value={filter}>
                      {LABELS[filter]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <SearchInput
              value={searchText}
              onChange={setSearchText}
              placeholder="Search by name, description or link"
              label="Search your projects"
              className="sm:max-w-none"
            />
          </div>
        )}

        {isLoading ? (
          <ListSkeleton />
        ) : error && !data ? (
          <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
        ) : data && data.data.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title={
                search
                  ? `No projects match "${search}"`
                  : `No ${LABELS[status].toLowerCase()} projects`
              }
              description="Try a different search or status."
            >
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </EmptyState>
          ) : (
            <EmptyState
              icon={FolderOpen}
              title="You haven't submitted anything yet"
              description="Use the form to submit your first project. It will show up here with its status."
            />
          )
        ) : data ? (
          <>
            {/* While another page or filter loads, the old list stays visible but faded, so the
                layout doesn't jump. */}
            <ul className={cn("flex flex-col gap-3 transition-opacity", isFetching && "opacity-60")}>
              {data.data.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </ul>

            <PaginationControls
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              limit={data.meta.limit}
              onPageChange={(next) => setPageState({ page: next, filterKey })}
              disabled={isFetching}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
