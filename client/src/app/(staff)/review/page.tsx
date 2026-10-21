import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/common/page-header";
import { ProjectsTableSkeleton } from "@/components/review/projects-table";
import { ReviewDashboard } from "@/components/review/review-dashboard";

export const metadata: Metadata = { title: "Review" };

export default function ReviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Review dashboard"
        description="Look through submitted projects and decide on them."
      />
      {/* The dashboard reads the filters from the address bar (useSearchParams), which Next.js
          only allows inside a Suspense boundary. */}
      <Suspense fallback={<ProjectsTableSkeleton />}>
        <ReviewDashboard />
      </Suspense>
    </div>
  );
}
