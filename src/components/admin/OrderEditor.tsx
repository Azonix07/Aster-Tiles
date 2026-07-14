"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { money } from "@/lib/format";
import type { Order } from "@/lib/shopTypes";

const inputCls =
  "w-full rounded-xl border border-mist bg-off px-3 py-2 text-sm text-navy outline-none transition focus:border-green focus:ring-2 focus:ring-green/20";
const labelCls = "mb-1 block font-display text-[0.7rem] font-bold text-navy";

type CatalogTile = { id: string; name: string; price: number; image: string; inStock: boolean };
type EditItem = { tileId: string; name: string; image: string; price: number; sqm: number };

const clampSqm = (n: number) => Math.min(500, Math.max(0.5, Math.round(n * 2) / 2));

export default function OrderEditor({
  order,
  catalog,
}: {
  order: Order;
  catalog: CatalogTile[];
}) {
  const router = useRouter();
  const symbol = order.currencySymbol;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<EditItem[]>(() =>
    // Existing lines keep their stored (agreed) price — the server preserves it
    // too, so the preview matches what's saved. Newly added tiles are priced at
    // the current catalogue rate when added.
    order.items.map((i) => ({
      tileId: i.tileId,
      name: i.name,
      image: i.image,
      price: i.pricePerSqm,
      sqm: i.sqm,
    })),
  );
  const [address, setAddress] = useState({ ...order.address });
  const [deliveryFee, setDeliveryFee] = useState(String(order.deliveryFee));
  const [addTileId, setAddTileId] = useState("");

  const subtotal = useMemo(
    () => Math.round(items.reduce((s, i) => s + i.price * clampSqm(i.sqm), 0) * 100) / 100,
    [items],
  );
  const feeNum = Number(deliveryFee) || 0;
  const total = Math.round((subtotal + Math.max(0, feeNum)) * 100) / 100;

  const setSqm = (tileId: string, sqm: number) =>
    setItems((prev) => prev.map((i) => (i.tileId === tileId ? { ...i, sqm } : i)));
  const removeItem = (tileId: string) =>
    setItems((prev) => prev.filter((i) => i.tileId !== tileId));
  const addTile = () => {
    const cat = catalog.find((c) => c.id === addTileId);
    if (!cat) return;
    setItems((prev) =>
      prev.some((i) => i.tileId === cat.id)
        ? prev
        : [...prev, { tileId: cat.id, name: cat.name, image: cat.image, price: cat.price, sqm: 1 }],
    );
    setAddTileId("");
  };

  const setAddr = (k: keyof typeof address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress((prev) => ({ ...prev, [k]: e.target.value }));

  const save = async () => {
    if (items.length === 0) {
      setError("An order needs at least one item.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ tileId: i.tileId, sqm: clampSqm(i.sqm) })),
        address,
        deliveryFee: Math.max(0, feeNum),
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(data?.error ?? "Could not save the order.");
    }
    setBusy(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-mist px-4 py-2 font-display text-xs font-bold text-navy transition hover:border-green hover:text-green"
      >
        Edit items & address
      </button>
    );
  }

  const addable = catalog.filter((c) => !items.some((i) => i.tileId === c.id));

  return (
    <div className="rounded-2xl border border-green/40 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="display text-xl text-navy">Edit order</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-bold text-muted hover:text-navy"
        >
          Cancel
        </button>
      </div>

      {/* Items */}
      <div className="mt-5 space-y-3">
        {items.map((i) => (
          <div key={i.tileId} className="flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-mist">
              <Image src={i.image} alt={i.name} fill sizes="44px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-xs font-bold text-navy">{i.name}</p>
              <p className="text-[0.7rem] text-muted">{money(i.price, symbol)}/m²</p>
            </div>
            <input
              type="number"
              min={0.5}
              max={500}
              step={0.5}
              value={i.sqm}
              onChange={(e) => setSqm(i.tileId, Number(e.target.value))}
              className="w-20 rounded-lg border border-mist bg-off px-2 py-1.5 text-sm text-navy outline-none focus:border-green"
              aria-label={`${i.name} square metres`}
            />
            <span className="w-20 text-right font-display text-xs font-bold text-navy">
              {money(Math.round(i.price * clampSqm(i.sqm) * 100) / 100, symbol)}
            </span>
            <button
              type="button"
              onClick={() => removeItem(i.tileId)}
              className="rounded-lg border border-mist px-2 py-1 text-xs font-bold text-red-500 transition hover:border-red-300 hover:bg-red-50"
              aria-label={`Remove ${i.name}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add tile */}
      {addable.length > 0 && (
        <div className="mt-4 flex gap-2">
          <select
            value={addTileId}
            onChange={(e) => setAddTileId(e.target.value)}
            className={inputCls}
            aria-label="Add a tile"
          >
            <option value="">+ Add a tile…</option>
            {addable.map((c) => (
              <option key={c.id} value={c.id} disabled={!c.inStock}>
                {c.name} — {money(c.price, symbol)}/m²{c.inStock ? "" : " (out of stock)"}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addTile}
            disabled={!addTileId}
            className="btn btn-green shrink-0 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}

      {/* Delivery + totals */}
      <div className="mt-5 border-t border-mist pt-4">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="oe-fee" className={labelCls}>Delivery fee ({symbol})</label>
          <input
            id="oe-fee"
            type="number"
            min={0}
            step="0.01"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            className="w-28 rounded-lg border border-mist bg-off px-2 py-1.5 text-right text-sm text-navy outline-none focus:border-green"
          />
        </div>
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-bold text-navy">{money(subtotal, symbol)}</dd>
          </div>
          <div className="flex justify-between text-base">
            <dt className="font-display font-bold text-navy">Total</dt>
            <dd className="font-display font-bold text-navy">{money(total, symbol)}</dd>
          </div>
        </dl>
      </div>

      {/* Address */}
      <div className="mt-6 border-t border-mist pt-4">
        <p className="font-display text-xs font-bold text-navy">Delivery address</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={labelCls}>Full name</label>
            <input value={address.fullName} onChange={setAddr("fullName")} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Phone</label>
            <input value={address.phone} onChange={setAddr("phone")} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Address line 1</label>
            <input value={address.line1} onChange={setAddr("line1")} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Address line 2</label>
            <input value={address.line2} onChange={setAddr("line2")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>City</label>
            <input value={address.city} onChange={setAddr("city")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>County</label>
            <input value={address.county} onChange={setAddr("county")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Postcode</label>
            <input value={address.postcode} onChange={setAddr("postcode")} className={inputCls} />
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-xs font-medium text-red-500">{error}</p>}

      <div className="mt-5 flex gap-2">
        <button type="button" onClick={save} disabled={busy} className="btn btn-green disabled:opacity-60">
          {busy ? "Saving…" : "Save order"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-mist px-4 py-2 text-sm font-bold text-muted transition hover:text-navy"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
