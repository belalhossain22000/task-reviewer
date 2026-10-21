import type { Metadata } from "next";

import { AdminGate } from "@/components/mentors/admin-gate";
import { MentorsManager } from "@/components/mentors/mentors-manager";

export const metadata: Metadata = { title: "Mentors" };

export default function MentorsPage() {
  return (
    <AdminGate>
      <MentorsManager />
    </AdminGate>
  );
}
