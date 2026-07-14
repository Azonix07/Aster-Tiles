import { NextResponse } from "next/server";
import { mutateDb, type User } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { canManageTeam, isFullAccess, type Role } from "@/lib/roles";
import { serializeMember, sanitizeTeamPermissions } from "@/lib/team";

const ASSIGNABLE_ROLES: Role[] = ["admin", "manager", "staff"];

/** True if demoting/deactivating this user would leave the site with no active admin. */
function isLastActiveAdmin(users: User[], target: User): boolean {
  if (target.role !== "admin") return false;
  const admins = users.filter((u) => u.role === "admin" && u.active !== false);
  return admins.length <= 1;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!me || !canManageTeam(me.role)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    role?: Role;
    permissions?: unknown;
    active?: boolean;
  } | null;
  if (!body) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const result = await mutateDb((db): { member?: ReturnType<typeof serializeMember>; error?: string; status?: number } => {
    const target = db.users.find((u) => u.id === id);
    if (!target) return { error: "Member not found.", status: 404 };

    const nextRole = body.role ?? target.role;
    if (!ASSIGNABLE_ROLES.includes(nextRole)) return { error: "Invalid role.", status: 400 };

    // Managers may only touch staff, and only keep them as staff.
    if (me.role === "manager" && (isFullAccess(target.role) || nextRole !== "staff")) {
      return { error: "Managers can only manage staff members.", status: 403 };
    }
    // No changing your own role or switching yourself off (avoids lock-out).
    if (target.id === me.id && (nextRole !== target.role || body.active === false)) {
      return { error: "You can't change your own role or deactivate yourself.", status: 400 };
    }
    // Never strip the last remaining admin.
    if (isLastActiveAdmin(db.users, target) && (nextRole !== "admin" || body.active === false)) {
      return { error: "You can't remove the last admin.", status: 400 };
    }

    target.role = nextRole;
    target.isAdmin = nextRole === "admin";
    if (nextRole === "staff") {
      target.permissions = sanitizeTeamPermissions(body.permissions ?? target.permissions);
    } else {
      target.permissions = [];
    }
    if (typeof body.active === "boolean") target.active = body.active;
    return { member: serializeMember(target) };
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }
  return NextResponse.json({ member: result.member });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!me || !canManageTeam(me.role)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  const { id } = await params;

  const result = await mutateDb((db): { ok?: boolean; error?: string; status?: number } => {
    const target = db.users.find((u) => u.id === id);
    if (!target) return { error: "Member not found.", status: 404 };
    if (target.id === me.id) return { error: "You can't remove yourself.", status: 400 };
    if (me.role === "manager" && isFullAccess(target.role)) {
      return { error: "Managers can only remove staff members.", status: 403 };
    }
    if (isLastActiveAdmin(db.users, target)) {
      return { error: "You can't remove the last admin.", status: 400 };
    }
    // Keep the account, just drop back-office access.
    target.role = "customer";
    target.isAdmin = false;
    target.permissions = [];
    target.active = true;
    return { ok: true };
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }
  return NextResponse.json({ ok: true });
}
