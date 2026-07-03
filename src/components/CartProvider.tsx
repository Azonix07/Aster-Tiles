"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSettings, useTiles } from "@/components/StoreProvider";
import type { DbTile } from "@/lib/db";

export interface CartItem {
  tileId: string;
  /** square metres ordered */
  sqm: number;
}

interface CartValue {
  items: CartItem[];
  add: (tileId: string, sqm: number) => void;
  setSqm: (tileId: string, sqm: number) => void;
  remove: (tileId: string) => void;
  clear: () => void;
  count: number;
}

const CartContext = createContext<CartValue | null>(null);

const STORAGE_KEY = "aster_cart";

function clampSqm(sqm: number): number {
  return Math.min(500, Math.max(0.5, Math.round(sqm * 2) / 2));
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          setItems(
            parsed.filter(
              (i) => typeof i?.tileId === "string" && Number.isFinite(i?.sqm) && i.sqm > 0,
            ),
          );
        }
      }
    } catch {
      /* corrupted cart — start fresh */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const value = useMemo<CartValue>(
    () => ({
      items,
      add: (tileId, sqm) =>
        setItems((prev) => {
          const existing = prev.find((i) => i.tileId === tileId);
          if (existing) {
            return prev.map((i) =>
              i.tileId === tileId ? { ...i, sqm: clampSqm(i.sqm + sqm) } : i,
            );
          }
          return [...prev, { tileId, sqm: clampSqm(sqm) }];
        }),
      setSqm: (tileId, sqm) =>
        setItems((prev) => prev.map((i) => (i.tileId === tileId ? { ...i, sqm: clampSqm(sqm) } : i))),
      remove: (tileId) => setItems((prev) => prev.filter((i) => i.tileId !== tileId)),
      clear: () => setItems([]),
      count: items.length,
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export interface CartLine {
  tile: DbTile;
  sqm: number;
  lineTotal: number;
}

/** Cart items joined with live tile data + totals. */
export function useCartDetails() {
  const { items } = useCart();
  const tiles = useTiles();
  const settings = useSettings();

  const lines: CartLine[] = items.flatMap((item) => {
    const tile = tiles.find((t) => t.id === item.tileId);
    if (!tile) return [];
    return [{ tile, sqm: item.sqm, lineTotal: Math.round(tile.pricePerSqm * item.sqm * 100) / 100 }];
  });

  const subtotal = Math.round(lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;
  const deliveryFee =
    lines.length === 0
      ? 0
      : settings.freeDeliveryOver > 0 && subtotal >= settings.freeDeliveryOver
        ? 0
        : settings.deliveryFee;
  const total = Math.round((subtotal + deliveryFee) * 100) / 100;

  return { lines, subtotal, deliveryFee, total };
}
