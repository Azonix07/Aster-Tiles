"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Tile } from "@/lib/tiles";
import {
  buildTilePattern,
  buildTiledCanvas,
  dist,
  loadImage,
  renderFloorPerspective,
  renderWallFlat,
  type Pt,
  type Quad,
} from "@/lib/visualizer/engine";

type Surface = "floor" | "wall";

const FLOOR_LABELS = ["TL", "TR", "BR", "BL"];
const FLOOR_HINTS = ["Top-Left", "Top-Right", "Bottom-Right", "Bottom-Left"];

const dpr = () => Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);

export default function PhotoMode({ tile, active }: { tile: Tile; active: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const compareWrapRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<Pt | null>(null); // normalised 0-1
  const rafRef = useRef(0);

  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [surface, setSurface] = useState<Surface>("floor");
  /** Outline points, normalised 0-1 against the photo. */
  const [points, setPoints] = useState<Pt[]>([]);
  const [applied, setApplied] = useState(false);

  const [opacity, setOpacity] = useState(85);
  const [rotation, setRotation] = useState<0 | 90>(0);
  const [groutColor, setGroutColor] = useState(tile.defaultGrout);
  const [groutW, setGroutW] = useState(3);
  const [tilesAcross, setTilesAcross] = useState(6);

  const [tileImg, setTileImg] = useState<HTMLImageElement | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [compare, setCompare] = useState(50);
  const [cssSize, setCssSize] = useState<{ w: number; h: number } | null>(null);

  const minPoints = surface === "floor" ? 4 : 3;

  useEffect(() => {
    let alive = true;
    loadImage(tile.texture)
      .then((img) => alive && setTileImg(img))
      .catch(() => alive && setTileImg(null));
    return () => {
      alive = false;
    };
  }, [tile.texture]);

  // Adopt the tile's suggested grout colour when the tile changes —
  // adjusted during render rather than in an effect to avoid a re-render cascade.
  const [prevTileId, setPrevTileId] = useState(tile.id);
  if (prevTileId !== tile.id) {
    setPrevTileId(tile.id);
    setGroutColor(tile.defaultGrout);
  }

  /* ── Upload ─────────────────────────────────── */
  const acceptFile = (file: File | undefined | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const img = new Image();
      img.onload = () => {
        setPhoto(img);
        setPhotoUrl(url);
        setPoints([]);
        setApplied(false);
        setShowCompare(false);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  /* ── Core render ────────────────────────────── */

  /** Draw the tile layer for the current points onto any context/scale. */
  const renderTileLayer = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      cw: number,
      ch: number,
      ptsPx: Pt[],
      pixelScale: number,
      photoImg: HTMLImageElement,
    ) => {
      if (!tileImg || ptsPx.length < minPoints) return;
      let pw: number;
      let ph: number;
      if (surface === "floor") {
        const q = ptsPx.slice(0, 4);
        pw = (dist(q[0], q[1]) + dist(q[3], q[2])) / 2;
        ph = (dist(q[0], q[3]) + dist(q[1], q[2])) / 2;
      } else {
        const xs = ptsPx.map((p) => p.x);
        const ys = ptsPx.map((p) => p.y);
        pw = Math.max(...xs) - Math.min(...xs);
        ph = Math.max(...ys) - Math.min(...ys);
      }
      if (pw <= 0 || ph <= 0) return;

      const wMm = rotation === 90 ? tile.heightMm : tile.widthMm;
      const hMm = rotation === 90 ? tile.widthMm : tile.heightMm;
      const tw = Math.max(6, pw / tilesAcross);
      const th = Math.max(6, tw * (hMm / wMm));
      const gw = Math.max(1, Math.round(groutW * pixelScale));
      const pattern = buildTilePattern(tileImg, tw, th, gw, groutColor, rotation === 90);
      const alpha = opacity / 100;

      if (surface === "floor") {
        const quad = [ptsPx[0], ptsPx[1], ptsPx[2], ptsPx[3]] as Quad;
        const cols = Math.ceil(pw / pattern.width) + 1;
        const rows = Math.ceil(ph / pattern.height) + 1;
        const big = buildTiledCanvas(pattern, cols, rows);
        renderFloorPerspective(ctx, big, quad, {
          subdivisions: 30,
          alpha,
          shade: { image: photoImg, width: cw, height: ch, alpha: 0.13 },
        });
      } else {
        renderWallFlat(ctx, ptsPx, pattern, {
          canvasW: cw,
          canvasH: ch,
          alpha,
          shade: { image: photoImg, width: cw, height: ch, alpha: 0.11 },
        });
      }
    },
    [tileImg, minPoints, surface, rotation, tile.widthMm, tile.heightMm, tilesAcross, groutW, groutColor, opacity],
  );

  /** Marker/outline overlay while picking points (port of vDrawOverlay). */
  const drawOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, cw: number, ch: number, ptsPx: Pt[]) => {
      if (!ptsPx.length) return;
      const scale = dpr();
      ctx.save();
      if (ptsPx.length >= 3) {
        ctx.beginPath();
        ptsPx.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();
        ctx.fillStyle = "rgba(45,184,124,0.1)";
        ctx.fill();
      }
      ctx.beginPath();
      ptsPx.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      if (ptsPx.length >= 3) ctx.closePath();
      ctx.strokeStyle = "#2db87c";
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();

      const m = mouseRef.current;
      if (m && ptsPx.length < (surface === "floor" ? 4 : 99)) {
        ctx.beginPath();
        ctx.moveTo(ptsPx[ptsPx.length - 1].x, ptsPx[ptsPx.length - 1].y);
        ctx.lineTo(m.x * cw, m.y * ch);
        ctx.setLineDash([5 * scale, 4 * scale]);
        ctx.strokeStyle = "rgba(45,184,124,0.45)";
        ctx.lineWidth = scale;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ptsPx.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7 * scale, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? "#4caf50" : "#2db87c";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5 * scale;
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${8 * scale}px Sora, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(surface === "floor" ? FLOOR_LABELS[i] : String(i + 1), p.x, p.y);
      });
      ctx.restore();
    },
    [surface],
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photo) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cw = canvas.width;
    const ch = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(photo, 0, 0, cw, ch);
    const ptsPx = points.map((p) => ({ x: p.x * cw, y: p.y * ch }));
    if (applied && points.length >= minPoints) {
      renderTileLayer(ctx, cw, ch, ptsPx, dpr(), photo);
    } else {
      drawOverlay(ctx, cw, ch, ptsPx);
    }
  }, [photo, points, applied, minPoints, renderTileLayer, drawOverlay]);

  /** Fit the canvas to the stage, retina-sharp, preserving photo aspect. */
  const fitCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage || !photo) return;
    const maxW = stage.clientWidth;
    if (!maxW) return;
    const maxH = 560;
    const scale = Math.min(maxW / photo.width, maxH / photo.height, 1.5);
    const cssW = Math.round(photo.width * scale);
    const cssH = Math.round(photo.height * scale);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    const ratio = dpr();
    canvas.width = Math.round(cssW * ratio);
    canvas.height = Math.round(cssH * ratio);
    setCssSize({ w: cssW, h: cssH });
    redraw();
  }, [photo, redraw]);

  useEffect(() => {
    if (active) fitCanvas();
  }, [fitCanvas, active]);

  // Debounced re-render on slider/tile changes while applied.
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(redraw, 50);
    return () => window.clearTimeout(t);
  }, [redraw, active]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const obs = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(fitCanvas);
    });
    obs.observe(stage);
    return () => {
      cancelAnimationFrame(rafRef.current);
      obs.disconnect();
    };
  }, [fitCanvas]);

  /* ── Interaction ────────────────────────────── */
  const apply = useCallback(() => {
    if (points.length >= minPoints && tileImg) setApplied(true);
  }, [points.length, minPoints, tileImg]);

  const undo = useCallback(() => {
    setApplied(false);
    setShowCompare(false);
    setPoints((p) => p.slice(0, -1));
  }, []);

  const clearAll = useCallback(() => {
    setPoints([]);
    setApplied(false);
    setShowCompare(false);
  }, []);

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !photo || applied) return;
    const r = canvas.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * canvas.width;
    const py = ((e.clientY - r.top) / r.height) * canvas.height;
    const n: Pt = { x: px / canvas.width, y: py / canvas.height };
    if (surface === "floor" && points.length >= 4) return;
    if (surface === "wall" && points.length >= 3) {
      const first = { x: points[0].x * canvas.width, y: points[0].y * canvas.height };
      if (dist({ x: px, y: py }, first) < 18 * dpr()) {
        apply();
        return;
      }
    }
    const next = [...points, n];
    setPoints(next);
    if (surface === "floor" && next.length === 4 && tileImg) setApplied(true);
  };

  const onCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !photo || applied || points.length === 0) return;
    const r = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: (e.clientX - r.left) / r.width,
      y: (e.clientY - r.top) / r.height,
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(redraw);
  };

  // Keyboard shortcuts (Enter apply / Esc clear / Cmd-Z undo).
  useEffect(() => {
    if (!active || !photo) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "Enter") apply();
      if (e.key === "Escape") clearAll();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, photo, apply, clearAll, undo]);

  // Compare divider drag.
  useEffect(() => {
    if (!showCompare) return;
    const wrap = compareWrapRef.current;
    if (!wrap) return;
    let dragging = false;
    const setFromX = (clientX: number) => {
      const r = wrap.getBoundingClientRect();
      setCompare(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
    };
    const down = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-compare-handle]")) return;
      dragging = true;
      setFromX(e.clientX);
      e.preventDefault();
    };
    const move = (e: PointerEvent) => {
      if (dragging) setFromX(e.clientX);
    };
    const up = () => {
      dragging = false;
    };
    wrap.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      wrap.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [showCompare]);

  /* ── Download at full photo resolution ──────── */
  const download = () => {
    if (!photo) return;
    const full = document.createElement("canvas");
    full.width = photo.width;
    full.height = photo.height;
    const ctx = full.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(photo, 0, 0);
    if (applied && points.length >= minPoints) {
      const ptsPx = points.map((p) => ({ x: p.x * full.width, y: p.y * full.height }));
      const screenCanvas = canvasRef.current;
      const pixelScale = screenCanvas ? (full.width / screenCanvas.width) * dpr() : 1;
      renderTileLayer(ctx, full.width, full.height, ptsPx, pixelScale, photo);
    }
    const a = document.createElement("a");
    a.download = `aster-room-${tile.id}.png`;
    a.href = full.toDataURL("image/png");
    a.click();
  };

  /* ── Derived UI state ───────────────────────── */
  const step = !photo ? 1 : applied ? 4 : points.length === 0 ? 2 : 3;
  const hint = !photo
    ? "Upload a photo of your room to begin."
    : !tileImg
      ? "Loading tile texture…"
      : applied
        ? "Tiles applied — adjust the sliders, everything updates live."
        : points.length === 0
          ? surface === "floor"
            ? "Click the Top-Left corner of your floor."
            : "Click to outline the wall, point by point."
          : surface === "floor"
            ? points.length < 4
              ? `Click the ${FLOOR_HINTS[points.length]} corner (${points.length}/4).`
              : "Press Apply Tiles."
            : points.length < 3
              ? `${points.length} point${points.length === 1 ? "" : "s"} — add at least 3.`
              : "Click the first point (or press Enter) to close and apply.";

  const steps = [
    { n: 1, label: "Upload photo" },
    { n: 2, label: "Pick surface" },
    { n: 3, label: surface === "floor" ? "Click 4 corners" : "Outline the wall" },
    { n: 4, label: "Apply tiles" },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      {/* ── Stage ────────────────────────────────── */}
      <div className="min-w-0">
        {/* Step indicator */}
        <ol className="mb-4 flex flex-wrap items-center gap-2">
          {steps.map((s, i) => (
            <li key={s.n} className="flex items-center gap-2">
              <span
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold transition-colors ${
                  step === s.n
                    ? "border-green bg-green/15 text-green"
                    : step > s.n
                      ? "border-white/10 bg-white/5 text-white/60"
                      : "border-white/10 text-white/35"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[0.6rem] font-bold ${
                    step > s.n ? "bg-green text-ink" : step === s.n ? "bg-green/30 text-green" : "bg-white/10 text-white/45"
                  }`}
                >
                  {step > s.n ? "✓" : s.n}
                </span>
                {s.label}
              </span>
              {i < steps.length - 1 && <span className="hidden h-px w-4 bg-white/15 sm:block" />}
            </li>
          ))}
        </ol>

        <div
          ref={stageRef}
          className="relative flex min-h-[380px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-navy-2/40 p-3"
        >
          {!photo ? (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                acceptFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex w-full max-w-lg cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-16 text-center transition-colors ${
                dragOver ? "border-green bg-green/10" : "border-white/20 hover:border-green/60 hover:bg-white/[0.03]"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green/15 text-2xl">
                📷
              </span>
              <span className="mt-4 font-display text-sm font-bold text-white">
                Drop a room photo here
              </span>
              <span className="mt-1 text-xs text-white/50">
                or click to browse — JPG or PNG, straight-on shots work best
              </span>
            </label>
          ) : (
            <div ref={compareWrapRef} className="relative" style={cssSize ? { width: cssSize.w, height: cssSize.h } : undefined}>
              <canvas
                ref={canvasRef}
                onClick={onCanvasClick}
                onMouseMove={onCanvasMove}
                className={`block max-w-full rounded-lg ${applied ? "" : "cursor-crosshair"}`}
                role="img"
                aria-label="Your room photo with tile preview"
              />
              {applied && showCompare && photoUrl && cssSize && (
                <>
                  <div
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg"
                    style={{ clipPath: `inset(0 ${100 - compare}% 0 0)` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl}
                      alt="Original room, before tiles"
                      width={cssSize.w}
                      height={cssSize.h}
                      className="block h-full w-full"
                      draggable={false}
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[0.62rem] font-bold tracking-wider text-white">
                      BEFORE
                    </span>
                  </div>
                  <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-green/85 px-2.5 py-1 text-[0.62rem] font-bold tracking-wider text-white">
                    AFTER
                  </span>
                  <div
                    data-compare-handle
                    className="absolute inset-y-0 z-10 w-8 -translate-x-1/2 cursor-ew-resize touch-none"
                    style={{ left: `${compare}%` }}
                    role="slider"
                    aria-label="Before and after comparison divider"
                    aria-valuenow={Math.round(compare)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
                    <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[0.6rem] font-bold text-navy shadow-lg">
                      ↔
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <p className="mt-3 flex items-center gap-2 text-xs text-white/55" aria-live="polite">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${applied ? "bg-green" : photo ? "bg-gold" : "bg-white/25"}`}
          />
          {hint}
        </p>
      </div>

      {/* ── Controls ─────────────────────────────── */}
      <div
        data-lenis-prevent
        className="thin-scroll space-y-5 overflow-y-auto rounded-2xl border border-white/10 bg-navy-2/50 p-5 xl:max-h-[640px]"
      >
        <div>
          <div className="label mb-2 text-[0.62rem] text-green">Surface</div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["floor", "Floor", "4-corner perspective"],
                ["wall", "Wall", "free polygon"],
              ] as const
            ).map(([key, label, sub]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSurface(key);
                  clearAll();
                }}
                aria-pressed={surface === key}
                className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  surface === key
                    ? "border-green bg-green/15"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <span className={`block text-xs font-bold ${surface === key ? "text-green" : "text-white/80"}`}>
                  {label}
                </span>
                <span className="mt-0.5 block text-[0.62rem] text-white/45">{sub}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-[0.68rem] text-white/55">
            <span>Tile size on photo</span>
            <span className="text-white/85">{tilesAcross} across</span>
          </div>
          <input
            type="range"
            className="viz-range"
            min={2}
            max={16}
            value={tilesAcross}
            onChange={(e) => setTilesAcross(parseInt(e.target.value, 10))}
            aria-label="Tiles across the selected area"
          />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-[0.68rem] text-white/55">
            <span>Blend opacity</span>
            <span className="text-white/85">{opacity}%</span>
          </div>
          <input
            type="range"
            className="viz-range"
            min={30}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(parseInt(e.target.value, 10))}
            aria-label="Tile layer opacity"
          />
        </div>

        <div>
          <div className="label mb-2 text-[0.62rem] text-green">Rotation</div>
          <div className="grid grid-cols-2 gap-2">
            {([0, 90] as const).map((deg) => (
              <button
                key={deg}
                type="button"
                onClick={() => setRotation(deg)}
                aria-pressed={rotation === deg}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  rotation === deg
                    ? "border-green bg-green/15 text-green"
                    : "border-white/10 text-white/55 hover:border-white/30 hover:text-white/85"
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>

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
              <div className="mb-1 flex justify-between text-[0.68rem] text-white/55">
                <span>Width</span>
                <span className="text-white/85">{groutW}px</span>
              </div>
              <input
                type="range"
                className="viz-range"
                min={1}
                max={10}
                value={groutW}
                onChange={(e) => setGroutW(parseInt(e.target.value, 10))}
                aria-label="Grout width"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={points.length === 0}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/70 transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            ↶ Undo point
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={points.length === 0 && !applied}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/70 transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            ✕ Clear
          </button>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={apply}
            disabled={!photo || !tileImg || points.length < minPoints || applied}
            className="btn btn-green w-full justify-center disabled:pointer-events-none disabled:opacity-40"
          >
            Apply Tiles
          </button>
          <button
            type="button"
            onClick={() => setShowCompare((v) => !v)}
            disabled={!applied}
            className="btn btn-outline w-full justify-center disabled:pointer-events-none disabled:opacity-40"
          >
            {showCompare ? "Hide comparison" : "Before / After"}
          </button>
          <button
            type="button"
            onClick={download}
            disabled={!photo}
            className="btn btn-outline w-full justify-center disabled:pointer-events-none disabled:opacity-40"
          >
            Download Result
          </button>
          {photo && (
            <label className="block cursor-pointer text-center text-xs text-white/45 underline-offset-2 hover:text-green hover:underline">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />
              Use a different photo
            </label>
          )}
        </div>

        <p className="text-[0.65rem] leading-relaxed text-white/35">
          Tip: press <kbd className="rounded bg-white/10 px-1">Enter</kbd> to apply,{" "}
          <kbd className="rounded bg-white/10 px-1">Esc</kbd> to clear,{" "}
          <kbd className="rounded bg-white/10 px-1">⌘Z</kbd> to undo a point.
        </p>
      </div>
    </div>
  );
}
