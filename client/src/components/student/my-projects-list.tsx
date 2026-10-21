"use client";

import { FolderOpen } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PaginationControls } from "@/components/common/pagination-controls";
import { ProjectCard } from "@/components/student/project-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMyProjectsQuery } from "@/features/project/project-api";
import { getErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 5;

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
  const [page, setPage] = useState(1);
  const { data, error, isLoading, isFetching, refetch } = useGetMyProjectsQuery({
    page,
    limit: PAGE_SIZE,
  });

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
        {isLoading ? (
          <ListSkeleton />
        ) : error && !data ? (
          <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
        ) : data && data.data.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="You haven't submitted anything yet"
            description="Use the form to submit your first project. It will show up here with its status."
          />
        ) : data ? (
          <>
            {/* While another page loads, the old one stays visible but faded, so the layout
                doesn't jump. */}
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
              onPageChange={setPage}
              disabled={isFetching}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
