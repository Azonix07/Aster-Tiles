import fs from "fs";
import path from "path";
import crypto from "crypto";
import { tiles as seedTiles, collections as seedCollections, gallery as seedGallery, type Tile } from "@/lib/tiles";
import { site as seedSite, staff as seedStaff, testimonials as seedTestimonials } from "@/lib/site";
import { ORDER_STATUSES, type Address, type Order, type OrderItem, type OrderStatus } from "@/lib/shopTypes";

// Server-side re-exports; client components import these from "@/lib/shopTypes".
export { ORDER_STATUSES };
export type { Address, Order, OrderItem, OrderStatus };

/* ── Types ─────────────────────────────────────────── */

export interface DbTile extends Tile {
  inStock: boolean;
}

export interface SiteInfo {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  phoneHref: string;
  email: string;
  emailHref: string;
  address: { line1: string; line2: string; mapsUrl: string };
  hours: { days: string; time: string }[];
  stats: { value: number; suffix: string; label: string }[];
  nav: { href: string; label: string }[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  location: string;
}

export interface CollectionInfo {
  id: string;
  name: string;
  blurb: string;
  image: string;
  description: string;
}

export interface GalleryItem {
  id: string;
  image: string;
  tag: string;
  span: "wide" | "tall" | "std";
}

export interface SiteContent {
  site: SiteInfo;
  staff: StaffMember[];
  testimonials: Testimonial[];
  collections: CollectionInfo[];
  gallery: GalleryItem[];
}

export interface Settings {
  currencySymbol: string;
  deliveryFee: number;
  /** order subtotal above which delivery is free; 0 disables free delivery */
  freeDeliveryOver: number;
  codEnabled: boolean;
  /** show the Razorpay option at checkout (display only for now) */
  razorpayEnabled: boolean;
  maintenance: {
    fullSite: boolean;
    payments: boolean;
    message: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  addresses: Address[];
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface Db {
  tiles: DbTile[];
  content: SiteContent;
  settings: Settings;
  users: User[];
  sessions: Session[];
  orders: Order[];
  counters: { order: number };
}

/* ── Password hashing (used here for the seeded admin) ── */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

export function newId(): string {
  return crypto.randomBytes(10).toString("hex");
}

/* ── Store ─────────────────────────────────────────── */

// On Vercel the project root is read-only; /tmp is the only writable dir.
const IS_VERCEL = process.env.VERCEL === "1";
const DATA_DIR = IS_VERCEL ? "/tmp" : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
// Bundled seed file shipped with the deployment (always readable).
const SEED_FILE = path.join(process.cwd(), "data", "db.json");

export const DEFAULT_ADMIN = { email: "admin@astertiles.ie", password: "admin123" };

function seed(): Db {
  return {
    tiles: seedTiles.map((t) => ({ ...structuredClone(t), inStock: true })),
    content: structuredClone({
      site: seedSite,
      staff: seedStaff,
      testimonials: seedTestimonials,
      collections: seedCollections,
      gallery: seedGallery,
    }) as unknown as SiteContent,
    settings: {
      currencySymbol: "€",
      deliveryFee: 25,
      freeDeliveryOver: 500,
      codEnabled: true,
      razorpayEnabled: true,
      maintenance: {
        fullSite: false,
        payments: false,
        message:
          "We're doing a little regrouting behind the scenes. You can still browse every tile — ordering will be back shortly.",
      },
    },
    users: [
      {
        id: newId(),
        name: "Aster Admin",
        email: DEFAULT_ADMIN.email,
        passwordHash: hashPassword(DEFAULT_ADMIN.password),
        isAdmin: true,
        addresses: [],
        createdAt: new Date().toISOString(),
      },
    ],
    sessions: [],
    orders: [],
    counters: { order: 0 },
  };
}

function readDb(): Db {
  if (!fs.existsSync(DB_FILE)) {
    // On Vercel: copy the bundled seed file into /tmp so subsequent reads work.
    if (IS_VERCEL && fs.existsSync(SEED_FILE)) {
      const db = JSON.parse(fs.readFileSync(SEED_FILE, "utf8")) as Db;
      writeDb(db);
      return db;
    }
    const db = seed();
    writeDb(db);
    return db;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as Db;
}

function writeDb(db: Db): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  // On Vercel /tmp rename across devices can fail; write directly.
  if (IS_VERCEL) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } else {
    const tmp = `${DB_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
    fs.renameSync(tmp, DB_FILE);
  }
}

export function getDb(): Db {
  return readDb();
}

/** Read-modify-write helper; returns whatever the mutator returns. */
export function mutateDb<T>(fn: (db: Db) => T): T {
  const db = readDb();
  const result = fn(db);
  writeDb(db);
  return result;
}

/* ── Convenience getters ───────────────────────────── */

export function getTiles(): DbTile[] {
  return getDb().tiles;
}

export function getTile(id: string): DbTile | undefined {
  return getDb().tiles.find((t) => t.id === id);
}

export function getContent(): SiteContent {
  return getDb().content;
}

export function getSettings(): Settings {
  return getDb().settings;
}

/* ── Sessions ──────────────────────────────────────── */

const SESSION_DAYS = 30;

export function createSession(userId: string): Session {
  return mutateDb((db) => {
    const now = Date.now();
    db.sessions = db.sessions.filter((s) => Date.parse(s.expiresAt) > now);
    const session: Session = {
      token: crypto.randomBytes(32).toString("hex"),
      userId,
      expiresAt: new Date(now + SESSION_DAYS * 24 * 3600 * 1000).toISOString(),
    };
    db.sessions.push(session);
    return session;
  });
}

export function deleteSession(token: string): void {
  mutateDb((db) => {
    db.sessions = db.sessions.filter((s) => s.token !== token);
  });
}

export function getUserByToken(token: string | undefined): User | null {
  if (!token) return null;
  const db = getDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null;
  return db.users.find((u) => u.id === session.userId) ?? null;
}

/* ── Orders ────────────────────────────────────────── */

export function nextOrderNumber(db: Db): string {
  db.counters.order += 1;
  return `AT-${new Date().getFullYear()}-${String(db.counters.order).padStart(4, "0")}`;
}
