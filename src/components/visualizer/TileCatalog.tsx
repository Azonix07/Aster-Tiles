"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { tileCategories, type Tile, type TileCategory } from "@/lib/tiles";
import { useTiles } from "@/components/StoreProvider";

/** Filled / outline heart used for favourites. */
function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill={filled ? "#2db87c" : "none"}
      stroke={filled ? "#2db87c" : "currentColor"}
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

export default function TileCatalog({
  selectedId,
  onSelect,
  favorites,
  onToggleFavorite,
}: {
  selectedId: string;
  onSelect: (tile: Tile) => void;
  favorites: ReadonlySet<string>;
  onToggleFavorite: (id: string) => void;
}) {
  const tiles = useTiles();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<TileCategory | "all">("all");
  const [favsOnly, setFavsOnly] = useState(false);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tiles.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (favsOnly && !favorites.has(t.id)) return false;
      if (
        q &&
        !t.name.toLowerCase().includes(q) &&
        !t.material.toLowerCase().includes(q) &&
        !t.finish.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [tiles, search, category, favsOnly, favorites]);

  return (
    <aside className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-navy-2/50">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-sm font-bold text-white">Tile Library</h2>
          <button
            type="button"
            onClick={() => setFavsOnly((v) => !v)}
            aria-pressed={favsOnly}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold transition-colors ${
              favsOnly
                ? "border-green/60 bg-green/15 text-green"
                : "border-white/15 text-white/55 hover:border-white/35 hover:text-white/80"
            }`}
          >
            <Heart filled={favsOnly} />
            Favourites
          </button>
        </div>

        <div className="relative mt-3">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tiles…"
            aria-label="Search tiles"
            className="w-full rounded-lg border border-white/10 bg-ink/60 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-green/60"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {tileCategories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              aria-pressed={category === c.key}
              className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold transition-colors ${
                category === c.key
                  ? "bg-green text-white"
                  : "bg-white/5 text-white/55 hover:bg-white/10 hover:text-white/85"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div
        data-lenis-prevent
        className="thin-scroll min-h-0 flex-1 overflow-y-auto p-3 lg:max-h-[calc(100vh-220px)]"
      >
        {list.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <div className="flex justify-center text-white/40" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <p className="mt-2 text-sm text-white/55">
              {favsOnly && favorites.size === 0
                ? "No favourites yet — tap a heart to save tiles you love."
                : "No tiles match. Try a different search or category."}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {list.map((t, i) => {
              const selected = t.id === selectedId;
              const fav = favorites.has(t.id);
              return (
                <li key={t.id}>
                  <div
                    className={`group relative flex w-full items-center gap-3 rounded-xl border p-2 transition-all ${
                      selected
                        ? "border-green/70 bg-green/10"
                        : "border-white/10 bg-ink/40 hover:border-white/30 hover:bg-ink/70"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(t)}
                      aria-pressed={selected}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={t.texture}
                          alt={t.name}
                          fill
                          sizes="56px"
                          loading={i < 4 ? "eager" : undefined}
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-white">
                          {t.name}
                        </span>
                        <span className="mt-0.5 block text-[0.68rem] text-white/50">
                          {t.widthMm} × {t.heightMm} mm · {t.finish}
                        </span>
                        <span className="mt-0.5 block text-[0.7rem] font-semibold text-green">
                          €{t.pricePerSqm}/m²
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(t.id)}
                      aria-label={fav ? `Remove ${t.name} from favourites` : `Add ${t.name} to favourites`}
                      aria-pressed={fav}
                      className="shrink-0 rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Heart filled={fav} />
                    </button>
                    {selected && (
                      <span className="pointer-events-none absolute -left-px top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-full bg-green" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-white/10 px-4 py-2.5 text-[0.68rem] text-white/40">
        {list.length} of {tiles.length} tiles · in-store we stock 500+
      </div>
    </aside>
  );
}
