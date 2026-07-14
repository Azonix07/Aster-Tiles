"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls =
  "w-full rounded-xl border border-mist bg-off px-4 py-2.5 text-sm text-navy outline-none transition focus:border-green focus:ring-2 focus:ring-green/20";
const labelCls = "mb-1.5 block font-display text-xs font-bold text-navy";

export default function ProfileForm({
  initial,
}: {
  initial: { name: string; email: string; phone: string };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    const payload: Record<string, string> = { name, email, phone };
    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setNotice({ kind: "ok", text: "Profile saved." });
      setCurrentPassword("");
      setNewPassword("");
      router.refresh();
    } else {
      setNotice({ kind: "err", text: data?.error ?? "Could not save your profile." });
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <section className="rounded-2xl border border-mist bg-white p-6 shadow-sm sm:p-8">
        <h2 className="display text-xl text-navy">Details</h2>
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="pf-name" className={labelCls}>Name</label>
            <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pf-email" className={labelCls}>Email</label>
              <input id="pf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="pf-phone" className={labelCls}>Phone</label>
              <input id="pf-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-mist bg-white p-6 shadow-sm sm:p-8">
        <h2 className="display text-xl text-navy">Change password</h2>
        <p className="mt-1 text-xs text-muted">Leave blank to keep your current password.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-cur" className={labelCls}>Current password</label>
            <input
              id="pf-cur"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="pf-new" className={labelCls}>New password</label>
            <input
              id="pf-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {notice && (
        <p className={`text-sm font-medium ${notice.kind === "ok" ? "text-green" : "text-red-500"}`}>
          {notice.text}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn btn-green disabled:opacity-60">
        {busy ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
