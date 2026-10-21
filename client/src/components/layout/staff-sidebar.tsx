import { StaffBrand } from "@/components/layout/staff-brand";
import { StaffNav } from "@/components/layout/staff-nav";

// The permanent left column on tablets and desktops (`md` and up). On a phone it is hidden;
// the same content opens from the menu button in the top bar instead.
export function StaffSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r bg-card p-4 md:flex">
      <StaffBrand />
      <StaffNav />
    </aside>
  );
}
