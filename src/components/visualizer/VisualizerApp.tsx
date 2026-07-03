"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { type Tile } from "@/lib/tiles";
import { useTiles } from "@/components/StoreProvider";
import TileCatalog from "@/components/visualizer/TileCatalog";
import StudioMode from "@/components/visualizer/StudioMode";
import PhotoMode from "@/components/visualizer/PhotoMode";
import AiMode from "@/components/visualizer/AiMode";

type Mode = "studio" | "photo" | "ai";

const FAVS_KEY = "aster-tiles-favorites";

/* ── Favourites: a tiny localStorage-backed external store ─────────────
 * useSyncExternalStore keeps hydration safe (empty set on the server) and
 * syncs across tabs via the `storage` event. */
const EMPTY_FAVS: ReadonlySet<string> = new Set();
let favsRaw: string | null = null;
let favsCache: ReadonlySet<string> = EMPTY_FAVS;
const favListeners = new Set<() => void>();

function readFavs(): ReadonlySet<string> {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(FAVS_KEY);
  } catch {
    return favsCache;
  }
  if (raw !== favsRaw) {
    favsRaw = raw;
    try {
      const ids = raw ? (JSON.parse(raw) as unknown) : [];
      favsCache = new Set(
        Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [],
      );
    } catch {
      favsCache = EMPTY_FAVS;
    }
  }
  return favsCache;
}

function subscribeFavs(cb: () => void): () => void {
  favListeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === FAVS_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    favListeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function toggleFavInStore(id: string): void {
  const next = new Set(readFavs());
  if (next.has(id)) next.delete(id);
  else next.add(id);
  try {
    window.localStorage.setItem(FAVS_KEY, JSON.stringify([...next]));
  } catch {
    // storage unavailable — favourites just won't persist
  }
  favsRaw = null; // force re-read so the cache picks up the write
  favListeners.forEach((l) => l());
}

const MODES: { key: Mode; label: string; sub: string }[] = [
  { key: "studio", label: "Design Studio", sub: "3D room at true scale" },
  { key: "photo", label: "My Room Photo", sub: "tiles on your own photo" },
  { key: "ai", label: "AI Redesign", sub: "full photorealistic makeover" },
];

export default function VisualizerApp() {
  const tiles = useTiles();
  const [mode, setMode] = useState<Mode>("studio");
  const [tile, setTile] = useState<Tile>(tiles[0]);
  const favorites = useSyncExternalStore(subscribeFavs, readFavs, () => EMPTY_FAVS);
  const toggleFavorite = useCallback((id: string) => toggleFavInStore(id), []);

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-6">
      {/* ── Mode tabs ────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Visualizer modes"
        className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-navy-2/50 p-2 sm:flex-row"
      >
        {MODES.map((m) => (
          <button
            key={m.key}
            role="tab"
            aria-selected={mode === m.key}
            onClick={() => setMode(m.key)}
            className={`flex-1 rounded-xl px-4 py-3 text-left transition-all ${
              mode === m.key
                ? "bg-green text-white shadow-green"
                : "text-white/60 hover:bg-white/5 hover:text-white/90"
            }`}
          >
            <span className="block font-display text-sm font-bold">{m.label}</span>
            <span className={`mt-0.5 block text-[0.68rem] ${mode === m.key ? "text-white/80" : "text-white/40"}`}>
              {m.sub}
            </span>
          </button>
        ))}
      </div>

      {/* ── Catalog + active mode ────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <TileCatalog
          selectedId={tile.id}
          onSelect={setTile}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />

        {/* All three modes stay mounted so their state survives tab switches. */}
        <div className="min-w-0">
          <div className={mode === "studio" ? "" : "hidden"}>
            <StudioMode tile={tile} active={mode === "studio"} />
          </div>
          <div className={mode === "photo" ? "" : "hidden"}>
            <PhotoMode tile={tile} active={mode === "photo"} />
          </div>
          <div className={mode === "ai" ? "" : "hidden"}>
            <AiMode tile={tile} onSelectTile={setTile} active={mode === "ai"} />
          </div>
        </div>
      </div>
    </div>
  );
}
