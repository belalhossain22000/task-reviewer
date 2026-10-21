import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "My projects" };

// TEMPORARY: the two cards below are placeholders. The submit form and the list of the
// student's projects replace them in the next steps. The badges are here only to see them.
export default function StudentPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Your projects"
        description="Submit a project for review and follow its status here."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section id="submit" className="scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle>Submit a project</CardTitle>
              <CardDescription>The submission form goes here.</CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section id="my-submissions" className="scroll-mt-20">
          <Card>
            <CardHeader>
              <CardTitle>My submissions</CardTitle>
              <CardDescription>Your projects and their status will be listed here.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <StatusBadge status="PENDING" />
              <StatusBadge status="APPROVED" />
              <StatusBadge status="REJECTED" />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
