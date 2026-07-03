/**
 * Pure canvas math + rendering helpers for the Room Visualizer.
 *
 * Ported from the legacy Aster Tiles visualizer engine (vInv3 / vMv3 / vTri /
 * vBlerp / vBuildPat / vBuildBig / vRenderFloor / vRenderWall) and rewritten
 * as typed, framework-free functions. Everything here is deterministic and
 * side-effect free apart from drawing into the contexts it is handed.
 */

export interface Pt {
  x: number;
  y: number;
}

/** Quad corners in source-orientation order: (0,0), (1,0), (1,1), (0,1). */
export type Quad = [Pt, Pt, Pt, Pt];

export type Mat3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

export type Vec3 = [number, number, number];

/** 3x3 matrix inverse (port of vInv3). Returns null when singular. */
export function inv3(m: Mat3): Mat3 | null {
  const [[a, b, c], [d, e, f], [g, h, k]] = m;
  const det = a * (e * k - f * h) - b * (d * k - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-12) return null;
  return [
    [(e * k - f * h) / det, (c * h - b * k) / det, (b * f - c * e) / det],
    [(f * g - d * k) / det, (a * k - c * g) / det, (c * d - a * f) / det],
    [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det],
  ];
}

/** Matrix * vector (port of vMv3). */
export function mulVec3(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

/** Euclidean distance between two points. */
export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Affine-warp `img` so that source triangle (s0,s1,s2) lands exactly on the
 * destination triangle (d0,d1,d2), clipped to the destination triangle.
 * Faithful port of vTri: solve the 3-point affine map with an inverse matrix,
 * feed it to setTransform, draw, restore.
 */
export function drawTriangleWarp(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  s0: Pt,
  s1: Pt,
  s2: Pt,
  d0: Pt,
  d1: Pt,
  d2: Pt,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(d0.x, d0.y);
  ctx.lineTo(d1.x, d1.y);
  ctx.lineTo(d2.x, d2.y);
  ctx.closePath();
  ctx.clip();
  const M: Mat3 = [
    [s0.x, s0.y, 1],
    [s1.x, s1.y, 1],
    [s2.x, s2.y, 1],
  ];
  const iM = inv3(M);
  if (!iM) {
    ctx.restore();
    return;
  }
  const [a, c, e] = mulVec3(iM, [d0.x, d1.x, d2.x]);
  const [b, d, f] = mulVec3(iM, [d0.y, d1.y, d2.y]);
  ctx.setTransform(a, b, c, d, e, f);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

/**
 * Bilinear interpolation inside a quad (port of vBlerp).
 * q order: (u0,v0), (u1,v0), (u1,v1), (u0,v1).
 */
export function bilerp(q: Quad, u: number, v: number): Pt {
  return {
    x:
      (1 - u) * (1 - v) * q[0].x +
      u * (1 - v) * q[1].x +
      u * v * q[2].x +
      (1 - u) * v * q[3].x,
    y:
      (1 - u) * (1 - v) * q[0].y +
      u * (1 - v) * q[1].y +
      u * v * q[2].y +
      (1 - u) * v * q[3].y,
  };
}

/**
 * One repeating pattern cell: a single tile face inside a grout border
 * (port of vBuildPat). `rotate90` draws the texture rotated a quarter-turn —
 * physical tile dimensions must be swapped by the caller before computing
 * tileWpx / tileHpx.
 */
export function buildTilePattern(
  img: CanvasImageSource,
  tileWpx: number,
  tileHpx: number,
  groutPx: number,
  groutColor: string,
  rotate90 = false,
): HTMLCanvasElement {
  const tw = Math.max(4, Math.round(tileWpx));
  const th = Math.max(4, Math.round(tileHpx));
  const gw = Math.max(0, Math.round(groutPx));
  const cell = document.createElement("canvas");
  cell.width = tw + gw;
  cell.height = th + gw;
  const c = cell.getContext("2d");
  if (!c) return cell;
  c.fillStyle = groutColor;
  c.fillRect(0, 0, cell.width, cell.height);
  const faceW = tw - gw / 2;
  const faceH = th - gw / 2;
  const half = gw / 2;
  if (rotate90) {
    c.save();
    c.translate(half + faceW / 2, half + faceH / 2);
    c.rotate(Math.PI / 2);
    c.drawImage(img, -faceH / 2, -faceW / 2, faceH, faceW);
    c.restore();
  } else {
    c.drawImage(img, half, half, faceW, faceH);
  }
  return cell;
}

/**
 * Tile a pattern cell into one big canvas (port of vBuildBig) — used as the
 * flat source texture that then gets perspective-warped onto the floor quad.
 */
export function buildTiledCanvas(
  pattern: HTMLCanvasElement,
  cols: number,
  rows: number,
): HTMLCanvasElement {
  const big = document.createElement("canvas");
  big.width = Math.max(1, pattern.width * Math.max(1, Math.round(cols)));
  big.height = Math.max(1, pattern.height * Math.max(1, Math.round(rows)));
  const c = big.getContext("2d");
  if (!c) return big;
  const pat = c.createPattern(pattern, "repeat");
  if (!pat) return big;
  c.fillStyle = pat;
  c.fillRect(0, 0, big.width, big.height);
  return big;
}

export interface ShadeOptions {
  /** The original photo — multiplied back over the tiles for lighting realism. */
  image: CanvasImageSource;
  /** Canvas-space width/height to draw the shade image at. */
  width: number;
  height: number;
  /** Multiply strength. Legacy used 0.13 for floors, 0.11 for walls. */
  alpha?: number;
}

/** Clip to a polygon path and multiply the original photo back over the fill. */
function applyShade(
  ctx: CanvasRenderingContext2D,
  polygon: Pt[],
  shade: ShadeOptions,
): void {
  ctx.save();
  ctx.beginPath();
  polygon.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = shade.alpha ?? 0.13;
  ctx.drawImage(shade.image, 0, 0, shade.width, shade.height);
  ctx.restore();
}

export interface FloorRenderOptions {
  /** Mesh density. Legacy used 30; 24+ keeps the warp visually smooth. */
  subdivisions?: number;
  /** Overall opacity of the tile layer (0-1). */
  alpha?: number;
  /** Optional multiply pass of the original photo for lighting realism. */
  shade?: ShadeOptions;
}

/**
 * Perspective-render a flat tiled source onto an arbitrary destination quad
 * via a subdivided bilinear mesh of triangle warps (port of vRenderFloor).
 * `quad` order matches the source orientation: top-left, top-right,
 * bottom-right, bottom-left of the source map to quad[0..3].
 */
export function renderFloorPerspective(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  quad: Quad,
  opts: FloorRenderOptions = {},
): void {
  const S = Math.max(4, opts.subdivisions ?? 28);
  const bw = source.width;
  const bh = source.height;
  const sq: Quad = [
    { x: 0, y: 0 },
    { x: bw, y: 0 },
    { x: bw, y: bh },
    { x: 0, y: bh },
  ];
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  for (let i = 0; i < S; i++) {
    for (let j = 0; j < S; j++) {
      const u0 = i / S;
      const u1 = (i + 1) / S;
      const v0 = j / S;
      const v1 = (j + 1) / S;
      const s00 = bilerp(sq, u0, v0);
      const s10 = bilerp(sq, u1, v0);
      const s11 = bilerp(sq, u1, v1);
      const s01 = bilerp(sq, u0, v1);
      const d00 = bilerp(quad, u0, v0);
      const d10 = bilerp(quad, u1, v0);
      const d11 = bilerp(quad, u1, v1);
      const d01 = bilerp(quad, u0, v1);
      drawTriangleWarp(ctx, source, s00, s10, s11, d00, d10, d11);
      drawTriangleWarp(ctx, source, s00, s11, s01, d00, d11, d01);
    }
  }
  ctx.restore();
  if (opts.shade) applyShade(ctx, quad, opts.shade);
}

export interface WallRenderOptions {
  /** Full canvas size — the pattern fill must cover it before clipping. */
  canvasW: number;
  canvasH: number;
  /** Rotate the pattern around the polygon centroid, in degrees. */
  rotationDeg?: number;
  /** Overall opacity of the tile layer (0-1). */
  alpha?: number;
  /** Optional multiply pass of the original photo for lighting realism. */
  shade?: ShadeOptions;
}

/**
 * Fill an arbitrary polygon with a repeating tile pattern, optionally
 * rotated around its centroid (port of vRenderWall).
 */
export function renderWallFlat(
  ctx: CanvasRenderingContext2D,
  polygon: Pt[],
  pattern: HTMLCanvasElement,
  opts: WallRenderOptions,
): void {
  if (polygon.length < 3) return;
  const cx = polygon.reduce((s, p) => s + p.x, 0) / polygon.length;
  const cy = polygon.reduce((s, p) => s + p.y, 0) / polygon.length;
  const rot = ((opts.rotationDeg ?? 0) * Math.PI) / 180;
  ctx.save();
  ctx.beginPath();
  polygon.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.translate(-cx, -cy);
  const pat = ctx.createPattern(pattern, "repeat");
  if (pat) {
    ctx.globalAlpha = opts.alpha ?? 1;
    ctx.fillStyle = pat;
    ctx.fillRect(-opts.canvasW, -opts.canvasH, opts.canvasW * 3, opts.canvasH * 3);
  }
  ctx.restore();
  if (opts.shade) applyShade(ctx, polygon, opts.shade);
}

export interface Coverage {
  /** Room area in m². */
  area: number;
  /** Exact tiles needed to cover the area. */
  tiles: number;
  /** Tiles to order including a 10% wastage buffer. */
  orderQty: number;
}

/** Tile coverage math: room in metres, tile in millimetres, +10% waste. */
export function tilesNeeded(
  roomWm: number,
  roomLm: number,
  tileWmm: number,
  tileHmm: number,
): Coverage {
  const area = Math.max(0, roomWm) * Math.max(0, roomLm);
  const tileArea = (tileWmm / 1000) * (tileHmm / 1000);
  const tiles = tileArea > 0 ? Math.ceil(area / tileArea) : 0;
  const orderQty = Math.ceil(tiles * 1.1);
  return { area, tiles, orderQty };
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();

/** Load (and decode) an image once; subsequent calls share the promise. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  let cached = imageCache.get(src);
  if (!cached) {
    cached = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        img
          .decode()
          .then(() => resolve(img))
          .catch(() => resolve(img)); // decode() can reject on already-usable images
      };
      img.onerror = () => {
        imageCache.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });
    imageCache.set(src, cached);
  }
  return cached;
}
