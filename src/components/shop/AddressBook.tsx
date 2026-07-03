"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Address } from "@/lib/db";

const inputCls =
  "w-full rounded-xl border border-mist bg-off px-4 py-2.5 text-sm text-navy outline-none transition placeholder:text-muted/50 focus:border-green focus:ring-2 focus:ring-green/20";

type AddressFields = Omit<Address, "id">;

const EMPTY: AddressFields = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  county: "",
  postcode: "",
};

export default function AddressBook({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<AddressFields>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (field: keyof AddressFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm(EMPTY);
      setAdding(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not save the address.");
    }
    setBusy(false);
  };

  const removeAddress = async (id: string) => {
    await fetch("/api/account/addresses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  };

  return (
    <div>
      {addresses.length === 0 && !adding && (
        <p className="text-sm text-muted">No saved addresses yet.</p>
      )}

      <ul className="space-y-3">
        {addresses.map((a) => (
          <li
            key={a.id}
            className="flex items-start justify-between gap-4 rounded-xl border border-mist bg-off px-4 py-3"
          >
            <div className="text-sm">
              <p className="font-bold text-navy">{a.fullName}</p>
              <p className="mt-0.5 text-muted">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.county}, {a.postcode}
              </p>
              <p className="mt-0.5 text-xs text-muted">{a.phone}</p>
            </div>
            <button
              type="button"
              onClick={() => removeAddress(a.id)}
              className="shrink-0 text-xs font-bold text-muted transition hover:text-red-500"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {adding ? (
        <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input required placeholder="Full name" value={form.fullName} onChange={set("fullName")} className={inputCls} />
          <input required type="tel" placeholder="Phone" value={form.phone} onChange={set("phone")} className={inputCls} />
          <input required placeholder="Address line 1" value={form.line1} onChange={set("line1")} className={`${inputCls} sm:col-span-2`} />
          <input placeholder="Address line 2 (optional)" value={form.line2} onChange={set("line2")} className={`${inputCls} sm:col-span-2`} />
          <input required placeholder="Town / City" value={form.city} onChange={set("city")} className={inputCls} />
          <input required placeholder="County / State" value={form.county} onChange={set("county")} className={inputCls} />
          <input required placeholder="Postcode / PIN" value={form.postcode} onChange={set("postcode")} className={inputCls} />
          {error && <p className="text-xs font-medium text-red-500 sm:col-span-2">{error}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={busy} className="btn btn-green px-5 py-2.5 text-xs disabled:opacity-60">
              {busy ? "Saving…" : "Save address"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="btn btn-ghost-dark px-5 py-2.5 text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-4 font-display text-sm font-bold text-green hover:text-green-2"
        >
          + Add an address
        </button>
      )}
    </div>
  );
}
