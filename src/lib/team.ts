import crypto from "crypto";
import type { User } from "@/lib/db";
import { STAFF_PERMISSIONS, type Permission, type Role } from "@/lib/roles";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  permissions: Permission[];
  active: boolean;
  createdAt: string;
};

export function serializeMember(u: User): TeamMember {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone ?? "",
    role: u.role,
    permissions: u.permissions ?? [],
    active: u.active !== false,
    createdAt: u.createdAt,
  };
}

export function sanitizeTeamPermissions(input: unknown): Permission[] {
  if (!Array.isArray(input)) return [];
  return input.filter((p): p is Permission => STAFF_PERMISSIONS.includes(p as Permission));
}

export function tempPassword(): string {
  return `Aster-${crypto.randomBytes(4).toString("hex")}`;
}
