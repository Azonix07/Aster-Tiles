/**
 * Role-based access control. Pure TS (no Node imports) so it can be shared by
 * server code and client components alike.
 *
 * - admin    : the owner — full access, can manage everyone including managers.
 * - manager  : full access to every feature, can manage staff (not admins).
 * - staff    : back-office access limited to the permissions an admin grants.
 * - customer : ordinary shopper, no back-office access.
 */
export type Role = "admin" | "manager" | "staff" | "customer";

export type Permission =
  | "analytics"
  | "orders"
  | "tiles"
  | "content"
  | "appearance"
  | "settings"
  | "tickets";

/** Permissions an admin can grant to a staff member. */
export const STAFF_PERMISSIONS: Permission[] = [
  "analytics",
  "orders",
  "tiles",
  "content",
  "appearance",
  "settings",
  "tickets",
];

export const PERMISSION_LABELS: Record<Permission, { label: string; desc: string }> = {
  analytics: { label: "Analytics", desc: "View site traffic and PostHog insights" },
  orders: { label: "Orders", desc: "View and update customer orders" },
  tiles: { label: "Tiles", desc: "Add, edit and remove catalogue tiles" },
  content: { label: "Site content", desc: "Edit staff, reviews, collections, gallery" },
  appearance: { label: "Appearance", desc: "Change media, images and home headlines" },
  settings: { label: "Settings", desc: "Maintenance, payments and delivery pricing" },
  tickets: { label: "Support", desc: "Read and reply to customer support tickets" },
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
  customer: "Customer",
};

export const ROLE_ORDER: Record<Role, number> = { admin: 0, manager: 1, staff: 2, customer: 3 };

/** Anyone who can reach the admin panel at all. */
export function isPrivileged(role?: Role | null): boolean {
  return role === "admin" || role === "manager" || role === "staff";
}

/** admin & manager get every permission implicitly. */
export function isFullAccess(role?: Role | null): boolean {
  return role === "admin" || role === "manager";
}

export function effectivePermissions(role?: Role | null, permissions?: Permission[]): Permission[] {
  if (isFullAccess(role)) return [...STAFF_PERMISSIONS];
  if (role === "staff") return permissions ?? [];
  return [];
}

type PermHolder = { role?: Role | null; permissions?: Permission[] } | null | undefined;

/** Does this user hold the given permission? */
export function can(user: PermHolder, perm: Permission): boolean {
  if (!user) return false;
  return effectivePermissions(user.role, user.permissions).includes(perm);
}

/** Only admins and managers manage the team. */
export function canManageTeam(role?: Role | null): boolean {
  return isFullAccess(role);
}
