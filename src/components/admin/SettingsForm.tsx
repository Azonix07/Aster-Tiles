"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Settings } from "@/lib/db";

const inputCls =
  "w-full rounded-xl border border-mist bg-off px-4 py-2.5 text-sm text-navy outline-none transition focus:border-green focus:ring-2 focus:ring-green/20";
const labelCls = "mb-1.5 block font-display text-xs font-bold text-navy";

function Toggle({
  checked,
  onChange,
  title,
  description,
  danger = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  title: string;
  description: string;
  danger?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4 transition ${
        checked && danger
          ? "border-gold bg-gold/10"
          : checked
            ? "border-green/50 bg-green/5"
            : "border-mist hover:border-green/40"
      }`}
    >
      <span>
        <span className="block font-display text-sm font-bold text-navy">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">{description}</span>
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={`h-6 w-11 rounded-full transition ${
            checked ? (danger ? "bg-gold" : "bg-green") : "bg-mist"
          }`}
        />
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
    </label>
  );
}

export default function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState<Settings>(structuredClone(initial));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        deliveryFee: Number(form.deliveryFee),
        freeDeliveryOver: Number(form.freeDeliveryOver),
      }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not save settings.");
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* ── Maintenance ── */}
      <section className="rounded-2xl border border-mist bg-white p-6 shadow-sm sm:p-8">
        <h2 className="display text-xl text-navy">Maintenance</h2>
        <p className="mt-1 text-xs text-muted">
          You can always log in and use this admin panel, whatever is switched on here.
        </p>
        <div className="mt-5 space-y-3">
          <Toggle
            danger
            checked={form.maintenance.fullSite}
            onChange={(v) => setForm((p) => ({ ...p, maintenance: { ...p.maintenance, fullSite: v } }))}
            title="Full-site maintenance"
            description="Visitors see a maintenance page instead of the website. Use for big changes."
          />
          <Toggle
            danger
            checked={form.maintenance.payments}
            onChange={(v) => setForm((p) => ({ ...p, maintenance: { ...p.maintenance, payments: v } }))}
            title="Pause ordering only"
            description="Visitors can browse every tile as normal, but checkout is switched off."
          />
          <div>
            <label htmlFor="st-message" className={labelCls}>Message shown to visitors</label>
            <textarea
              id="st-message"
              rows={2}
              value={form.maintenance.message}
              onChange={(e) =>
                setForm((p) => ({ ...p, maintenance: { ...p.maintenance, message: e.target.value } }))
              }
              className={`${inputCls} resize-y`}
            />
          </div>
        </div>
      </section>

      {/* ── Payments ── */}
      <section className="rounded-2xl border border-mist bg-white p-6 shadow-sm sm:p-8">
        <h2 className="display text-xl text-navy">Payment methods</h2>
        <div className="mt-5 space-y-3">
          <Toggle
            checked={form.codEnabled}
            onChange={(v) => setForm((p) => ({ ...p, codEnabled: v }))}
            title="Cash on Delivery"
            description="Customers pay when the tiles arrive. This is the only live payment method."
          />
          <Toggle
            checked={form.razorpayEnabled}
            onChange={(v) => setForm((p) => ({ ...p, razorpayEnabled: v }))}
            title="Show Razorpay at checkout"
            description="Displays the Razorpay option marked “coming soon” — it can't take payments yet."
          />
        </div>
      </section>

      {/* ── Shop ── */}
      <section className="rounded-2xl border border-mist bg-white p-6 shadow-sm sm:p-8">
        <h2 className="display text-xl text-navy">Shop</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="st-currency" className={labelCls}>Currency symbol</label>
            <input
              id="st-currency"
              value={form.currencySymbol}
              onChange={(e) => setForm((p) => ({ ...p, currencySymbol: e.target.value }))}
              maxLength={4}
              className={inputCls}
            />
            <p className="mt-1 text-[0.7rem] text-muted">e.g. € or ₹ — shown on every price.</p>
          </div>
          <div>
            <label htmlFor="st-delivery" className={labelCls}>Delivery fee</label>
            <input
              id="st-delivery"
              type="number"
              min="0"
              step="0.01"
              value={form.deliveryFee}
              onChange={(e) => setForm((p) => ({ ...p, deliveryFee: Number(e.target.value) }))}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="st-free" className={labelCls}>Free delivery over</label>
            <input
              id="st-free"
              type="number"
              min="0"
              step="0.01"
              value={form.freeDeliveryOver}
              onChange={(e) => setForm((p) => ({ ...p, freeDeliveryOver: Number(e.target.value) }))}
              className={inputCls}
            />
            <p className="mt-1 text-[0.7rem] text-muted">Set 0 to never give free delivery.</p>
          </div>
        </div>
      </section>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-green disabled:opacity-60">
        {busy ? "Saving…" : saved ? "Saved ✓" : "Save settings"}
      </button>
    </form>
  );
}
