import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { currentUser } from "@/lib/auth";
import { isPrivileged, effectivePermissions } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isPrivileged(user.role) || user.active === false) redirect("/account");

  return (
    <div className="flex min-h-screen flex-col bg-off lg:flex-row">
      <AdminSidebar
        adminName={user.name}
        role={user.role}
        permissions={effectivePermissions(user.role, user.permissions)}
      />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
