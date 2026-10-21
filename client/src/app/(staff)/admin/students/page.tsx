import type { Metadata } from "next";

import { AdminGate } from "@/components/mentors/admin-gate";
import { StudentsManager } from "@/components/students/students-manager";

export const metadata: Metadata = { title: "Students" };

export default function StudentsPage() {
  return (
    <AdminGate>
      <StudentsManager />
    </AdminGate>
  );
}
