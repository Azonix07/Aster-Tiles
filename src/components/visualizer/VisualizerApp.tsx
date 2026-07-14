"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { type Tile } from "@/lib/tiles";
import { useTiles, useUser } from "@/components/StoreProvider";
import TileCatalog from "@/components/visualizer/TileCatalog";
import StudioMode from "@/components/visualizer/StudioMode";
import PhotoMode from "@/components/visualizer/PhotoMode";
import AiMode from "@/components/visualizer/AiMode";
import { LockedPanel, SignInModal } from "@/components/visualizer/SignInGate";

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
  const user = useUser();
  const [mode, setMode] = useState<Mode>("studio");
  const [tile, setTile] = useState<Tile>(tiles[0]);
  const favorites = useSyncExternalStore(subscribeFavs, readFavs, () => EMPTY_FAVS);
  const toggleFavorite = useCallback((id: string) => toggleFavInStore(id), []);
  /** sign-in gate modal; `next` set when the visitor was headed somewhere */
  const [gate, setGate] = useState<{ open: boolean; next?: string }>({ open: false });

  /* An emptied catalogue (all tiles deleted in admin) has nothing to preview. */
  if (!tile) {
    return (
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6">
        <p className="rounded-2xl border border-mist bg-white p-8 text-center text-sm text-muted">
          The tile catalogue is empty — add tiles in the admin panel to use the visualizer.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-6">
      {/* ── Mode tabs ────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Visualizer modes"
        className="flex flex-col gap-2 rounded-2xl border border-mist bg-white p-2 shadow-sm sm:flex-row"
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
                : "text-muted hover:bg-navy/5 hover:text-navy"
            }`}
          >
            <span className="block font-display text-sm font-bold">{m.label}</span>
            <span className={`mt-0.5 block text-[0.68rem] ${mode === m.key ? "text-white/80" : "text-muted/70"}`}>
              {m.sub}
            </span>
          </button>
        ))}
        <Link
          href={`/visualizer/360?tile=${tile.id}`}
          onClick={(e) => {
            if (!user) {
              e.preventDefault();
              setGate({ open: true, next: `/visualizer/360?tile=${tile.id}` });
            }
          }}
          className="flex-1 rounded-xl border border-dashed border-mist px-4 py-3 text-left text-muted transition-all hover:border-green/60 hover:bg-green/5 hover:text-navy"
        >
          <span className="flex items-center gap-2 font-display text-sm font-bold">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <ellipse cx="12" cy="12" rx="8.5" ry="3.6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.2 14.6 22 12.2l-2.9-.9" />
              <circle cx="12" cy="12" r="2.3" fill="currentColor" stroke="none" />
            </svg>
            360° Room View
          </span>
          <span className="mt-0.5 block text-[0.68rem] text-muted/70">
            stand inside a furnished room
          </span>
        </Link>
      </div>

      {/* ── Catalog + active mode ────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <TileCatalog
          selectedId={tile.id}
          onSelect={setTile}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />

        {/* All three modes stay mounted so their state survives tab switches.
            Guests get Design Studio only — the other modes render blurred
            behind a sign-in prompt. */}
        <div className="min-w-0">
          <div className={mode === "studio" ? "" : "hidden"}>
            <StudioMode tile={tile} active={mode === "studio"} />
          </div>
          <div className={mode === "photo" ? "" : "hidden"}>
            {user ? (
              <PhotoMode tile={tile} active={mode === "photo"} />
            ) : (
              <LockedPanel featureName="My Room Photo" onSignIn={() => setGate({ open: true })}>
                <PhotoMode tile={tile} active={false} />
              </LockedPanel>
            )}
          </div>
          <div className={mode === "ai" ? "" : "hidden"}>
            {user ? (
              <AiMode tile={tile} onSelectTile={setTile} active={mode === "ai"} />
            ) : (
              <LockedPanel featureName="AI Redesign" onSignIn={() => setGate({ open: true })}>
                <AiMode tile={tile} onSelectTile={setTile} active={false} />
              </LockedPanel>
            )}
          </div>
        </div>
      </div>

      <SignInModal
        open={gate.open}
        onClose={() => setGate({ open: false })}
        next={gate.next}
      />
    </div>
  );
}
