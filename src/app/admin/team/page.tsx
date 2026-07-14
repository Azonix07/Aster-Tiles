import { redirect } from "next/navigation";
import { requirePanel } from "@/lib/adminGuard";
import { canManageTeam, ROLE_ORDER } from "@/lib/roles";
import { getDb } from "@/lib/db";
import { serializeMember } from "@/lib/team";
import TeamManager from "@/components/admin/TeamManager";

export const metadata = { title: "Team" };

export default async function AdminTeamPage() {
  const me = await requirePanel();
  if (!canManageTeam(me.role)) redirect("/admin");

  const db = await getDb();
  const members = db.users
    .filter((u) => u.role && u.role !== "customer")
    .map(serializeMember)
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.name.localeCompare(b.name));

  return <TeamManager initialMembers={members} meId={me.id} meRole={me.role} />;
}
