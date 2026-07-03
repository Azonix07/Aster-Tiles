"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CollectionInfo,
  GalleryItem,
  SiteContent,
  SiteInfo,
  StaffMember,
  Testimonial,
} from "@/lib/db";

const inputCls =
  "w-full rounded-xl border border-mist bg-off px-4 py-2.5 text-sm text-navy outline-none transition placeholder:text-muted/50 focus:border-green focus:ring-2 focus:ring-green/20";
const labelCls = "mb-1.5 block font-display text-xs font-bold text-navy";
const cardCls = "rounded-2xl border border-mist bg-white p-6 shadow-sm sm:p-8";

function useSaveSection() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (section: keyof SiteContent, value: unknown) => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, value }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not save.");
    }
    setBusy(false);
  };

  return { save, busy, saved, error };
}

function SaveButton({ busy, saved }: { busy: boolean; saved: boolean }) {
  return (
    <button type="submit" disabled={busy} className="btn btn-green px-6 py-2.5 text-xs disabled:opacity-60">
      {busy ? "Saving…" : saved ? "Saved ✓" : "Save this section"}
    </button>
  );
}

/* ── Business info ─────────────────────────────────── */

export function SiteInfoForm({ initial }: { initial: SiteInfo }) {
  const { save, busy, saved, error } = useSaveSection();
  const [form, setForm] = useState<SiteInfo>(structuredClone(initial));

  const set = (field: keyof SiteInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = form.phone.replace(/[^\d+]/g, "");
    save("site", {
      ...form,
      phoneHref: `tel:${phoneDigits}`,
      emailHref: `mailto:${form.email.trim()}`,
      stats: form.stats.map((s) => ({ ...s, value: Number(s.value) || 0 })),
    });
  };

  return (
    <form onSubmit={submit} className={cardCls}>
      <h2 className="display text-xl text-navy">Business info</h2>
      <p className="mt-1 text-xs text-muted">
        Name, contact details, opening hours and the headline numbers shown around the site.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Shop name</label>
          <input required value={form.name} onChange={set("name")} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Tagline</label>
          <input required value={form.tagline} onChange={set("tagline")} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Description (used for SEO)</label>
          <textarea rows={2} required value={form.description} onChange={set("description")} className={`${inputCls} resize-y`} />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input required value={form.phone} onChange={set("phone")} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input required type="email" value={form.email} onChange={set("email")} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Address line 1</label>
          <input
            required
            value={form.address.line1}
            onChange={(e) => setForm((p) => ({ ...p, address: { ...p.address, line1: e.target.value } }))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Address line 2</label>
          <input
            required
            value={form.address.line2}
            onChange={(e) => setForm((p) => ({ ...p, address: { ...p.address, line2: e.target.value } }))}
            className={inputCls}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Google Maps link</label>
          <input
            value={form.address.mapsUrl}
            onChange={(e) => setForm((p) => ({ ...p, address: { ...p.address, mapsUrl: e.target.value } }))}
            className={inputCls}
          />
        </div>
      </div>

      <h3 className="mt-8 font-display text-sm font-bold text-navy">Opening hours</h3>
      <div className="mt-3 space-y-3">
        {form.hours.map((h, i) => (
          <div key={i} className="grid grid-cols-2 gap-3">
            <input
              aria-label="Days"
              value={h.days}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  hours: p.hours.map((row, j) => (j === i ? { ...row, days: e.target.value } : row)),
                }))
              }
              className={inputCls}
            />
            <div className="flex gap-2">
              <input
                aria-label="Times"
                value={h.time}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    hours: p.hours.map((row, j) => (j === i ? { ...row, time: e.target.value } : row)),
                  }))
                }
                className={inputCls}
              />
              <button
                type="button"
                aria-label="Remove row"
                onClick={() => setForm((p) => ({ ...p, hours: p.hours.filter((_, j) => j !== i) }))}
                className="shrink-0 text-xs font-bold text-muted hover:text-red-500"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, hours: [...p.hours, { days: "", time: "" }] }))}
          className="text-xs font-bold text-green hover:text-green-2"
        >
          + Add a row
        </button>
      </div>

      <h3 className="mt-8 font-display text-sm font-bold text-navy">Headline stats</h3>
      <div className="mt-3 space-y-3">
        {form.stats.map((s, i) => (
          <div key={i} className="grid grid-cols-3 gap-3">
            <input
              aria-label="Value"
              type="number"
              value={s.value}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  stats: p.stats.map((row, j) => (j === i ? { ...row, value: Number(e.target.value) } : row)),
                }))
              }
              className={inputCls}
            />
            <input
              aria-label="Suffix"
              value={s.suffix}
              placeholder="+"
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  stats: p.stats.map((row, j) => (j === i ? { ...row, suffix: e.target.value } : row)),
                }))
              }
              className={inputCls}
            />
            <input
              aria-label="Label"
              value={s.label}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  stats: p.stats.map((row, j) => (j === i ? { ...row, label: e.target.value } : row)),
                }))
              }
              className={inputCls}
            />
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="mt-6">
        <SaveButton busy={busy} saved={saved} />
      </div>
    </form>
  );
}

/* ── Generic list editors ──────────────────────────── */

export function StaffForm({ initial }: { initial: StaffMember[] }) {
  const { save, busy, saved, error } = useSaveSection();
  const [rows, setRows] = useState<StaffMember[]>(structuredClone(initial));

  const update = (i: number, field: keyof StaffMember, value: string) =>
    setRows((p) => p.map((r, j) => (j === i ? { ...r, [field]: value } : r)));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save("staff", rows.map((r) => ({ ...r, id: r.id || r.name.toLowerCase().replace(/\s+/g, "-") })));
      }}
      className={cardCls}
    >
      <h2 className="display text-xl text-navy">Team</h2>
      <p className="mt-1 text-xs text-muted">The people shown on the About page.</p>

      <div className="mt-6 space-y-6">
        {rows.map((r, i) => (
          <div key={i} className="rounded-xl border border-mist p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <input aria-label="Name" required placeholder="Name" value={r.name} onChange={(e) => update(i, "name", e.target.value)} className={inputCls} />
              <input aria-label="Role" required placeholder="Role" value={r.role} onChange={(e) => update(i, "role", e.target.value)} className={inputCls} />
              <input aria-label="Photo" required placeholder="/media/staff/photo.jpg" value={r.photo} onChange={(e) => update(i, "photo", e.target.value)} className={`${inputCls} sm:col-span-2`} />
              <textarea aria-label="Bio" required rows={2} placeholder="Short bio" value={r.bio} onChange={(e) => update(i, "bio", e.target.value)} className={`${inputCls} resize-y sm:col-span-2`} />
            </div>
            <button
              type="button"
              onClick={() => setRows((p) => p.filter((_, j) => j !== i))}
              className="mt-3 text-xs font-bold text-muted hover:text-red-500"
            >
              Remove person
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRows((p) => [...p, { id: "", name: "", role: "", bio: "", photo: "" }])}
        className="mt-4 text-xs font-bold text-green hover:text-green-2"
      >
        + Add a person
      </button>

      {error && <p className="mt-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="mt-6">
        <SaveButton busy={busy} saved={saved} />
      </div>
    </form>
  );
}

export function TestimonialsForm({ initial }: { initial: Testimonial[] }) {
  const { save, busy, saved, error } = useSaveSection();
  const [rows, setRows] = useState<Testimonial[]>(structuredClone(initial));

  const update = (i: number, field: keyof Testimonial, value: string) =>
    setRows((p) => p.map((r, j) => (j === i ? { ...r, [field]: value } : r)));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save("testimonials", rows);
      }}
      className={cardCls}
    >
      <h2 className="display text-xl text-navy">Testimonials</h2>
      <p className="mt-1 text-xs text-muted">Customer quotes shown on the home page.</p>

      <div className="mt-6 space-y-6">
        {rows.map((r, i) => (
          <div key={i} className="rounded-xl border border-mist p-4">
            <textarea aria-label="Quote" required rows={2} placeholder="Quote" value={r.quote} onChange={(e) => update(i, "quote", e.target.value)} className={`${inputCls} resize-y`} />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input aria-label="Name" required placeholder="Name" value={r.name} onChange={(e) => update(i, "name", e.target.value)} className={inputCls} />
              <input aria-label="Location" required placeholder="Location" value={r.location} onChange={(e) => update(i, "location", e.target.value)} className={inputCls} />
            </div>
            <button
              type="button"
              onClick={() => setRows((p) => p.filter((_, j) => j !== i))}
              className="mt-3 text-xs font-bold text-muted hover:text-red-500"
            >
              Remove testimonial
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRows((p) => [...p, { quote: "", name: "", location: "" }])}
        className="mt-4 text-xs font-bold text-green hover:text-green-2"
      >
        + Add a testimonial
      </button>

      {error && <p className="mt-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="mt-6">
        <SaveButton busy={busy} saved={saved} />
      </div>
    </form>
  );
}

export function CollectionsForm({ initial }: { initial: CollectionInfo[] }) {
  const { save, busy, saved, error } = useSaveSection();
  const [rows, setRows] = useState<CollectionInfo[]>(structuredClone(initial));

  const update = (i: number, field: keyof CollectionInfo, value: string) =>
    setRows((p) => p.map((r, j) => (j === i ? { ...r, [field]: value } : r)));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save("collections", rows);
      }}
      className={cardCls}
    >
      <h2 className="display text-xl text-navy">Collection categories</h2>
      <p className="mt-1 text-xs text-muted">
        The six big category chapters on the Collections page and home page rail.
      </p>

      <div className="mt-6 space-y-6">
        {rows.map((r, i) => (
          <div key={r.id || i} className="rounded-xl border border-mist p-4">
            <p className="font-display text-xs font-bold text-muted uppercase">{r.id}</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <input aria-label="Name" required placeholder="Name" value={r.name} onChange={(e) => update(i, "name", e.target.value)} className={inputCls} />
              <input aria-label="Blurb" required placeholder="Blurb" value={r.blurb} onChange={(e) => update(i, "blurb", e.target.value)} className={inputCls} />
              <input aria-label="Image" required placeholder="/media/categories/image.jpg" value={r.image} onChange={(e) => update(i, "image", e.target.value)} className={`${inputCls} sm:col-span-2`} />
              <textarea aria-label="Description" required rows={2} placeholder="Description" value={r.description} onChange={(e) => update(i, "description", e.target.value)} className={`${inputCls} resize-y sm:col-span-2`} />
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="mt-6">
        <SaveButton busy={busy} saved={saved} />
      </div>
    </form>
  );
}

export function GalleryForm({ initial }: { initial: GalleryItem[] }) {
  const { save, busy, saved, error } = useSaveSection();
  const [rows, setRows] = useState<GalleryItem[]>(structuredClone(initial));

  const update = (i: number, field: keyof GalleryItem, value: string) =>
    setRows((p) => p.map((r, j) => (j === i ? { ...r, [field]: value } : r)));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(
          "gallery",
          rows.map((r) => ({ ...r, id: r.id || r.tag.toLowerCase().replace(/\s+/g, "-") })),
        );
      }}
      className={cardCls}
    >
      <h2 className="display text-xl text-navy">Gallery wall</h2>
      <p className="mt-1 text-xs text-muted">The photo grid on the home page.</p>

      <div className="mt-6 space-y-4">
        {rows.map((r, i) => (
          <div key={i} className="grid gap-3 rounded-xl border border-mist p-4 sm:grid-cols-[2fr_1.2fr_auto_auto]">
            <input aria-label="Image" required placeholder="/media/gallery/image.jpg" value={r.image} onChange={(e) => update(i, "image", e.target.value)} className={inputCls} />
            <input aria-label="Tag" required placeholder="Caption tag" value={r.tag} onChange={(e) => update(i, "tag", e.target.value)} className={inputCls} />
            <select aria-label="Shape" value={r.span} onChange={(e) => update(i, "span", e.target.value)} className={inputCls}>
              <option value="std">Standard</option>
              <option value="wide">Wide</option>
              <option value="tall">Tall</option>
            </select>
            <button
              type="button"
              onClick={() => setRows((p) => p.filter((_, j) => j !== i))}
              className="text-xs font-bold text-muted hover:text-red-500"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRows((p) => [...p, { id: "", image: "", tag: "", span: "std" }])}
        className="mt-4 text-xs font-bold text-green hover:text-green-2"
      >
        + Add a photo
      </button>

      {error && <p className="mt-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="mt-6">
        <SaveButton busy={busy} saved={saved} />
      </div>
    </form>
  );
}
