import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { isPrivileged, can, type Permission } from "@/lib/roles";
import type { User } from "@/lib/db";

/** Require any back-office access (admin/manager/staff). Redirects otherwise. */
export async function requirePanel(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isPrivileged(user.role) || user.active === false) redirect("/account");
  return user;
}

/** Require a specific permission; bounces to the dashboard if lacking it. */
export async function requirePermission(perm: Permission): Promise<User> {
  const user = await requirePanel();
  if (!can(user, perm)) redirect("/admin");
  return user;
}
