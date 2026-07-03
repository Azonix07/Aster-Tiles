/**
 * Design Studio scene renderer — a perspective room shell (ceiling, three
 * walls, window, skirting, ambient occlusion) with the selected tile laid on
 * the floor quad at TRUE physical scale, derived from the room dimensions in
 * metres and the tile size in millimetres.
 *
 * Ported from the legacy sGeo / sDrawShell / sApplyTile / sDrawDims and
 * re-lit with the Aster brand palette.
 */

import type { Tile } from "@/lib/tiles";
import {
  bilerp,
  buildTiledCanvas,
  drawTriangleWarp,
  type Pt,
  type Quad,
} from "@/lib/visualizer/engine";

export type TileLayout = "grid" | "brick";

export interface StudioOptions {
  /** Room width across the screen, metres (0.5–30). */
  roomW: number;
  /** Room depth into the screen, metres (0.5–30). */
  roomL: number;
  tile: Tile;
  /** Decoded texture for `tile` — pass null while it is still loading. */
  tileImg: HTMLImageElement | null;
  groutColor: string;
  /** Grout width in canvas-ish px (scaled with devicePixelRatio internally). */
  groutPx: number;
  layout: TileLayout;
}

interface StudioGeo {
  W: number;
  H: number;
  /** Floor quad in bilerp order: front-left, front-right, back-right, back-left. */
  floor: Quad;
  bwTL: Pt;
  bwTR: Pt;
  bwBL: Pt;
  bwBR: Pt;
  lwPts: Pt[];
  rwPts: Pt[];
  ceilPts: Pt[];
}

/** Port of sGeo — all coordinates are fractions of the canvas box. */
function geo(W: number, H: number): StudioGeo {
  return {
    W,
    H,
    floor: [
      { x: W * 0.04, y: H * 0.93 }, // front-left
      { x: W * 0.96, y: H * 0.93 }, // front-right
      { x: W * 0.68, y: H * 0.4 }, // back-right
      { x: W * 0.32, y: H * 0.4 }, // back-left
    ],
    bwBL: { x: W * 0.32, y: H * 0.4 },
    bwBR: { x: W * 0.68, y: H * 0.4 },
    bwTL: { x: W * 0.32, y: H * 0.08 },
    bwTR: { x: W * 0.68, y: H * 0.08 },
    lwPts: [
      { x: W * 0.04, y: H * 0.93 },
      { x: W * 0.32, y: H * 0.4 },
      { x: W * 0.32, y: H * 0.08 },
      { x: W * 0.04, y: H * 0.11 },
    ],
    rwPts: [
      { x: W * 0.68, y: H * 0.4 },
      { x: W * 0.96, y: H * 0.93 },
      { x: W * 0.96, y: H * 0.11 },
      { x: W * 0.68, y: H * 0.08 },
    ],
    ceilPts: [
      { x: W * 0.04, y: H * 0.11 },
      { x: W * 0.96, y: H * 0.11 },
      { x: W * 0.68, y: H * 0.08 },
      { x: W * 0.32, y: H * 0.08 },
    ],
  };
}

function fillPoly(ctx: CanvasRenderingContext2D, pts: Pt[]): void {
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
}

function clipPoly(ctx: CanvasRenderingContext2D, pts: Pt[]): void {
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();
}

/** Port of sDrawShell, re-toned to the brand's cool mist/navy palette. */
function drawShell(ctx: CanvasRenderingContext2D, g: StudioGeo): void {
  const { W, H } = g;
  ctx.clearRect(0, 0, W, H);

  // Ceiling
  const cg = ctx.createLinearGradient(0, 0, 0, H * 0.11);
  cg.addColorStop(0, "#dbe1ea");
  cg.addColorStop(1, "#ccd4e0");
  ctx.fillStyle = cg;
  fillPoly(ctx, g.ceilPts);

  // Back wall
  const bwg = ctx.createLinearGradient(g.bwTL.x, g.bwTL.y, g.bwBR.x, g.bwBR.y);
  bwg.addColorStop(0, "#eef1f6");
  bwg.addColorStop(1, "#dde4ed");
  ctx.fillStyle = bwg;
  fillPoly(ctx, [g.bwTL, g.bwTR, g.bwBR, g.bwBL]);

  // Window on the back wall — frame, mullions and a soft sky
  const wx0 = W * 0.42;
  const wx1 = W * 0.58;
  const wy0 = H * 0.135;
  const wy1 = H * 0.29;
  const frame = Math.max(1.5, W * 0.004);
  ctx.fillStyle = "#c3cddb";
  ctx.fillRect(wx0 - frame, wy0 - frame, wx1 - wx0 + frame * 2, wy1 - wy0 + frame * 2);
  const sky = ctx.createLinearGradient(0, wy0, 0, wy1);
  sky.addColorStop(0, "#e8f1f8");
  sky.addColorStop(1, "#cfe0ea");
  ctx.fillStyle = sky;
  ctx.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
  ctx.strokeStyle = "#c3cddb";
  ctx.lineWidth = Math.max(1, W * 0.0025);
  ctx.beginPath();
  ctx.moveTo((wx0 + wx1) / 2, wy0);
  ctx.lineTo((wx0 + wx1) / 2, wy1);
  ctx.moveTo(wx0, (wy0 + wy1) / 2);
  ctx.lineTo(wx1, (wy0 + wy1) / 2);
  ctx.stroke();

  // Warm daylight glow spilling from the window
  const wl = ctx.createRadialGradient(W * 0.5, H * 0.24, 0, W * 0.5, H * 0.24, W * 0.2);
  wl.addColorStop(0, "rgba(255,246,222,0.35)");
  wl.addColorStop(1, "rgba(255,246,222,0)");
  ctx.save();
  clipPoly(ctx, [g.bwTL, g.bwTR, g.bwBR, g.bwBL]);
  ctx.fillStyle = wl;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Left wall (in shadow)
  const lwg = ctx.createLinearGradient(W * 0.04, 0, W * 0.32, 0);
  lwg.addColorStop(0, "#b4bfce");
  lwg.addColorStop(1, "#c9d2de");
  ctx.fillStyle = lwg;
  fillPoly(ctx, g.lwPts);

  // Right wall
  const rwg = ctx.createLinearGradient(W * 0.68, 0, W * 0.96, 0);
  rwg.addColorStop(0, "#ccd5e0");
  rwg.addColorStop(1, "#b0bccb");
  ctx.fillStyle = rwg;
  fillPoly(ctx, g.rwPts);

  // Skirting boards along the floor line
  ctx.strokeStyle = "rgba(12,35,64,0.32)";
  ctx.lineWidth = Math.max(1.5, H * 0.004);
  ctx.beginPath();
  ctx.moveTo(W * 0.04, H * 0.93);
  ctx.lineTo(W * 0.32, H * 0.4);
  ctx.lineTo(W * 0.68, H * 0.4);
  ctx.lineTo(W * 0.96, H * 0.93);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = Math.max(1, H * 0.0025);
  ctx.beginPath();
  ctx.moveTo(W * 0.32, H * 0.393);
  ctx.lineTo(W * 0.68, H * 0.393);
  ctx.stroke();

  // Ceiling cornice
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.04, H * 0.11);
  ctx.lineTo(W * 0.32, H * 0.08);
  ctx.lineTo(W * 0.68, H * 0.08);
  ctx.lineTo(W * 0.96, H * 0.11);
  ctx.stroke();

  // Ambient occlusion in the wall corners
  const cornerL = ctx.createLinearGradient(W * 0.28, 0, W * 0.34, 0);
  cornerL.addColorStop(0, "rgba(12,35,64,0)");
  cornerL.addColorStop(1, "rgba(12,35,64,0.08)");
  ctx.fillStyle = cornerL;
  fillPoly(ctx, g.lwPts);
  const cornerR = ctx.createLinearGradient(W * 0.72, 0, W * 0.66, 0);
  cornerR.addColorStop(0, "rgba(12,35,64,0)");
  cornerR.addColorStop(1, "rgba(12,35,64,0.08)");
  ctx.fillStyle = cornerR;
  fillPoly(ctx, g.rwPts);
}

/**
 * Build the repeating pattern cell for the chosen layout.
 * grid  — one tile per cell.
 * brick — two rows per cell, the second offset by 50% (running bond).
 */
function buildLayoutCell(
  img: HTMLImageElement,
  twPx: number,
  thPx: number,
  groutPx: number,
  groutColor: string,
  layout: TileLayout,
): HTMLCanvasElement {
  const tw = Math.max(4, Math.round(twPx));
  const th = Math.max(4, Math.round(thPx));
  const gw = Math.max(0, Math.round(groutPx));
  const cellW = tw + gw;
  const cellH = th + gw;
  const cell = document.createElement("canvas");
  cell.width = cellW;
  cell.height = layout === "brick" ? cellH * 2 : cellH;
  const c = cell.getContext("2d");
  if (!c) return cell;
  c.fillStyle = groutColor;
  c.fillRect(0, 0, cell.width, cell.height);
  const half = gw / 2;
  const faceW = tw - gw / 2;
  const faceH = th - gw / 2;
  // Row 0 — full tile
  c.drawImage(img, half, half, faceW, faceH);
  if (layout === "brick") {
    // Row 1 — offset by half a cell; draw both wrapped copies
    const y = cellH + half;
    c.drawImage(img, half - cellW / 2, y, faceW, faceH);
    c.drawImage(img, half + cellW / 2, y, faceW, faceH);
  }
  return cell;
}

/** Lay the tile texture over the floor quad at true scale (port of sApplyTile). */
function applyFloorTile(
  ctx: CanvasRenderingContext2D,
  g: StudioGeo,
  opts: StudioOptions,
  dpr: number,
): void {
  const { tile, tileImg } = opts;
  if (!tileImg) return;
  const { W, H, floor } = g;

  // True scale: the front floor edge spans 92% of the canvas and represents
  // the full room width in metres.
  const pxPerM = (W * 0.92) / Math.max(0.5, opts.roomW);
  const twPx = Math.max(4, Math.round((tile.widthMm / 1000) * pxPerM));
  const thPx = Math.max(4, Math.round((tile.heightMm / 1000) * pxPerM));
  const groutPx = Math.max(1, Math.round(opts.groutPx * dpr));

  const cell = buildLayoutCell(tileImg, twPx, thPx, groutPx, opts.groutColor, opts.layout);

  // Enough repeats to cover the room, plus margin so the mesh never runs dry.
  const cols = Math.ceil((opts.roomW * 1000) / tile.widthMm) + 3;
  const tileRows = Math.ceil((opts.roomL * 1000) / tile.heightMm) + 3;
  const cellRows = opts.layout === "brick" ? Math.ceil(tileRows / 2) + 1 : tileRows;
  const big = buildTiledCanvas(cell, cols, cellRows);

  // Perspective mesh warp onto the floor quad.
  const bw = big.width;
  const bh = big.height;
  const N = 32;
  const sq: Quad = [
    { x: 0, y: 0 },
    { x: bw, y: 0 },
    { x: bw, y: bh },
    { x: 0, y: bh },
  ];
  ctx.save();
  for (let row = 0; row < N; row++) {
    for (let col = 0; col < N; col++) {
      const u0 = col / N;
      const u1 = (col + 1) / N;
      const v0 = row / N;
      const v1 = (row + 1) / N;
      const s00 = bilerp(sq, u0, v0);
      const s10 = bilerp(sq, u1, v0);
      const s11 = bilerp(sq, u1, v1);
      const s01 = bilerp(sq, u0, v1);
      const d00 = bilerp(floor, u0, v0);
      const d10 = bilerp(floor, u1, v0);
      const d11 = bilerp(floor, u1, v1);
      const d01 = bilerp(floor, u0, v1);
      drawTriangleWarp(ctx, big, s00, s10, s11, d00, d10, d11);
      drawTriangleWarp(ctx, big, s00, s11, s01, d00, d11, d01);
    }
  }
  ctx.restore();

  const finish = tile.finish.toLowerCase();
  const polished = finish.includes("polish") || finish.includes("gloss");

  ctx.save();
  clipPoly(ctx, floor);

  // Depth shading — the floor recedes into ambient light.
  const depth = ctx.createLinearGradient(0, H * 0.4, 0, H * 0.93);
  depth.addColorStop(0, "rgba(12,35,64,0.16)");
  depth.addColorStop(0.45, "rgba(12,35,64,0.02)");
  depth.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  // Front-edge vignette (port of the legacy floor vignette).
  const vg = ctx.createLinearGradient(0, H * 0.72, 0, H * 0.93);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // Window-light reflection pooling on the floor.
  const pool = ctx.createRadialGradient(
    W * 0.5,
    H * 0.52,
    0,
    W * 0.5,
    H * 0.56,
    W * (polished ? 0.3 : 0.22),
  );
  pool.addColorStop(0, `rgba(255,248,228,${polished ? 0.22 : 0.09})`);
  pool.addColorStop(1, "rgba(255,248,228,0)");
  ctx.fillStyle = pool;
  ctx.fillRect(0, 0, W, H);

  // Polished sheen — a diagonal specular sweep.
  if (polished) {
    const sheen = ctx.createLinearGradient(W * 0.2, H * 0.93, W * 0.62, H * 0.4);
    sheen.addColorStop(0, "rgba(255,255,255,0)");
    sheen.addColorStop(0.48, "rgba(255,255,255,0.1)");
    sheen.addColorStop(0.52, "rgba(255,255,255,0.16)");
    sheen.addColorStop(0.6, "rgba(255,255,255,0.04)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/** Dimension badges along the front and right floor edges (port of sDrawDims). */
function drawDims(ctx: CanvasRenderingContext2D, g: StudioGeo, opts: StudioOptions): void {
  const { W, H, floor } = g;
  const fs = Math.max(10, Math.round(W * 0.017));
  ctx.save();
  ctx.font = `700 ${fs}px Sora, system-ui, sans-serif`;
  ctx.textBaseline = "middle";

  const badge = (txt: string, bx: number, by: number, align: "center" | "left") => {
    ctx.textAlign = align;
    const mw = ctx.measureText(txt).width;
    const pd = W * 0.008;
    const ph = fs * 0.85;
    const rx = align === "left" ? bx : bx - mw / 2 - pd;
    ctx.fillStyle = "rgba(45,184,124,0.9)";
    if (typeof ctx.roundRect === "function") {
      ctx.beginPath();
      ctx.roundRect(rx, by - ph, mw + pd * 2, ph * 2, ph);
      ctx.fill();
    } else {
      ctx.fillRect(rx, by - ph, mw + pd * 2, ph * 2);
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillText(txt, align === "left" ? bx + pd : bx, by + 0.5);
  };

  const fmt = (v: number) => (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1));

  // Width — beneath the front floor edge
  const wmy = floor[0].y + H * 0.028;
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(floor[0].x + W * 0.01, wmy);
  ctx.lineTo(floor[1].x - W * 0.01, wmy);
  ctx.stroke();
  ctx.setLineDash([]);
  badge(`W ${fmt(opts.roomW)} m`, (floor[0].x + floor[1].x) / 2, wmy, "center");

  // Length — along the right floor edge
  const dmx = (floor[1].x + floor[2].x) / 2 + W * 0.02;
  const dmy = (floor[1].y + floor[2].y) / 2;
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.moveTo(floor[1].x - W * 0.005, floor[1].y - H * 0.01);
  ctx.lineTo(floor[2].x + W * 0.005, floor[2].y + H * 0.01);
  ctx.stroke();
  ctx.setLineDash([]);
  badge(`L ${fmt(opts.roomL)} m`, dmx, dmy, "left");

  ctx.restore();
}

/**
 * Render the full Design Studio scene into `canvas`, sized to its CSS box
 * and scaled for devicePixelRatio so it stays crisp on retina displays.
 * Returns false when the canvas has no measurable size yet.
 */
export function renderStudio(canvas: HTMLCanvasElement, opts: StudioOptions): boolean {
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (!cssW || !cssH) return false;
  const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
  const W = Math.round(cssW * dpr);
  const H = Math.round(cssH * dpr);
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = geo(W, H);
  drawShell(ctx, g);
  applyFloorTile(ctx, g, opts, dpr);
  drawDims(ctx, g, opts);
  return true;
}
