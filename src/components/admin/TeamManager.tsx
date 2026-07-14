"use client";

import { useState } from "react";
import {
  ROLE_LABELS,
  PERMISSION_LABELS,
  STAFF_PERMISSIONS,
  isFullAccess,
  type Permission,
  type Role,
} from "@/lib/roles";
import type { TeamMember } from "@/lib/team";

const inputCls =
  "w-full rounded-xl border border-mist bg-off px-4 py-2.5 text-sm text-navy outline-none transition focus:border-green focus:ring-2 focus:ring-green/20";
const labelCls = "mb-1.5 block font-display text-xs font-bold text-navy";

const ROLE_BADGE: Record<Role, string> = {
  admin: "bg-navy text-white",
  manager: "bg-green/15 text-green",
  staff: "bg-blue-50 text-blue-600",
  customer: "bg-slate-100 text-slate-500",
};

function PermissionPicker({
  selected,
  onToggle,
}: {
  selected: Permission[];
  onToggle: (p: Permission) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {STAFF_PERMISSIONS.map((p) => {
        const on = selected.includes(p);
        return (
          <label
            key={p}
            className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition ${
              on ? "border-green/50 bg-green/5" : "border-mist hover:border-green/40"
            }`}
          >
            <input type="checkbox" checked={on} onChange={() => onToggle(p)} className="mt-0.5 accent-green" />
            <span>
              <span className="block text-xs font-bold text-navy">{PERMISSION_LABELS[p].label}</span>
              <span className="block text-[0.68rem] text-muted">{PERMISSION_LABELS[p].desc}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

export default function TeamManager({
  initialMembers,
  meId,
  meRole,
}: {
  initialMembers: TeamMember[];
  meId: string;
  meRole: Role;
}) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const assignableRoles: Role[] = meRole === "admin" ? ["admin", "manager", "staff"] : ["staff"];

  /* ── Add form state ── */
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState<Role>("staff");
  const [addPerms, setAddPerms] = useState<Permission[]>([]);
  const [adding, setAdding] = useState(false);

  const toggleAddPerm = (p: Permission) =>
    setAddPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  async function refresh() {
    const res = await fetch("/api/admin/team", { cache: "no-store" });
    if (res.ok) setMembers((await res.json()).members ?? []);
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setNotice(null);
    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: addEmail, name: addName, role: addRole, permissions: addPerms }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      if (data.created && data.tempPassword) {
        setNotice({
          kind: "ok",
          text: `Account created for ${addEmail}. Temporary password: ${data.tempPassword}${
            data.emailed ? " (emailed to them)." : " — share it with them; email isn't set up yet."
          }`,
        });
      } else {
        setNotice({ kind: "ok", text: `${addEmail} updated.` });
      }
      setAddEmail("");
      setAddName("");
      setAddRole("staff");
      setAddPerms([]);
      await refresh();
    } else {
      setNotice({ kind: "err", text: data?.error ?? "Could not add member." });
    }
    setAdding(false);
  }

  async function updateMember(id: string, patch: { role?: Role; permissions?: Permission[]; active?: boolean }) {
    setNotice(null);
    const res = await fetch(`/api/admin/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setEditingId(null);
      await refresh();
    } else {
      setNotice({ kind: "err", text: data?.error ?? "Could not update member." });
    }
  }

  async function removeMember(m: TeamMember) {
    if (!confirm(`Remove ${m.name} from the team? Their customer account stays, but back-office access is revoked.`))
      return;
    setNotice(null);
    const res = await fetch(`/api/admin/team/${m.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (res.ok) await refresh();
    else setNotice({ kind: "err", text: data?.error ?? "Could not remove member." });
  }

  const canEdit = (m: TeamMember) => !(meRole === "manager" && isFullAccess(m.role));

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <p className="text-sm text-muted">Access & roles</p>
        <h1 className="display mt-1 text-3xl text-navy">Team</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Add colleagues by email and choose what they can do. <strong>Managers</strong> can do everything
          you can; <strong>staff</strong> only get the permissions you tick.
        </p>
      </div>

      {notice && (
        <div
          className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
            notice.kind === "ok"
              ? "border-green/30 bg-green/5 text-navy"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Add member */}
      <form onSubmit={addMember} className="mt-6 rounded-2xl border border-mist bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold text-navy">Add a team member</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tm-email" className={labelCls}>Email</label>
            <input
              id="tm-email"
              type="email"
              required
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="colleague@astertiles.ie"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="tm-name" className={labelCls}>Name <span className="font-normal text-muted">(optional)</span></label>
            <input
              id="tm-name"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="Their name"
              className={inputCls}
            />
          </div>
        </div>
        <div className="mt-4">
          <span className={labelCls}>Role</span>
          <div className="flex flex-wrap gap-2">
            {assignableRoles.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setAddRole(r)}
                className={`rounded-xl border px-4 py-2 font-display text-xs font-bold transition ${
                  addRole === r ? "border-green bg-green/10 text-green" : "border-mist text-muted hover:border-green/40"
                }`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[0.7rem] text-muted">
            {addRole === "staff"
              ? "Pick exactly what this person can access."
              : "Full access to every section of the admin."}
          </p>
        </div>
        {addRole === "staff" && (
          <div className="mt-4">
            <span className={labelCls}>Permissions</span>
            <PermissionPicker selected={addPerms} onToggle={toggleAddPerm} />
          </div>
        )}
        <button type="submit" disabled={adding} className="btn btn-green mt-5 disabled:opacity-60">
          {adding ? "Adding…" : "Add member"}
        </button>
      </form>

      {/* Members */}
      <div className="mt-8 space-y-3">
        <h2 className="font-display text-lg font-bold text-navy">Team members ({members.length})</h2>
        {members.map((m) => {
          const isSelf = m.id === meId;
          const editable = canEdit(m);
          const isEditing = editingId === m.id;
          return (
            <div key={m.id} className="rounded-2xl border border-mist bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green/15 font-display text-sm font-bold text-green">
                  {m.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-sm font-bold text-navy">{m.name}</p>
                    {isSelf && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.6rem] font-bold text-slate-500">You</span>}
                    {!m.active && <span className="rounded bg-red-50 px-1.5 py-0.5 text-[0.6rem] font-bold text-red-500">Disabled</span>}
                  </div>
                  <p className="truncate text-xs text-muted">{m.email}</p>
                </div>
                <span className={`rounded-lg px-2.5 py-1 font-display text-[0.65rem] font-bold ${ROLE_BADGE[m.role]}`}>
                  {ROLE_LABELS[m.role]}
                </span>
                {editable && !isSelf && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setEditingId(isEditing ? null : m.id)}
                      className="rounded-lg border border-mist px-3 py-1.5 text-xs font-bold text-navy transition hover:border-green hover:text-green"
                    >
                      {isEditing ? "Close" : "Edit"}
                    </button>
                    <button
                      onClick={() => removeMember(m)}
                      className="rounded-lg border border-mist px-3 py-1.5 text-xs font-bold text-red-500 transition hover:border-red-400 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Permission summary for staff */}
              {m.role === "staff" && !isEditing && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.permissions.length === 0 ? (
                    <span className="text-[0.7rem] text-muted">No permissions yet — they can sign in but see nothing.</span>
                  ) : (
                    m.permissions.map((p) => (
                      <span key={p} className="rounded-md bg-off px-2 py-0.5 text-[0.65rem] font-semibold text-navy">
                        {PERMISSION_LABELS[p].label}
                      </span>
                    ))
                  )}
                </div>
              )}

              {isEditing && <MemberEditor member={m} meRole={meRole} onSave={updateMember} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MemberEditor({
  member,
  meRole,
  onSave,
}: {
  member: TeamMember;
  meRole: Role;
  onSave: (id: string, patch: { role?: Role; permissions?: Permission[]; active?: boolean }) => void;
}) {
  const roles: Role[] = meRole === "admin" ? ["admin", "manager", "staff"] : ["staff"];
  const [role, setRole] = useState<Role>(member.role);
  const [perms, setPerms] = useState<Permission[]>(member.permissions);
  const [active, setActive] = useState<boolean>(member.active);

  const togglePerm = (p: Permission) =>
    setPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  return (
    <div className="mt-4 rounded-xl border border-mist bg-off/60 p-4">
      <span className={labelCls}>Role</span>
      <div className="flex flex-wrap gap-2">
        {roles.map((r) => (
          <button
            type="button"
            key={r}
            onClick={() => setRole(r)}
            className={`rounded-lg border px-3 py-1.5 font-display text-xs font-bold transition ${
              role === r ? "border-green bg-green/10 text-green" : "border-mist text-muted hover:border-green/40"
            }`}
          >
            {ROLE_LABELS[r]}
          </button>
        ))}
      </div>

      {role === "staff" && (
        <div className="mt-4">
          <span className={labelCls}>Permissions</span>
          <PermissionPicker selected={perms} onToggle={togglePerm} />
        </div>
      )}

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-navy">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-green" />
        Account active (uncheck to suspend back-office access)
      </label>

      <button
        onClick={() => onSave(member.id, { role, permissions: perms, active })}
        className="btn btn-green mt-4"
      >
        Save changes
      </button>
    </div>
  );
}
