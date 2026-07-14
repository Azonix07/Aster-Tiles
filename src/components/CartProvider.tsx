"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSettings, useTiles, useUser } from "@/components/StoreProvider";
import { effectivePrice } from "@/lib/pricing";
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

const LEGACY_KEY = "aster_cart";
const GUEST_KEY = "aster_cart:guest";

function clampSqm(sqm: number): number {
  return Math.min(500, Math.max(0.5, Math.round(sqm * 2) / 2));
}

function readCart(key: string): CartItem[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i) => typeof i?.tileId === "string" && Number.isFinite(i?.sqm) && i.sqm > 0,
    );
  } catch {
    return [];
  }
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();
  // Each account gets its own cart; guests get a separate one, so logging
  // out never leaks the account's cart into the browser session.
  const storageKey = user ? `aster_cart:${user.id}` : GUEST_KEY;
  const [items, setItems] = useState<CartItem[]>([]);
  // The key `items` was loaded from — gates persistence so we never write
  // one cart's items under another key while switching users.
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      // One-time migration: the old single shared cart becomes the guest cart.
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        if (!localStorage.getItem(GUEST_KEY)) localStorage.setItem(GUEST_KEY, legacy);
        localStorage.removeItem(LEGACY_KEY);
      }

      const cart = readCart(storageKey);
      if (user) {
        // Items picked while logged out follow the user into their account.
        const guest = readCart(GUEST_KEY);
        if (guest.length > 0) {
          for (const g of guest) {
            const existing = cart.find((i) => i.tileId === g.tileId);
            if (existing) existing.sqm = clampSqm(existing.sqm + g.sqm);
            else cart.push({ tileId: g.tileId, sqm: clampSqm(g.sqm) });
          }
          localStorage.removeItem(GUEST_KEY);
          localStorage.setItem(storageKey, JSON.stringify(cart));
        }
      }
      // Hydrating from localStorage must happen in an effect: reading it
      // during render would diverge from the server-rendered markup.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(cart);
    } catch {
      setItems([]);
    }
    setActiveKey(storageKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (activeKey === storageKey) localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, activeKey, storageKey]);

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
    // Use the discounted price so cart, checkout summary and the server order agree.
    const unit = effectivePrice(tile);
    return [{ tile, sqm: item.sqm, lineTotal: Math.round(unit * item.sqm * 100) / 100 }];
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
