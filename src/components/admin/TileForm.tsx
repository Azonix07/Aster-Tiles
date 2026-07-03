"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DbTile } from "@/lib/db";
import { effectivePrice, hasDiscount } from "@/lib/pricing";
import { money } from "@/lib/format";

const inputCls =
  "w-full rounded-xl border border-mist bg-off px-4 py-2.5 text-sm text-navy outline-none transition placeholder:text-muted/50 focus:border-green focus:ring-2 focus:ring-green/20";
const labelCls = "mb-1.5 block font-display text-xs font-bold text-navy";

interface TileFields {
  id: string;
  name: string;
  widthMm: string;
  heightMm: string;
  finish: string;
  material: string;
  category: string;
  texture: string;
  defaultGrout: string;
  pricePerSqm: string;
  discountPercent: string;
  bestFor: string;
  description: string;
  inStock: boolean;
}

function toFields(tile?: DbTile): TileFields {
  return {
    id: tile?.id ?? "",
    name: tile?.name ?? "",
    widthMm: String(tile?.widthMm ?? 600),
    heightMm: String(tile?.heightMm ?? 600),
    finish: tile?.finish ?? "Matt",
    material: tile?.material ?? "Porcelain",
    category: tile?.category ?? "stone",
    texture: tile?.texture ?? "",
    defaultGrout: tile?.defaultGrout ?? "#d8d4cf",
    pricePerSqm: String(tile?.pricePerSqm ?? 30),
    discountPercent: String(tile?.discountPercent ?? 0),
    bestFor: (tile?.bestFor ?? []).join(", "),
    description: tile?.description ?? "",
    inStock: tile?.inStock ?? true,
  };
}

export default function TileForm({ tile }: { tile?: DbTile }) {
  const router = useRouter();
  const isNew = !tile;
  const [form, setForm] = useState<TileFields>(toFields(tile));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const set =
    (field: keyof TileFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      ...form,
      widthMm: Number(form.widthMm),
      heightMm: Number(form.heightMm),
      pricePerSqm: Number(form.pricePerSqm),
      discountPercent: Number(form.discountPercent),
      inStock: form.inStock,
    };
    const res = await fetch(isNew ? "/api/admin/tiles" : `/api/admin/tiles/${tile.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      if (isNew) {
        router.push("/admin/tiles");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
      router.refresh();
    } else {
      setError(data?.error ?? "Could not save the tile.");
    }
    setBusy(false);
  };

  const remove = async () => {
    if (!tile) return;
    if (!window.confirm(`Delete "${tile.name}" from the catalogue? This can't be undone.`)) return;
    await fetch(`/api/admin/tiles/${tile.id}`, { method: "DELETE" });
    router.push("/admin/tiles");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <div className="rounded-2xl border border-mist bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="tf-name" className={labelCls}>Name</label>
            <input id="tf-name" required value={form.name} onChange={set("name")} placeholder="Venus Bianco" className={inputCls} />
          </div>
          <div>
            <label htmlFor="tf-id" className={labelCls}>
              URL id {isNew ? "" : "(fixed)"}
            </label>
            <input
              id="tf-id"
              value={form.id}
              onChange={set("id")}
              disabled={!isNew}
              required={isNew}
              placeholder="venus-bianco"
              className={`${inputCls} disabled:opacity-60`}
            />
          </div>
          <div>
            <label htmlFor="tf-price" className={labelCls}>Price per m²</label>
            <input id="tf-price" required type="number" min="0.5" step="0.01" value={form.pricePerSqm} onChange={set("pricePerSqm")} className={inputCls} />
          </div>
          <div>
            <label htmlFor="tf-discount" className={labelCls}>Discount %</label>
            <input id="tf-discount" type="number" min="0" max="100" step="1" value={form.discountPercent} onChange={set("discountPercent")} className={inputCls} />
            <p className="mt-1 text-[0.7rem] text-muted">0 = no discount. 10 = 10% off the price.</p>
          </div>
          <div>
            <label htmlFor="tf-category" className={labelCls}>Category</label>
            <select id="tf-category" value={form.category} onChange={set("category")} className={inputCls}>
              <option value="stone">Stone &amp; Marble</option>
              <option value="wood">Wood Effect</option>
              <option value="metro">Metro</option>
              <option value="pattern">Pattern</option>
            </select>
          </div>
          <div>
            <label htmlFor="tf-width" className={labelCls}>Width (mm)</label>
            <input id="tf-width" required type="number" min="1" value={form.widthMm} onChange={set("widthMm")} className={inputCls} />
          </div>
          <div>
            <label htmlFor="tf-height" className={labelCls}>Height (mm)</label>
            <input id="tf-height" required type="number" min="1" value={form.heightMm} onChange={set("heightMm")} className={inputCls} />
          </div>
          <div>
            <label htmlFor="tf-material" className={labelCls}>Material</label>
            <input id="tf-material" required value={form.material} onChange={set("material")} placeholder="Porcelain" className={inputCls} />
          </div>
          <div>
            <label htmlFor="tf-finish" className={labelCls}>Finish</label>
            <input id="tf-finish" required value={form.finish} onChange={set("finish")} placeholder="Matt" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="tf-texture" className={labelCls}>Image path or URL</label>
            <input id="tf-texture" required value={form.texture} onChange={set("texture")} placeholder="/media/tiles/venus-bianco.jpg" className={inputCls} />
            <p className="mt-1 text-[0.7rem] text-muted">
              Drop new images into <code>public/media/tiles/</code> and reference them as{" "}
              <code>/media/tiles/your-image.jpg</code>.
            </p>
          </div>
          <div>
            <label htmlFor="tf-grout" className={labelCls}>Suggested grout colour</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                aria-label="Grout colour picker"
                value={/^#[0-9a-fA-F]{6}$/.test(form.defaultGrout) ? form.defaultGrout : "#d8d4cf"}
                onChange={set("defaultGrout")}
                className="h-10 w-12 cursor-pointer rounded-lg border border-mist"
              />
              <input id="tf-grout" value={form.defaultGrout} onChange={set("defaultGrout")} className={inputCls} />
            </div>
          </div>
          <div>
            <label htmlFor="tf-bestfor" className={labelCls}>Best for <span className="font-normal text-muted">(comma separated)</span></label>
            <input id="tf-bestfor" value={form.bestFor} onChange={set("bestFor")} placeholder="Bathrooms, Kitchens" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="tf-desc" className={labelCls}>Description</label>
            <textarea id="tf-desc" rows={3} required value={form.description} onChange={set("description")} className={`${inputCls} resize-y`} />
          </div>
          <label className="flex items-center gap-2.5 text-sm text-navy sm:col-span-2">
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={(e) => setForm((prev) => ({ ...prev, inStock: e.target.checked }))}
              className="h-4 w-4 accent-green"
            />
            In stock — customers can add this tile to their cart
          </label>
        </div>

        {error && <p className="mt-4 text-sm font-medium text-red-500">{error}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={busy} className="btn btn-green disabled:opacity-60">
            {busy ? "Saving…" : saved ? "Saved ✓" : isNew ? "Add tile" : "Save changes"}
          </button>
          {!isNew && (
            <button type="button" onClick={remove} className="text-sm font-bold text-red-500 hover:text-red-600">
              Delete tile
            </button>
          )}
        </div>
      </div>

      {/* live preview */}
      <aside className="rounded-2xl border border-mist bg-white p-6 shadow-sm">
        <p className="font-display text-xs font-bold tracking-wide text-muted uppercase">Preview</p>
        <div className="relative mt-4 aspect-square overflow-hidden rounded-xl bg-mist">
          {form.texture && (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview accepts arbitrary URLs
            <img src={form.texture} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          {form.finish && (
            <span className="absolute top-3 left-3 rounded-full bg-ink/65 px-3 py-1 font-display text-[0.62rem] font-bold tracking-[0.08em] text-white uppercase">
              {form.finish}
            </span>
          )}
          {Number(form.discountPercent) > 0 && (
            <span className="absolute top-3 right-3 rounded-full bg-red-500 px-3 py-1 font-display text-[0.62rem] font-bold tracking-[0.08em] text-white uppercase">
              {form.discountPercent}% OFF
            </span>
          )}
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-bold text-navy">{form.name || "Tile name"}</p>
            <p className="mt-1 text-xs text-muted">
              {form.material || "Material"} · {form.widthMm || "?"} × {form.heightMm || "?"} mm
            </p>
          </div>
          <div className="text-right">
            {Number(form.discountPercent) > 0 ? (
              <>
                <p className="font-display text-sm text-muted line-through">
                  {money(Number(form.pricePerSqm) || 0, "€")}
                </p>
                <p className="font-display text-lg font-bold text-red-500">
                  {money(
                    effectivePrice({ pricePerSqm: Number(form.pricePerSqm) || 0, discountPercent: Number(form.discountPercent) }),
                    "€"
                  )}
                </p>
              </>
            ) : (
              <p className="font-display text-lg font-bold text-navy">{form.pricePerSqm || "—"}</p>
            )}
          </div>
        </div>
      </aside>
    </form>
  );
}
