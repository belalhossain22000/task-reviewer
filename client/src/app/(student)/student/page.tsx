import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { MyProjectsList } from "@/components/student/my-projects-list";
import { ProjectForm } from "@/components/student/project-form";

export const metadata: Metadata = { title: "My projects" };

export default function StudentPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Your projects"
        description="Submit a project for review and follow its status here."
      />

      {/* On a phone the form comes first, then the list; from `lg` up they sit side by side. */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section id="submit" className="scroll-mt-20">
          <ProjectForm />
        </section>

        <section id="my-submissions" className="scroll-mt-20">
          <MyProjectsList />
        </section>
      </div>
    </div>
  );
}
