"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { DbTile } from "@/lib/db";
import { useSettings, useTiles } from "@/components/StoreProvider";
import { money } from "@/lib/format";
import { effectivePrice } from "@/lib/pricing";
import {
  createRoom360,
  type Room360Handle,
  type WallFinish,
} from "@/lib/visualizer/room360";

const WALL_PAINTS = [
  { name: "Warm White", color: "#e8e4dc" },
  { name: "Soft Sage", color: "#c3cdbd" },
  { name: "Dove Grey", color: "#b8bcc0" },
  { name: "Clay", color: "#cbb39a" },
  { name: "Deep Teal", color: "#2f5359" },
  { name: "Navy Night", color: "#243447" },
] as const;

type Panel = "floor" | "walls";

/** Interactive 360° room — camera at the centre, floor & walls re-skin live. */
export default function Room360App({ initialTileId }: { initialTileId?: string }) {
  const tiles = useTiles();
  const settings = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roomRef = useRef<Room360Handle | null>(null);

  const initialTile = useMemo(
    () => tiles.find((t) => t.id === initialTileId) ?? tiles[0],
    [tiles, initialTileId],
  );

  const [floorTile, setFloorTile] = useState<DbTile>(initialTile);
  const [wall, setWall] = useState<WallFinish>({
    kind: "paint",
    ...WALL_PAINTS[0],
  });
  const [panel, setPanel] = useState<Panel>("floor");
  const [autoRotate, setAutoRotate] = useState(true);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);

  /* Build the scene once. */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const room = createRoom360(canvas, {
      onProgress: (loaded, total) => setProgress(Math.round((loaded / total) * 100)),
    });
    roomRef.current = room;
    setReady(true);
    return () => {
      roomRef.current = null;
      room.dispose();
    };
  }, []);

  /* Re-skin surfaces when selections change. */
  useEffect(() => {
    if (ready && floorTile) void roomRef.current?.setFloorTile(floorTile);
  }, [ready, floorTile]);
  useEffect(() => {
    if (ready) void roomRef.current?.setWallFinish(wall);
  }, [ready, wall]);

  /* An emptied catalogue (all tiles deleted in admin) has nothing to show. */
  if (!floorTile) {
    return (
      <div className="flex h-[calc(100svh-4.25rem)] min-h-[540px] items-center justify-center bg-ink px-6 text-center text-sm text-white/60">
        The tile catalogue is empty — add tiles in the admin panel to use the 360° room view.
      </div>
    );
  }

  const wallTileId = wall.kind === "tile" ? wall.tile.id : null;

  const download = () => {
    const url = roomRef.current?.snapshot();
    if (!url) return;
    const a = document.createElement("a");
    a.download = `aster-360-${floorTile.id}.png`;
    a.href = url;
    a.click();
  };

  return (
    <div className="relative h-[calc(100svh-4.25rem)] min-h-[540px] w-full overflow-hidden bg-ink">
      <canvas ref={canvasRef} className="h-full w-full cursor-grab touch-none active:cursor-grabbing" />

      {(!ready || progress < 100) && (
        <div className="pointer-events-none absolute inset-x-0 top-20 flex justify-center sm:top-24">
          <div className="flex items-center gap-3 rounded-full bg-ink/75 px-5 py-2.5 backdrop-blur">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-green border-t-transparent" />
            <span className="text-xs text-white/80">Furnishing your room… {progress}%</span>
          </div>
        </div>
      )}

      {/* ── Top bar ─────────────────────────────── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="pointer-events-auto flex items-center gap-3">
          <Link
            href="/visualizer"
            className="flex items-center gap-2 rounded-full border border-white/15 bg-ink/60 px-4 py-2 font-display text-xs font-bold text-white backdrop-blur transition-colors hover:border-green hover:text-green"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7-7 7 7 7" />
            </svg>
            Visualizer
          </Link>
          <div className="hidden rounded-full bg-ink/60 px-4 py-2 backdrop-blur sm:block">
            <span className="font-display text-xs font-bold text-white">360° Room View</span>
            <span className="ml-2 text-[0.68rem] text-white/55">drag to look around · scroll to zoom</span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = !autoRotate;
              setAutoRotate(next);
              roomRef.current?.setAutoRotate(next);
            }}
            aria-pressed={autoRotate}
            className={`rounded-full border px-4 py-2 font-display text-xs font-bold backdrop-blur transition-colors ${
              autoRotate
                ? "border-green bg-green/20 text-green"
                : "border-white/15 bg-ink/60 text-white/70 hover:text-white"
            }`}
          >
            Auto-rotate
          </button>
          <button
            type="button"
            onClick={() => roomRef.current?.resetView()}
            className="rounded-full border border-white/15 bg-ink/60 px-4 py-2 font-display text-xs font-bold text-white/70 backdrop-blur transition-colors hover:text-white"
          >
            Reset view
          </button>
          <button
            type="button"
            onClick={download}
            className="rounded-full border border-white/15 bg-ink/60 px-4 py-2 font-display text-xs font-bold text-white/70 backdrop-blur transition-colors hover:text-white"
          >
            Snapshot
          </button>
        </div>
      </div>

      {/* ── Current floor tile info ─────────────── */}
      <div className="pointer-events-none absolute bottom-4 left-4 hidden sm:block">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-ink/70 p-3 pr-5 backdrop-blur">
          <span className="relative block h-12 w-12 overflow-hidden rounded-lg bg-mist">
            <Image src={floorTile.texture} alt="" fill sizes="48px" className="object-cover" />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-white">{floorTile.name}</p>
            <p className="text-[0.68rem] text-white/55">
              {floorTile.widthMm} × {floorTile.heightMm} mm ·{" "}
              {money(effectivePrice(floorTile), settings.currencySymbol)}/m²
            </p>
          </div>
          <Link
            href={`/tiles/${floorTile.id}`}
            className="ml-3 rounded-full bg-green px-4 py-2 font-display text-xs font-bold text-white transition-colors hover:bg-green-2"
          >
            View &amp; buy
          </Link>
        </div>
      </div>

      {/* ── Surface picker panel ────────────────── */}
      <div className="absolute inset-x-3 bottom-20 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-1/2 sm:w-[290px] sm:-translate-y-1/2">
        <div className="rounded-2xl border border-white/10 bg-ink/75 p-3 backdrop-blur-md">
          <div className="flex gap-1.5 rounded-xl bg-white/5 p-1">
            {(
              [
                { key: "floor", label: "Floor" },
                { key: "walls", label: "Walls" },
              ] as { key: Panel; label: string }[]
            ).map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPanel(p.key)}
                aria-pressed={panel === p.key}
                className={`flex-1 rounded-lg px-3 py-2 font-display text-xs font-bold transition-colors ${
                  panel === p.key ? "bg-green text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {panel === "walls" && (
            <div className="mt-3">
              <p className="px-1 font-display text-[0.65rem] font-bold tracking-[0.08em] text-white/45 uppercase">
                Paint
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5 px-1">
                {WALL_PAINTS.map((p) => (
                  <button
                    key={p.color}
                    type="button"
                    title={p.name}
                    onClick={() => setWall({ kind: "paint", ...p })}
                    aria-pressed={wall.kind === "paint" && wall.color === p.color}
                    className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      wall.kind === "paint" && wall.color === p.color
                        ? "border-green"
                        : "border-white/20"
                    }`}
                    style={{ backgroundColor: p.color }}
                  >
                    <span className="sr-only">{p.name}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 px-1 font-display text-[0.65rem] font-bold tracking-[0.08em] text-white/45 uppercase">
                Or tile the walls
              </p>
            </div>
          )}

          <div className="mt-2 grid max-h-[30vh] grid-cols-4 gap-1.5 overflow-y-auto pr-0.5 sm:max-h-[42vh] sm:grid-cols-3">
            {tiles.map((t) => {
              const selected = panel === "floor" ? floorTile.id === t.id : wallTileId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  title={t.name}
                  onClick={() =>
                    panel === "floor" ? setFloorTile(t) : setWall({ kind: "tile", tile: t })
                  }
                  aria-pressed={selected}
                  className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                    selected ? "border-green" : "border-transparent hover:border-white/40"
                  }`}
                >
                  <Image
                    src={t.texture}
                    alt={t.name}
                    fill
                    sizes="80px"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  {selected && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
