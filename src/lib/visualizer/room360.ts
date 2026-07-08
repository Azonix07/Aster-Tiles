import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { loadImage } from "@/lib/visualizer/engine";

/* ═══════════════════════════════════════════════════════════════════════
 * 360° Room — a fully-furnished living room rendered with three.js.
 * Furniture is real photoscanned/PBR glTF models (Poly Haven, CC0) served
 * from /public/models; lighting combines an interior HDRI environment,
 * sunlight through the window and warm practical lights. The camera sits
 * at the centre of the room; floor and walls re-skin live from any tile
 * in the catalogue (or a paint colour for the walls).
 * ═══════════════════════════════════════════════════════════════════════ */

export interface SurfaceTile {
  id: string;
  name: string;
  texture: string;
  widthMm: number;
  heightMm: number;
  finish: string;
  defaultGrout: string;
}

export type WallFinish =
  | { kind: "paint"; color: string; name: string }
  | { kind: "tile"; tile: SurfaceTile };

export interface Room360Options {
  /** called as async assets (models, HDRI, wall maps) arrive */
  onProgress?: (loaded: number, total: number) => void;
}

export interface Room360Handle {
  setFloorTile(tile: SurfaceTile): Promise<void>;
  setWallFinish(finish: WallFinish): Promise<void>;
  setAutoRotate(on: boolean): void;
  resetView(): void;
  snapshot(): string;
  dispose(): void;
}

/* Room shell dimensions (metres). Camera lives at the centre. */
const ROOM_W = 6.2; // x
const ROOM_L = 4.8; // z
const ROOM_H = 2.95;
const EYE = new THREE.Vector3(0, 1.58, 0.1);

/* ── Tiled-surface texture baking ──────────────────────────────────────
 * One tile face + grout is baked into a small canvas which then repeats
 * across the surface. Planks (aspect ≥ 3) get a 50% running bond. */

interface BakedPattern {
  canvas: HTMLCanvasElement;
  /** physical metres covered by one repeat of the canvas */
  coverW: number;
  coverH: number;
}

/* Some catalogue photos are product shots — the tile face centred on a
 * white background. Detect and trim those margins so only the face
 * repeats across the surface. A row/column is "background" when ≥97% of
 * its pixels are near-white; genuinely white tiles (marble etc.) have
 * texture and shadow, so whole rows never pass the threshold. */
const cropCache = new WeakMap<HTMLImageElement, [number, number, number, number]>();

function contentCrop(img: HTMLImageElement): [number, number, number, number] {
  const cached = cropCache.get(img);
  if (cached) return cached;
  const full: [number, number, number, number] = [0, 0, img.naturalWidth, img.naturalHeight];
  const S = 96;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  let crop = full;
  try {
    ctx!.drawImage(img, 0, 0, S, S);
    const data = ctx!.getImageData(0, 0, S, S).data;
    const isBg = (x: number, y: number) => {
      const i = (y * S + x) * 4;
      return data[i] >= 246 && data[i + 1] >= 246 && data[i + 2] >= 246;
    };
    const rowBg = (y: number) => {
      let n = 0;
      for (let x = 0; x < S; x++) if (isBg(x, y)) n++;
      return n / S >= 0.97;
    };
    const colBg = (x: number) => {
      let n = 0;
      for (let y = 0; y < S; y++) if (isBg(x, y)) n++;
      return n / S >= 0.97;
    };
    let top = 0;
    let bottom = S - 1;
    let left = 0;
    let right = S - 1;
    while (top < bottom && rowBg(top)) top++;
    while (bottom > top && rowBg(bottom)) bottom--;
    while (left < right && colBg(left)) left++;
    while (right > left && colBg(right)) right--;
    // inset trimmed edges one sample cell so sub-pixel background never bleeds in
    if (top > 0) top++;
    if (left > 0) left++;
    if (bottom < S - 1) bottom--;
    if (right < S - 1) right--;
    const area = ((right - left + 1) * (bottom - top + 1)) / (S * S);
    if (area < 0.98 && area > 0.05) {
      crop = [
        (left / S) * img.naturalWidth,
        (top / S) * img.naturalHeight,
        ((right - left + 1) / S) * img.naturalWidth,
        ((bottom - top + 1) / S) * img.naturalHeight,
      ];
    }
  } catch {
    // tainted canvas or decode issue — fall back to the full image
  }
  cropCache.set(img, crop);
  return crop;
}

function bakeTilePattern(img: HTMLImageElement | null, tile: SurfaceTile): BakedPattern {
  const tw = tile.widthMm / 1000;
  const th = tile.heightMm / 1000;
  const plank = th / tw >= 3 || tw / th >= 3;

  // ~640px on the tile's long side keeps repeats crisp without huge uploads.
  const scale = 640 / Math.max(tile.widthMm, tile.heightMm);
  const px = Math.max(2, Math.round(3 * scale)); // ≈3mm grout
  const cw = Math.max(32, Math.round(tile.widthMm * scale));
  const ch = Math.max(32, Math.round(tile.heightMm * scale));

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = plank ? ch * 2 : ch;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = tile.defaultGrout;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const crop = img ? contentCrop(img) : null;
  const face = (x: number, y: number) => {
    const w = cw - px;
    const h = ch - px;
    if (img && crop) {
      ctx.drawImage(img, crop[0], crop[1], crop[2], crop[3], x + px / 2, y + px / 2, w, h);
      // faint edge shade so each tile reads as a separate piece
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, "rgba(255,255,255,0.05)");
      g.addColorStop(1, "rgba(0,0,0,0.07)");
      ctx.fillStyle = g;
      ctx.fillRect(x + px / 2, y + px / 2, w, h);
    } else {
      ctx.fillStyle = "#c9c4bc";
      ctx.fillRect(x + px / 2, y + px / 2, w, h);
    }
  };

  if (plank) {
    // running bond: second course shifted half a plank
    face(0, 0);
    face(-cw / 2, ch);
    face(cw / 2, ch);
    return { canvas, coverW: tw, coverH: th * 2 };
  }
  face(0, 0);
  return { canvas, coverW: tw, coverH: th };
}

function finishRoughness(finish: string): number {
  const f = finish.toLowerCase();
  if (f.includes("polish") || f.includes("gloss")) return 0.12;
  if (f.includes("carving")) return 0.45;
  return 0.6;
}

/* ── Small procedural textures (TV picture, window view, rug weave) ── */

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function tvPictureTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 288, (ctx) => {
    const sky = ctx.createLinearGradient(0, 0, 0, 288);
    sky.addColorStop(0, "#0e2a4a");
    sky.addColorStop(0.55, "#2d6a8f");
    sky.addColorStop(0.72, "#e8a45c");
    sky.addColorStop(1, "#1c3244");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 512, 288);
    ctx.fillStyle = "rgba(255,214,140,0.9)";
    ctx.beginPath();
    ctx.arc(360, 180, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#122534";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(-60 + i * 130, 288);
      ctx.lineTo(20 + i * 130, 150 + (i % 2) * 30);
      ctx.lineTo(120 + i * 130, 288);
      ctx.closePath();
      ctx.fill();
    }
  });
}

function skyTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#9ec8f2");
    g.addColorStop(0.6, "#d9ecff");
    g.addColorStop(0.78, "#b6d7a8");
    g.addColorStop(1, "#7fa96b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    for (const [x, y, r] of [[120, 110, 38], [180, 96, 52], [250, 118, 40], [380, 170, 46], [430, 158, 30]] as const) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function rugTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 384, (ctx) => {
    ctx.fillStyle = "#cfc4b2";
    ctx.fillRect(0, 0, 512, 384);
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = `rgba(${90 + Math.random() * 60},${80 + Math.random() * 55},${65 + Math.random() * 45},0.08)`;
      ctx.fillRect(Math.random() * 512, Math.random() * 384, 2, 2);
    }
    ctx.strokeStyle = "#8f7f66";
    ctx.lineWidth = 10;
    ctx.strokeRect(18, 18, 476, 348);
    ctx.strokeStyle = "#a5977e";
    ctx.lineWidth = 4;
    ctx.strokeRect(38, 38, 436, 308);
  });
}

/* ── Materials ─────────────────────────────────────────────────────── */

const mat = {
  fabric: (color: number) =>
    new THREE.MeshPhysicalMaterial({ color, roughness: 0.95, sheen: 0.6, sheenRoughness: 0.9 }),
  wood: (color: number, rough = 0.55) => new THREE.MeshStandardMaterial({ color, roughness: rough }),
  metal: (color: number, rough = 0.3) =>
    new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.9 }),
  matte: (color: number, rough = 0.85) => new THREE.MeshStandardMaterial({ color, roughness: rough }),
  emissive: (color: number, intensity: number, base = 0x111111) =>
    new THREE.MeshStandardMaterial({ color: base, emissive: color, emissiveIntensity: intensity }),
};

function shadowed<T extends THREE.Object3D>(obj: T, cast = true, receive = true): T {
  obj.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = cast;
      o.receiveShadow = receive;
    }
  });
  return obj;
}

/** free all geometry, materials and textures under a node */
function disposeObject(root: THREE.Object3D): void {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        for (const v of Object.values(m)) {
          if (v instanceof THREE.Texture) v.dispose();
        }
        m.dispose();
      }
    }
  });
}

/* ── Hand-built props (things with no good free model equivalent) ──── */

function buildTv(): THREE.Group {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new RoundedBoxGeometry(1.48, 0.86, 0.045, 2, 0.008), mat.matte(0x0b0b0d, 0.4));
  g.add(frame);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.42, 0.8),
    new THREE.MeshPhysicalMaterial({
      color: 0x050505,
      roughness: 0.08,
      emissive: 0xffffff,
      emissiveMap: tvPictureTexture(),
      emissiveIntensity: 0.85,
    }),
  );
  screen.position.z = 0.024;
  g.add(screen);
  const bar = new THREE.Mesh(new RoundedBoxGeometry(1.1, 0.07, 0.09, 2, 0.03), mat.matte(0x17181a, 0.6));
  bar.position.set(0, -0.62, 0.02);
  g.add(bar);
  return shadowed(g);
}

function buildSpeakers(): THREE.Group {
  const g = new THREE.Group();
  for (const side of [-1, 1]) {
    const sp = new THREE.Group();
    const cab = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.95, 0.26, 2, 0.012), mat.matte(0x121316, 0.55));
    cab.position.y = 0.5;
    sp.add(cab);
    for (const [y, r] of [[0.72, 0.055], [0.5, 0.075], [0.28, 0.075]] as const) {
      const driver = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.02, 20), mat.matte(0x2c2e33, 0.4));
      driver.rotation.x = Math.PI / 2;
      driver.position.set(0, y, 0.135);
      sp.add(driver);
    }
    sp.position.set(side * 1.75, 0, 0);
    g.add(sp);
  }
  return shadowed(g);
}

function buildFloorLamp(): { group: THREE.Group; light: THREE.SpotLight } {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.025, 24), mat.metal(0x2b2b2e, 0.35));
  base.position.y = 0.012;
  g.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 10), mat.metal(0x2b2b2e, 0.35));
  pole.position.y = 0.76;
  g.add(pole);
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.28, 24, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xe8ddc8,
      roughness: 0.9,
      side: THREE.DoubleSide,
      emissive: 0xffc98a,
      emissiveIntensity: 0.55,
    }),
  );
  shade.position.y = 1.6;
  g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10), mat.emissive(0xffd9a0, 3, 0xfff6e6));
  bulb.position.y = 1.56;
  g.add(bulb);

  const light = new THREE.SpotLight(0xffd3a0, 18, 6, Math.PI * 0.38, 0.5, 1.6);
  light.position.set(0, 1.58, 0);
  light.target.position.set(0, 0, 0);
  g.add(light, light.target);
  shadowed(g);
  shade.castShadow = false;
  bulb.castShadow = false;
  return { group: g, light };
}

/** small warm lamp that sits on the side table */
function buildTableLamp(): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.16, 16), mat.metal(0xc9a84c, 0.3));
  base.position.y = 0.08;
  g.add(base);
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.12, 0.14, 20, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xefe6d4,
      roughness: 0.9,
      side: THREE.DoubleSide,
      emissive: 0xffcf96,
      emissiveIntensity: 0.7,
    }),
  );
  shade.position.y = 0.24;
  g.add(shade);
  shadowed(g);
  shade.castShadow = false;
  return g;
}

function buildWindow(skyTex: THREE.CanvasTexture): THREE.Group {
  const g = new THREE.Group(); // local: window in XY plane facing +z (into room)
  const W = 2.0;
  const H = 1.6;
  const frameMat = mat.matte(0xf2f0ec, 0.5);

  // outside world — bright emissive sky filling the glazed opening.
  // It must sit on the room side of the wall plane or the wall hides it.
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.06, H - 0.06),
    new THREE.MeshBasicMaterial({ map: skyTex, toneMapped: false }),
  );
  sky.position.z = -0.008;
  g.add(sky);

  // glass
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.1, H - 0.1),
    new THREE.MeshPhysicalMaterial({
      color: 0xdcecff,
      roughness: 0.05,
      metalness: 0,
      transparent: true,
      opacity: 0.14,
    }),
  );
  glass.position.z = 0.012;
  g.add(glass);

  // frame + mullions
  const bar = (w: number, h: number, x: number, y: number, d = 0.06) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat);
    m.position.set(x, y, 0);
    g.add(m);
  };
  bar(W, 0.07, 0, H / 2 - 0.035);
  bar(W, 0.07, 0, -H / 2 + 0.035);
  bar(0.07, H, -W / 2 + 0.035, 0);
  bar(0.07, H, W / 2 - 0.035, 0);
  bar(0.045, H, 0, 0);
  bar(W, 0.045, 0, 0.25);
  // sill
  const sill = new THREE.Mesh(new THREE.BoxGeometry(W + 0.16, 0.04, 0.14), frameMat);
  sill.position.set(0, -H / 2 - 0.02, 0.05);
  g.add(sill);

  // curtains: wavy panels either side + rod
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, W + 0.9, 10), mat.metal(0x8a6d3a, 0.35));
  rod.rotation.z = Math.PI / 2;
  rod.position.set(0, H / 2 + 0.18, 0.16);
  g.add(rod);
  const curtainMat = new THREE.MeshPhysicalMaterial({
    color: 0xded5c2,
    roughness: 0.95,
    sheen: 0.5,
    sheenRoughness: 0.8,
    side: THREE.DoubleSide,
  });
  for (const side of [-1, 1]) {
    const cw = 0.55;
    const ch = H + 0.75;
    const geo = new THREE.PlaneGeometry(cw, ch, 24, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(i, Math.sin((x / cw) * Math.PI * 5) * 0.045);
    }
    geo.computeVertexNormals();
    const panel = new THREE.Mesh(geo, curtainMat);
    panel.position.set(side * (W / 2 + 0.22), H / 2 + 0.14 - ch / 2, 0.12);
    g.add(panel);
  }
  shadowed(g, false, true);
  return g;
}

function buildDoor(): THREE.Group {
  const g = new THREE.Group(); // XY plane facing +z
  const W = 0.95;
  const H = 2.06;
  const door = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.045), mat.matte(0xeceae5, 0.6));
  door.position.y = H / 2;
  g.add(door);
  for (const [py, ph] of [[1.45, 0.75], [0.55, 0.85]] as const) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(W - 0.28, ph, 0.012), mat.matte(0xe3e1db, 0.6));
    panel.position.set(0, py, 0.028);
    g.add(panel);
  }
  const frame = new THREE.Mesh(new THREE.BoxGeometry(W + 0.14, H + 0.07, 0.02), mat.matte(0xf4f2ee, 0.55));
  frame.position.set(0, (H + 0.07) / 2, -0.012);
  g.add(frame);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.13, 10), mat.metal(0xb8b8bc, 0.25));
  handle.rotation.z = Math.PI / 2;
  handle.position.set(W / 2 - 0.09, 1.02, 0.05);
  g.add(handle);
  return shadowed(g, false, true);
}

function buildAcUnit(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.85, 0.28, 0.2, 3, 0.05), mat.matte(0xf5f4f1, 0.4));
  g.add(body);
  const vent = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.045, 0.02), mat.matte(0xdcdad4, 0.5));
  vent.position.set(0, -0.09, 0.1);
  vent.rotation.x = 0.5;
  g.add(vent);
  const led = new THREE.Mesh(new THREE.CircleGeometry(0.008, 10), mat.emissive(0x35e08a, 2));
  led.position.set(0.32, -0.06, 0.101);
  g.add(led);
  return shadowed(g, false, false);
}

/* ── glTF furniture set (Poly Haven, CC0) ──────────────────────────── */

interface Placement {
  slug: string;
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
  /** floor: rest bbox bottom on position.y · ceiling: hang bbox top at ROOM_H · origin: use authored origin */
  anchor: "floor" | "ceiling" | "origin";
}

const PLACEMENTS: Placement[] = [
  // seating around the rug, facing the TV wall (north, -z)
  { slug: "sofa_02", position: [0.15, 0, 1.95], rotationY: Math.PI, scale: 1.15, anchor: "floor" },
  { slug: "modern_arm_chair_01", position: [-2.05, 0, 1.15], rotationY: Math.PI + Math.atan2(2.05, -3.55), anchor: "floor" },
  { slug: "modern_coffee_table_01", position: [0, 0, 0.5], rotationY: Math.PI / 2, anchor: "floor" },

  // media wall (north)
  { slug: "modern_wooden_cabinet", position: [0, 0, -2.02], rotationY: 0, scale: 0.92, anchor: "floor" },
  { slug: "gaming_console", position: [0.62, 0.626, -2.0], rotationY: 0.12, scale: 0.92, anchor: "floor" },
  { slug: "potted_plant_04", position: [-0.82, 0.626, -2.05], rotationY: 0.8, scale: 0.92, anchor: "floor" },

  // west wall
  { slug: "wooden_bookshelf_worn", position: [-2.78, 0, -0.9], rotationY: Math.PI / 2, anchor: "floor" },

  // east side, by the window
  { slug: "potted_plant_01", position: [2.55, 0, -1.8], rotationY: -0.6, anchor: "floor" },
  { slug: "side_table_01", position: [2.6, 0, 1.65], rotationY: 0, anchor: "floor" },

  // hanging pieces
  { slug: "modern_ceiling_lamp_01", position: [0, ROOM_H, 0.5], rotationY: 0, anchor: "ceiling" },
  { slug: "hanging_picture_frame_01", position: [-0.55, 1.8, ROOM_L / 2 - 0.03], rotationY: Math.PI, anchor: "origin" },
  { slug: "hanging_picture_frame_03", position: [0.5, 1.75, ROOM_L / 2 - 0.03], rotationY: Math.PI, anchor: "origin" },
];

/** per-model material touch-ups, keyed by material name */
function tuneMaterial(m: THREE.Material): void {
  if (m.name === "modern_ceiling_globe" && m instanceof THREE.MeshStandardMaterial) {
    m.emissive.set(0xffd9a8);
    m.emissiveIntensity = 2.2;
  }
  if (m.name.includes("leaves") && m instanceof THREE.MeshStandardMaterial) {
    m.side = THREE.DoubleSide;
    if (m.transparent) {
      m.transparent = false;
      m.alphaTest = 0.45; // alpha-cut instead of sorting-prone blending
    }
  }
  if (m.name.includes("glass") && m instanceof THREE.MeshPhysicalMaterial) {
    m.depthWrite = false;
  }
}

/* ── Scene assembly ────────────────────────────────────────────────── */

interface Surfaces {
  floor: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshPhysicalMaterial>;
  walls: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshPhysicalMaterial>[];
}

function buildRoomShell(scene: THREE.Scene): Surfaces {
  const floorMat = new THREE.MeshPhysicalMaterial({ color: 0xcccccc, roughness: 0.5 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_L), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // each wall gets its own material — texture repeat depends on wall width
  const mkWall = (w: number, x: number, z: number, ry: number) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, ROOM_H),
      new THREE.MeshPhysicalMaterial({ color: 0xe8e4dc, roughness: 0.85 }),
    );
    m.position.set(x, ROOM_H / 2, z);
    m.rotation.y = ry;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  const walls = [
    mkWall(ROOM_W, 0, -ROOM_L / 2, 0), // north (TV)
    mkWall(ROOM_W, 0, ROOM_L / 2, Math.PI), // south (sofa)
    mkWall(ROOM_L, ROOM_W / 2, 0, -Math.PI / 2), // east (window)
    mkWall(ROOM_L, -ROOM_W / 2, 0, Math.PI / 2), // west (shelf/door)
  ];

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_W, ROOM_L),
    new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.9 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ROOM_H;
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  // recessed ceiling spot bezels (decorative)
  for (const [x, z] of [[-1.8, -1.4], [1.8, -1.4], [-1.8, 1.4], [1.8, 1.4]] as const) {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), mat.emissive(0xfff0d4, 1.6, 0xf0ede6));
    disc.rotation.x = Math.PI / 2;
    disc.position.set(x, ROOM_H - 0.005, z);
    scene.add(disc);
  }

  // skirting boards
  const skirtMat = mat.matte(0xf2f0ec, 0.5);
  const mkSkirt = (w: number, x: number, z: number, ry: number) => {
    const s = new THREE.Mesh(new THREE.BoxGeometry(w, 0.09, 0.018), skirtMat);
    s.position.set(x, 0.045, z);
    s.rotation.y = ry;
    scene.add(s);
  };
  const inset = 0.012;
  mkSkirt(ROOM_W, 0, -ROOM_L / 2 + inset, 0);
  mkSkirt(ROOM_W, 0, ROOM_L / 2 - inset, Math.PI);
  mkSkirt(ROOM_L, ROOM_W / 2 - inset, 0, -Math.PI / 2);
  mkSkirt(ROOM_L, -ROOM_W / 2 + inset, 0, Math.PI / 2);

  return { floor, walls };
}

/** static hand-built furniture and fittings that complement the glTF set */
function furnishProps(scene: THREE.Scene, skyTex: THREE.CanvasTexture, fabricMaps: {
  normal: THREE.Texture | null;
  rough: THREE.Texture | null;
}): void {
  // rug between sofa and TV
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 2.3),
    new THREE.MeshStandardMaterial({
      map: rugTexture(),
      roughness: 1,
      normalMap: fabricMaps.normal,
      roughnessMap: fabricMaps.rough,
      normalScale: new THREE.Vector2(0.6, 0.6),
    }),
  );
  if (rug.material.normalMap) {
    for (const t of [rug.material.normalMap, rug.material.roughnessMap]) {
      if (!t) continue;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(6, 4);
    }
  }
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.006, 0.35);
  rug.receiveShadow = true;
  scene.add(rug);

  const tv = buildTv();
  tv.position.set(0, 1.58, -2.33);
  scene.add(tv);

  const speakers = buildSpeakers();
  speakers.position.set(0, 0, -2.1);
  scene.add(speakers);

  const door = buildDoor();
  door.position.set(-3.08, 0, 1.75);
  door.rotation.y = Math.PI / 2;
  scene.add(door);

  const ac = buildAcUnit();
  ac.position.set(-2.99, 2.42, -0.9);
  ac.rotation.y = Math.PI / 2;
  scene.add(ac);

  const tableLamp = buildTableLamp();
  tableLamp.position.set(2.6, 0.55, 1.65); // on side_table_01
  scene.add(tableLamp);

  const window3d = buildWindow(skyTex);
  window3d.position.set(ROOM_W / 2 - 0.01, 1.7, -0.2);
  window3d.rotation.y = -Math.PI / 2;
  scene.add(window3d);
}

/* ── Public factory ────────────────────────────────────────────────── */

export function createRoom360(canvas: HTMLCanvasElement, opts: Room360Options = {}): Room360Handle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // everything is static — render shadow maps once, then freeze them
  renderer.shadowMap.autoUpdate = false;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f14);

  const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 60);
  camera.position.copy(EYE);

  let disposed = false;
  const TOTAL_ASSETS = PLACEMENTS.length + 1 /* hdri */ + 2 /* plaster */ + 2 /* rug fabric */;
  let loadedAssets = 0;
  const progress = () => {
    loadedAssets++;
    opts.onProgress?.(loadedAssets, TOTAL_ASSETS);
  };

  /* ambient light: neutral studio env immediately, real interior HDRI when loaded */
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envTex: THREE.Texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.35;

  new HDRLoader().loadAsync("/hdri/lebombo_1k.hdr").then((hdr) => {
    if (disposed) {
      hdr.dispose();
      return;
    }
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    const next = pmrem.fromEquirectangular(hdr).texture;
    hdr.dispose();
    envTex.dispose();
    envTex = next;
    scene.environment = next;
    scene.environmentIntensity = 0.55;
  }).catch(() => { /* keep the studio environment */ }).finally(progress);

  /* sun through the east window */
  const sun = new THREE.DirectionalLight(0xfff0dd, 3.2);
  sun.position.set(9, 6.5, 1.5);
  sun.target.position.set(-1.5, 0, -0.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -6;
  sun.shadow.camera.right = 6;
  sun.shadow.camera.top = 6;
  sun.shadow.camera.bottom = -6;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 25;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 4;
  scene.add(sun, sun.target);

  /* cool sky fill so shadows aren't pitch black */
  const hemi = new THREE.HemisphereLight(0xbdd4f2, 0x8a7a66, 0.42);
  scene.add(hemi);

  /* room shell */
  const surfaces = buildRoomShell(scene);

  /* plaster relief maps for painted walls */
  const texLoader = new THREE.TextureLoader();
  const plaster: { nor: THREE.Texture | null; rough: THREE.Texture | null } = {
    nor: null,
    rough: null,
  };
  const plasterJobs = (
    [
      ["nor", "/textures/painted_plaster_wall/painted_plaster_wall_nor_1k.jpg"],
      ["rough", "/textures/painted_plaster_wall/painted_plaster_wall_rough_1k.jpg"],
    ] as const
  ).map(([key, url]) =>
    texLoader
      .loadAsync(url)
      .then((t) => {
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        plaster[key] = t;
      })
      .catch(() => { /* painted walls fall back to flat colour */ })
      .finally(progress),
  );

  /* rug fabric detail maps */
  const fabricMaps: { normal: THREE.Texture | null; rough: THREE.Texture | null } = { normal: null, rough: null };
  const fabricReady = Promise.all(
    (
      [
        ["normal", "/textures/fabric_pattern_07/fabric_pattern_07_nor_1k.jpg"],
        ["rough", "/textures/fabric_pattern_07/fabric_pattern_07_rough_1k.jpg"],
      ] as const
    ).map(([key, url]) =>
      texLoader
        .loadAsync(url)
        .then((t) => {
          fabricMaps[key] = t;
        })
        .catch(() => { /* rug just uses its painted texture */ })
        .finally(progress),
    ),
  );

  const skyTex = skyTexture();
  void fabricReady.then(() => {
    if (disposed) return;
    furnishProps(scene, skyTex, fabricMaps);
    renderer.shadowMap.needsUpdate = true; // the late-added props must reach the shadow maps
  });

  /* glTF furniture */
  const gltfLoader = new GLTFLoader();
  const modelRoot = new THREE.Group();
  scene.add(modelRoot);
  const box = new THREE.Box3();
  for (const p of PLACEMENTS) {
    gltfLoader
      .loadAsync(`/models/${p.slug}/${p.slug}_1k.gltf`)
      .then((gltf) => {
        if (disposed) {
          disposeObject(gltf.scene); // arrived after unmount — free it
          return;
        }
        const obj = gltf.scene;
        obj.rotation.y = p.rotationY ?? 0;
        if (p.scale) obj.scale.setScalar(p.scale);
        obj.updateMatrixWorld(true);
        box.setFromObject(obj);
        if (p.anchor === "floor") {
          // recentre footprint on the XZ target and rest on the given height
          obj.position.set(
            p.position[0] - (box.min.x + box.max.x) / 2,
            p.position[1] - box.min.y,
            p.position[2] - (box.min.z + box.max.z) / 2,
          );
        } else if (p.anchor === "ceiling") {
          obj.position.set(
            p.position[0] - (box.min.x + box.max.x) / 2,
            ROOM_H - box.max.y,
            p.position[2] - (box.min.z + box.max.z) / 2,
          );
        } else {
          obj.position.set(...p.position);
        }
        obj.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach(tuneMaterial);
          }
        });
        modelRoot.add(obj);
        renderer.shadowMap.needsUpdate = true;
      })
      .catch((e) => console.warn(`Room360: could not load ${p.slug}`, e))
      .finally(progress);
  }

  /* practical lights */
  const pendantLight = new THREE.PointLight(0xffd3a0, 30, 0, 2);
  pendantLight.position.set(0, ROOM_H - 0.85, 0.5); // inside the hanging lamp
  pendantLight.castShadow = true;
  pendantLight.shadow.mapSize.set(1024, 1024);
  pendantLight.shadow.bias = -0.004;
  scene.add(pendantLight);

  const floorLamp = buildFloorLamp();
  floorLamp.group.position.set(-2.68, 0, -0.05);
  scene.add(floorLamp.group);

  const tableLampLight = new THREE.PointLight(0xffce96, 5, 0, 2);
  tableLampLight.position.set(2.6, 0.85, 1.65);
  scene.add(tableLampLight);

  const tvGlow = new THREE.PointLight(0x9fc4e8, 2.2, 0, 2);
  tvGlow.position.set(0, 1.5, -2.1);
  scene.add(tvGlow);

  renderer.shadowMap.needsUpdate = true;

  /* ── Look-around controls (camera fixed at room centre) ─────────── */
  let lon = 180; // start facing the TV wall (-z)
  let lat = 2;
  let targetLon = 180;
  let targetLat = 2;
  let fov = 72;
  let targetFov = 72;
  let autoRotate = true;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let pinchDist = 0;

  const onPointerDown = (e: PointerEvent) => {
    dragging = true;
    autoRotate = false;
    lastX = e.clientX;
    lastY = e.clientY;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic events have no active pointer */
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    const scale = (0.16 * fov) / 72;
    targetLon -= (e.clientX - lastX) * scale;
    targetLat += (e.clientY - lastY) * scale;
    targetLat = Math.max(-80, Math.min(80, targetLat));
    lastX = e.clientX;
    lastY = e.clientY;
  };
  const onPointerUp = (e: PointerEvent) => {
    dragging = false;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    targetFov = Math.max(32, Math.min(95, targetFov + e.deltaY * 0.035));
  };
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      pinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    }
  };
  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      targetFov = Math.max(32, Math.min(95, targetFov + (pinchDist - d) * 0.2));
      pinchDist = d;
    }
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });

  /* ── Resize ──────────────────────────────────────────────────────── */
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  /* ── Render loop ─────────────────────────────────────────────────── */
  const lookTarget = new THREE.Vector3();
  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (autoRotate && !dragging) targetLon += 0.045;

    lon += (targetLon - lon) * 0.09;
    lat += (targetLat - lat) * 0.09;
    fov += (targetFov - fov) * 0.12;

    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon);
    lookTarget.setFromSphericalCoords(1, phi, theta).add(camera.position);
    camera.lookAt(lookTarget);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
  };
  tick();

  /* ── Surface swapping ────────────────────────────────────────────── */
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  let floorToken = 0;
  let wallToken = 0;
  let currentWallKind: WallFinish["kind"] = "paint";
  let currentPaint = 0xe8e4dc;

  const patternTexture = async (tile: SurfaceTile): Promise<{ tex: THREE.Texture; baked: BakedPattern }> => {
    let img: HTMLImageElement | null = null;
    try {
      img = await loadImage(tile.texture);
    } catch {
      img = null; // missing texture — baked pattern falls back to a plain face
    }
    const baked = bakeTilePattern(img, tile);
    const tex = new THREE.CanvasTexture(baked.canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = maxAniso;
    return { tex, baked };
  };

  const applyPaint = () => {
    surfaces.walls.forEach((wall) => {
      const m = wall.material;
      const width = wall.geometry.parameters.width;
      m.map?.dispose();
      m.map = null;
      // previous per-wall map clones must be freed before they are replaced
      m.normalMap?.dispose();
      m.roughnessMap?.dispose();
      // plaster relief only (no stained diffuse) so paint colours stay clean.
      // Always clone the shared base maps — each wall needs its own repeat,
      // and disposal above must never hit the base texture.
      const rpt = (t: THREE.Texture | null) => {
        if (!t) return null;
        const c = t.clone();
        c.repeat.set(width / 2.2, ROOM_H / 2.2);
        return c;
      };
      m.normalMap = rpt(plaster.nor);
      m.roughnessMap = rpt(plaster.rough);
      m.normalScale.set(0.5, 0.5);
      m.color.set(currentPaint);
      m.roughness = m.roughnessMap ? 1 : 0.85;
      m.envMapIntensity = 0.5;
      m.needsUpdate = true;
    });
    renderer.shadowMap.needsUpdate = true;
  };

  // apply plaster to the initial painted walls once its maps arrive
  void Promise.all(plasterJobs).then(() => {
    if (!disposed && currentWallKind === "paint") applyPaint();
  });

  const setFloorTile = async (tile: SurfaceTile): Promise<void> => {
    const token = ++floorToken;
    const { tex, baked } = await patternTexture(tile);
    if (token !== floorToken || disposed) {
      tex.dispose();
      return;
    }
    const m = surfaces.floor.material;
    m.map?.dispose();
    tex.repeat.set(ROOM_W / baked.coverW, ROOM_L / baked.coverH);
    m.map = tex;
    m.color.set(0xffffff);
    m.roughness = finishRoughness(tile.finish);
    m.envMapIntensity = m.roughness < 0.2 ? 1.15 : 0.75;
    m.needsUpdate = true;
  };

  const setWallFinish = async (finish: WallFinish): Promise<void> => {
    const token = ++wallToken;
    currentWallKind = finish.kind;
    if (finish.kind === "paint") {
      currentPaint = new THREE.Color(finish.color).getHex();
      applyPaint();
      return;
    }
    const { tex, baked } = await patternTexture(finish.tile);
    if (token !== wallToken || disposed) {
      tex.dispose();
      return;
    }
    surfaces.walls.forEach((wall, i) => {
      const m = wall.material;
      const width = wall.geometry.parameters.width;
      m.map?.dispose();
      m.normalMap?.dispose();
      m.normalMap = null;
      m.roughnessMap?.dispose();
      m.roughnessMap = null;
      const t = i === 0 ? tex : tex.clone();
      t.repeat.set(width / baked.coverW, ROOM_H / baked.coverH);
      m.map = t;
      m.color.set(0xffffff);
      m.roughness = finishRoughness(finish.tile.finish);
      m.envMapIntensity = m.roughness < 0.2 ? 1.0 : 0.6;
      m.needsUpdate = true;
    });
  };

  /* ── Handle ──────────────────────────────────────────────────────── */
  return {
    setFloorTile,
    setWallFinish,
    setAutoRotate(on: boolean) {
      autoRotate = on;
    },
    resetView() {
      targetLon = 180;
      targetLat = 2;
      targetFov = 72;
    },
    snapshot() {
      renderer.render(scene, camera);
      return canvas.toDataURL("image/png");
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      disposeObject(scene);
      for (const t of [plaster.nor, plaster.rough, fabricMaps.normal, fabricMaps.rough]) {
        t?.dispose();
      }
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
