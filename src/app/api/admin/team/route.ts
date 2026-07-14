import { NextResponse } from "next/server";
import { getDb, mutateDb, hashPassword, newId, type User } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { canManageTeam, isFullAccess, ROLE_ORDER, type Role } from "@/lib/roles";
import { serializeMember, sanitizeTeamPermissions, tempPassword, type TeamMember } from "@/lib/team";
import { sendTeamInvite } from "@/lib/email";

const ASSIGNABLE_ROLES: Role[] = ["admin", "manager", "staff"];

export async function GET() {
  const me = await currentUser();
  if (!me || !canManageTeam(me.role)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  const db = await getDb();
  const members = db.users
    .filter((u) => u.role && u.role !== "customer")
    .map(serializeMember)
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.name.localeCompare(b.name));
  return NextResponse.json({ members, meId: me.id, meRole: me.role });
}

export async function POST(request: Request) {
  const me = await currentUser();
  if (!me || !canManageTeam(me.role)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    name?: string;
    role?: Role;
    permissions?: unknown;
  } | null;

  const email = String(body?.email ?? "").trim().toLowerCase();
  const name = String(body?.name ?? "").trim();
  const role = body?.role as Role;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "Pick a valid role." }, { status: 400 });
  }
  // Managers may only add staff, never other admins/managers.
  if (me.role === "manager" && role !== "staff") {
    return NextResponse.json({ error: "Managers can only add staff members." }, { status: 403 });
  }

  const permissions = role === "staff" ? sanitizeTeamPermissions(body?.permissions) : [];

  const result = await mutateDb((db): { member?: TeamMember; created?: boolean; temp?: string; error?: string } => {
    const existing = db.users.find((u) => u.email === email);
    if (existing) {
      if (me.role === "manager" && isFullAccess(existing.role)) {
        return { error: "You can't modify an admin or manager." };
      }
      existing.role = role;
      existing.isAdmin = role === "admin";
      existing.permissions = permissions;
      existing.active = true;
      return { member: serializeMember(existing), created: false };
    }
    const temp = tempPassword();
    const created: User = {
      id: newId(),
      name: name || email.split("@")[0],
      email,
      phone: "",
      passwordHash: hashPassword(temp),
      isAdmin: role === "admin",
      role,
      permissions,
      active: true,
      addresses: [],
      createdAt: new Date().toISOString(),
    };
    db.users.push(created);
    return { member: serializeMember(created), created: true, temp };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: 403 });

  // Best-effort invite email for brand-new accounts (no-op if Resend isn't set up).
  let emailed = false;
  if (result.created && result.temp && result.member) {
    const sent = await sendTeamInvite({
      to: result.member.email,
      name: result.member.name,
      role: result.member.role,
      tempPassword: result.temp,
      invitedBy: me.name,
    });
    emailed = sent.ok;
  }

  return NextResponse.json({
    member: result.member,
    created: result.created,
    tempPassword: result.created ? result.temp : undefined,
    emailed,
  });
}
