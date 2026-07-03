"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { useSettings } from "@/components/StoreProvider";
import { money } from "@/lib/format";

export function SqmStepper({
  sqm,
  onChange,
  compact = false,
}: {
  sqm: number;
  onChange: (next: number) => void;
  compact?: boolean;
}) {
  const btn = `flex items-center justify-center rounded-lg border border-mist font-bold text-navy transition hover:border-green hover:text-green ${
    compact ? "h-8 w-8 text-sm" : "h-10 w-10"
  }`;
  return (
    <div className="inline-flex items-center gap-2">
      <button type="button" aria-label="Less" className={btn} onClick={() => onChange(sqm - 0.5)}>
        −
      </button>
      <input
        type="number"
        min={0.5}
        max={500}
        step={0.5}
        value={sqm}
        onChange={(e) => onChange(Number(e.target.value) || 0.5)}
        aria-label="Square metres"
        className={`rounded-lg border border-mist bg-off text-center font-display font-bold text-navy outline-none focus:border-green ${
          compact ? "h-8 w-16 text-sm" : "h-10 w-20"
        }`}
      />
      <button type="button" aria-label="More" className={btn} onClick={() => onChange(sqm + 0.5)}>
        +
      </button>
      <span className="text-xs text-muted">m²</span>
    </div>
  );
}

export default function AddToCart({
  tileId,
  pricePerSqm,
  inStock,
}: {
  tileId: string;
  pricePerSqm: number;
  inStock: boolean;
}) {
  const { add } = useCart();
  const settings = useSettings();
  const [sqm, setSqm] = useState(1);
  const [added, setAdded] = useState(false);

  const clamp = (n: number) => Math.min(500, Math.max(0.5, Math.round(n * 2) / 2));

  if (!inStock) {
    return (
      <div className="rounded-xl border border-mist bg-off px-5 py-4">
        <p className="font-display text-sm font-bold text-navy">Currently out of stock</p>
        <p className="mt-1 text-xs text-muted">
          Ring us and we&apos;ll let you know the moment it&apos;s back.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-5">
        <SqmStepper sqm={sqm} onChange={(n) => setSqm(clamp(n))} />
        <p className="text-sm text-muted">
          ={" "}
          <span className="font-display font-bold text-navy">
            {money(pricePerSqm * sqm, settings.currencySymbol)}
          </span>
        </p>
      </div>
      <p className="mt-2 text-xs text-muted">
        Tip: measure your room, then add ~10% for cuts and spares.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="btn btn-green"
          onClick={() => {
            add(tileId, sqm);
            setAdded(true);
            setTimeout(() => setAdded(false), 2500);
          }}
        >
          {added ? "Added ✓" : "Add to cart"}
        </button>
        {added && (
          <Link href="/cart" className="font-display text-sm font-bold text-green hover:text-green-2">
            View cart →
          </Link>
        )}
      </div>
    </div>
  );
}
