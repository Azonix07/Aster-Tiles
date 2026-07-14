"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Tile } from "@/lib/tiles";
import { loadImage, tilesNeeded } from "@/lib/visualizer/engine";
import { renderStudio, type TileLayout } from "@/lib/visualizer/studio";

const clampRoom = (v: number) => Math.min(30, Math.max(0.5, v));

export default function StudioMode({ tile, active }: { tile: Tile; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [roomW, setRoomW] = useState(4);
  const [roomL, setRoomL] = useState(5);
  const [groutColor, setGroutColor] = useState(tile.defaultGrout);
  const [groutPx, setGroutPx] = useState(3);
  const [layout, setLayout] = useState<TileLayout>("grid");
  const [tileImg, setTileImg] = useState<HTMLImageElement | null>(null);
  const [textureError, setTextureError] = useState(false);

  // When the selected tile changes, reset per-tile state during render
  // (the React-recommended alternative to a setState-in-effect cascade).
  const [prevTileId, setPrevTileId] = useState(tile.id);
  if (prevTileId !== tile.id) {
    setPrevTileId(tile.id);
    setTileImg(null);
    setTextureError(false);
    setGroutColor(tile.defaultGrout);
  }

  // Load the selected tile's texture (cached in engine.loadImage).
  useEffect(() => {
    let alive = true;
    loadImage(tile.texture)
      .then((img) => {
        if (alive) setTileImg(img);
      })
      .catch(() => {
        if (alive) {
          setTileImg(null);
          setTextureError(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [tile.texture]);

  const renderNow = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderStudio(canvas, { roomW, roomL, tile, tileImg, groutColor, groutPx, layout });
  }, [roomW, roomL, tile, tileImg, groutColor, groutPx, layout]);

  // Debounced re-render whenever inputs change (the mesh warp is not free).
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(renderNow, 50);
    return () => window.clearTimeout(t);
  }, [renderNow, active]);

  // Re-render when the stage resizes (also fires when the tab becomes visible).
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let raf = 0;
    const obs = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(renderNow);
    });
    obs.observe(stage);
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, [renderNow]);

  const coverage = tilesNeeded(roomW, roomL, tile.widthMm, tile.heightMm);
  const tileAreaM2 = (tile.widthMm / 1000) * (tile.heightMm / 1000);
  const orderAreaM2 = coverage.orderQty * tileAreaM2;
  const estCost = orderAreaM2 * tile.pricePerSqm;

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `aster-studio-${tile.id}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      {/* ── Canvas stage ─────────────────────────── */}
      <div
        ref={stageRef}
        className="relative overflow-hidden rounded-2xl border border-mist bg-off"
      >
        <canvas
          ref={canvasRef}
          className="block h-[380px] w-full sm:h-[460px] lg:h-[540px]"
          role="img"
          aria-label={`3D room preview with ${tile.name} flooring, ${roomW} by ${roomL} metres`}
        />
        <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-ink/70 px-3.5 py-1.5 font-display text-[0.68rem] font-bold tracking-wide text-white backdrop-blur">
          {tile.name} · {tile.widthMm}×{tile.heightMm} mm · {layout === "grid" ? "Grid" : "Brick bond"}
        </div>
        {!tileImg && !textureError && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/40 backdrop-blur-[2px]">
            <div className="flex items-center gap-3 text-sm text-white/75">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-green border-t-transparent" />
              Laying the tiles…
            </div>
          </div>
        )}
        {textureError && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/60">
            <p className="max-w-xs text-center text-sm text-white/70">
              Couldn&apos;t load this tile&apos;s texture. Pick another tile from the library.
            </p>
          </div>
        )}
      </div>

      {/* ── Controls panel ───────────────────────── */}
      <div
        data-lenis-prevent
        className="thin-scroll space-y-5 overflow-y-auto rounded-2xl border border-mist bg-white p-5 shadow-sm xl:max-h-[540px]"
      >
        {/* Selected tile */}
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
            <Image src={tile.texture} alt={tile.name} fill sizes="64px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-bold text-navy">{tile.name}</div>
            <div className="mt-0.5 text-[0.7rem] text-muted">
              {tile.material} · {tile.finish}
            </div>
            <div className="mt-0.5 text-[0.75rem] font-semibold text-green">
              €{tile.pricePerSqm}/m²
            </div>
          </div>
        </div>

        {/* Room dimensions */}
        <div>
          <div className="label mb-2 text-[0.62rem] text-green">Room Size</div>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["Width (m)", roomW, setRoomW],
                ["Length (m)", roomL, setRoomL],
              ] as const
            ).map(([label, value, set]) => (
              <label key={label} className="block">
                <span className="mb-1 block text-[0.68rem] text-muted">{label}</span>
                <input
                  type="number"
                  min={0.5}
                  max={30}
                  step={0.1}
                  value={value}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!Number.isNaN(v)) set(clampRoom(v));
                  }}
                  className="w-full rounded-lg border border-mist bg-off px-3 py-2 text-sm text-navy outline-none transition-colors focus:border-green/60"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Layout */}
        <div>
          <div className="label mb-2 text-[0.62rem] text-green">Layout</div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["grid", "Grid"],
                ["brick", "Brick 50%"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setLayout(key)}
                aria-pressed={layout === key}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  layout === key
                    ? "border-green bg-green/15 text-green"
                    : "border-mist text-muted hover:border-navy/30 hover:text-navy"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Grout */}
        <div>
          <div className="label mb-2 text-[0.62rem] text-green">Grout</div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              className="viz-color shrink-0"
              value={groutColor}
              onChange={(e) => setGroutColor(e.target.value)}
              aria-label="Grout colour"
            />
            <div className="flex-1">
              <div className="mb-1 flex justify-between text-[0.68rem] text-muted">
                <span>Width</span>
                <span className="font-semibold text-navy">{groutPx}px</span>
              </div>
              <input
                type="range"
                className="viz-range"
                min={1}
                max={10}
                value={groutPx}
                onChange={(e) => setGroutPx(parseInt(e.target.value, 10))}
                aria-label="Grout width"
              />
            </div>
          </div>
        </div>

        {/* Coverage estimate */}
        <div className="rounded-xl border border-green/25 bg-green/[0.07] p-4">
          <div className="label mb-3 text-[0.62rem] text-green">Coverage Estimate</div>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Floor area</dt>
              <dd className="font-semibold text-navy">{coverage.area.toFixed(1)} m²</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Tiles needed</dt>
              <dd className="font-semibold text-navy">{coverage.tiles}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Order qty (+10%)</dt>
              <dd className="font-semibold text-navy">{coverage.orderQty} tiles</dd>
            </div>
            <div className="mt-1 flex justify-between border-t border-green/20 pt-2">
              <dt className="text-muted">Est. cost</dt>
              <dd className="font-display font-bold text-green">
                €{estCost.toLocaleString("en-IE", { maximumFractionDigits: 0 })}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-[0.65rem] leading-relaxed text-muted/80">
            Guide price for tiles only. Adhesive, grout and fitting quoted separately.
          </p>
        </div>

        <div className="space-y-2.5">
          <button type="button" onClick={download} className="btn btn-green w-full justify-center">
            Download Preview
          </button>
          <Link href="/contact" className="btn btn-ghost-dark w-full justify-center">
            Request a Quote
          </Link>
        </div>
      </div>
    </div>
  );
}
