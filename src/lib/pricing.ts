import type { Tile } from "@/lib/tiles";

/** Returns the effective per-m² price after discount. */
export function effectivePrice(tile: Pick<Tile, "pricePerSqm" | "discountPercent">): number {
  const pct = tile.discountPercent ?? 0;
  if (pct <= 0) return tile.pricePerSqm;
  return Math.round(tile.pricePerSqm * (1 - pct / 100) * 100) / 100;
}

/** True when the tile has a non-zero discount. */
export function hasDiscount(tile: Pick<Tile, "discountPercent">): boolean {
  return (tile.discountPercent ?? 0) > 0;
}
