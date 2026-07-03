import type { DbTile } from "@/lib/db";

/** Validate + normalise an admin-submitted tile; returns an error string when invalid. */
export function sanitizeTile(raw: Record<string, unknown>, existing?: DbTile): DbTile | string {
  const str = (v: unknown, fallback = "") => String(v ?? fallback).trim();
  const num = (v: unknown, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const id =
    existing?.id ??
    str(raw.id)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  if (!id) return "The tile needs a URL id (letters, numbers, dashes).";
  const name = str(raw.name, existing?.name);
  if (!name) return "The tile needs a name.";
  const texture = str(raw.texture, existing?.texture);
  if (!texture) return "The tile needs an image path or URL.";
  const category = str(raw.category, existing?.category ?? "stone") as DbTile["category"];
  if (!["stone", "wood", "metro", "pattern"].includes(category)) return "Unknown category.";

  return {
    id,
    name,
    widthMm: num(raw.widthMm, existing?.widthMm ?? 600),
    heightMm: num(raw.heightMm, existing?.heightMm ?? 600),
    finish: str(raw.finish, existing?.finish ?? "Matt"),
    material: str(raw.material, existing?.material ?? "Porcelain"),
    category,
    texture,
    defaultGrout: str(raw.defaultGrout, existing?.defaultGrout ?? "#d8d4cf"),
    pricePerSqm: num(raw.pricePerSqm, existing?.pricePerSqm ?? 30),
    discountPercent: Math.min(100, Math.max(0, Math.round(Number(raw.discountPercent ?? existing?.discountPercent ?? 0)) || 0)),
    bestFor: Array.isArray(raw.bestFor)
      ? raw.bestFor.map((b) => String(b).trim()).filter(Boolean)
      : String(raw.bestFor ?? "")
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean),
    description: str(raw.description, existing?.description),
    inStock: raw.inStock === undefined ? (existing?.inStock ?? true) : Boolean(raw.inStock),
  };
}
