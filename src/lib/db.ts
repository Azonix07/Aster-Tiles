import fsp from "fs/promises";
import path from "path";
import crypto from "crypto";
import { cache } from "react";
import { tiles as seedTiles, collections as seedCollections, gallery as seedGallery, type Tile } from "@/lib/tiles";
import { site as seedSite, staff as seedStaff, testimonials as seedTestimonials } from "@/lib/site";
import {
  ORDER_STATUSES,
  TICKET_STATUSES,
  type Address,
  type Order,
  type OrderItem,
  type OrderStatus,
  type Ticket,
  type TicketMessage,
  type TicketStatus,
} from "@/lib/shopTypes";
import type { Role, Permission } from "@/lib/roles";

// Server-side re-exports; client components import these from "@/lib/shopTypes".
export { ORDER_STATUSES, TICKET_STATUSES };
export type { Address, Order, OrderItem, OrderStatus, Ticket, TicketMessage, TicketStatus };
export type { Role, Permission } from "@/lib/roles";

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

export interface VideoSlot {
  src: string;
  poster: string;
}

/** Every background video and image slot used around the site. */
export interface SiteMedia {
  heroVideo: VideoSlot;
  showroomVideo: VideoSlot;
  staffVideo: VideoSlot;
  collectionsVideo: VideoSlot;
  collectionsBreakImage: string;
  visualizerTeaserImage: string;
  contactCtaImage: string;
  aboutHeroImage: string;
  aboutStoryImage: string;
  aboutShowroomImage: string;
  /** social share / Open Graph image */
  ogImage: string;
}

/**
 * Editable copy for the three scroll scenes on the home page.
 * In headline fields, *word* renders in the green accent italic and
 * line breaks are kept.
 */
export interface HomeText {
  heroBadge: string;
  heroHeadline: string;
  heroSub: string;
  heroAddressLabel: string;
  heroAddressHeadline: string;
  heroClosingHeadline: string;
  heroClosingSub: string;
  showroomLabel: string;
  showroomHeadline: string;
  staffLabel: string;
  staffHeadline: string;
  /** trust marquee lines under the hero */
  marquee: string[];
}

export interface SiteContent {
  site: SiteInfo;
  staff: StaffMember[];
  testimonials: Testimonial[];
  collections: CollectionInfo[];
  gallery: GalleryItem[];
  media: SiteMedia;
  home: HomeText;
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
  /** optional for accounts created before phone was collected at registration */
  phone?: string;
  passwordHash: string;
  /** legacy flag, kept in sync with role === "admin" */
  isAdmin: boolean;
  /** back-office role; absent on pre-RBAC accounts (backfilled by migrate) */
  role: Role;
  /** granular permissions for staff; admins & managers get all implicitly */
  permissions?: Permission[];
  /** false disables back-office access without deleting the account */
  active?: boolean;
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
  tickets: Ticket[];
  counters: { order: number; ticket: number };
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

/**
 * Storage backend. In production (Vercel) the filesystem is read-only and /tmp is
 * wiped between invocations, so the whole DB lives in Upstash Redis (via the Vercel
 * KV integration). When those env vars are absent — i.e. local dev — we transparently
 * fall back to a JSON file under ./data so the project runs with zero setup.
 */
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
export const USE_KV = Boolean(KV_URL && KV_TOKEN);
/** Single Redis key holding the entire serialized Db document. */
export const KV_DB_KEY = "aster:db";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
// Bundled seed file shipped with the deployment (always readable, used to seed KV).
const SEED_FILE = DB_FILE;

export const DEFAULT_ADMIN = { email: "admin@astertiles.ie", password: "admin123" };

export const DEFAULT_MEDIA: SiteMedia = {
  heroVideo: {
    src: "/media/video/exterior-arrival-scrub.mp4",
    poster: "/media/video/exterior-arrival-poster.jpg",
  },
  showroomVideo: {
    src: "/media/video/showroom-entry-scrub.mp4",
    poster: "/media/video/showroom-entry-poster.jpg",
  },
  staffVideo: {
    src: "/media/video/staff-welcome-scrub.mp4",
    poster: "/media/video/staff-welcome-poster.jpg",
  },
  collectionsVideo: {
    src: "/media/video/tile-aisle-loop.mp4",
    poster: "/media/video/tile-aisle-poster.jpg",
  },
  collectionsBreakImage: "/media/gallery/open-plan-marble.jpg",
  visualizerTeaserImage: "/media/stills/bathroom.jpg",
  contactCtaImage: "/media/stills/showroom-wide.jpg",
  aboutHeroImage: "/media/stills/showroom-wide.jpg",
  aboutStoryImage: "/media/stills/exterior.jpg",
  aboutShowroomImage: "/media/stills/showroom-entry.jpg",
  ogImage: "/media/stills/exterior.jpg",
};

export const DEFAULT_HOME: HomeText = {
  heroBadge: "Premium Tiles & Flooring · Donegal",
  heroHeadline: "Where every room\n*begins*",
  heroSub:
    "Premium tiles and flooring, from our Lifford showroom to homes across Ireland.",
  heroAddressLabel: "The Haw · Lifford · Co. Donegal",
  heroAddressHeadline: "Fifteen years on the same street,\n*five thousand* happy homes",
  heroClosingHeadline: "Step *inside*",
  heroClosingSub: "Keep scrolling — the doors are open.",
  showroomLabel: "Welcome to the Showroom",
  showroomHeadline: "Every tile, at *true scale*, under real light",
  staffLabel: "The Aster Team",
  staffHeadline: "Meet the people\n*behind the tiles*",
  marquee: [
    "Free Nationwide Delivery",
    "Premium Quality Guaranteed",
    "Lifford Showroom Open Daily",
    "Expert Design Advice",
    "Same-Day Quotes",
    "500+ Tile Collections",
  ],
};

function seed(): Db {
  return {
    tiles: seedTiles.map((t) => ({ ...structuredClone(t), inStock: true })),
    content: structuredClone({
      site: seedSite,
      staff: seedStaff,
      testimonials: seedTestimonials,
      collections: seedCollections,
      gallery: seedGallery,
      media: DEFAULT_MEDIA,
      home: DEFAULT_HOME,
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
        role: "admin",
        permissions: [],
        active: true,
        addresses: [],
        createdAt: new Date().toISOString(),
      },
    ],
    sessions: [],
    orders: [],
    tickets: [],
    counters: { order: 0, ticket: 0 },
  };
}

/** Backfill sections added after a db was first written. Returns whether it changed. */
function migrate(db: Db): { db: Db; changed: boolean } {
  let changed = false;
  if (!db.content.media) {
    db.content.media = structuredClone(DEFAULT_MEDIA);
    changed = true;
  }
  if (!db.content.home) {
    db.content.home = structuredClone(DEFAULT_HOME);
    changed = true;
  }
  // RBAC: give every pre-existing account a role derived from the legacy flag.
  for (const u of db.users) {
    if (!u.role) {
      u.role = u.isAdmin ? "admin" : "customer";
      changed = true;
    }
  }
  // Support tickets store.
  if (!db.tickets) {
    db.tickets = [];
    changed = true;
  }
  if (db.counters.ticket === undefined) {
    db.counters.ticket = 0;
    changed = true;
  }
  return { db, changed };
}

/* ── Low-level store I/O (Redis in prod, file in dev) ── */

/** Run a single Upstash Redis REST command, e.g. ["GET", key]. */
async function kv<T = unknown>(command: (string | number)[]): Promise<T> {
  const res = await fetch(KV_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Redis ${command[0]} failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const data = (await res.json()) as { result: T; error?: string };
  if (data.error) throw new Error(`Redis ${command[0]} error: ${data.error}`);
  return data.result;
}

/** Load the raw Db from the backing store, or null if it has never been written. */
async function loadRaw(): Promise<Db | null> {
  if (USE_KV) {
    const raw = await kv<string | null>(["GET", KV_DB_KEY]);
    if (!raw) return null;
    return JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw)) as Db;
  }
  try {
    return JSON.parse(await fsp.readFile(DB_FILE, "utf8")) as Db;
  } catch {
    return null;
  }
}

/** Persist the Db to the backing store. */
async function saveRaw(db: Db): Promise<void> {
  if (USE_KV) {
    await kv(["SET", KV_DB_KEY, JSON.stringify(db)]);
    return;
  }
  // On a serverless host (Vercel) the filesystem is read-only and /tmp is wiped
  // between invocations, so a file write either throws or silently vanishes on the
  // next cold start — this is exactly the "admin changes don't persist / maintenance
  // toggle does nothing" bug. Fail loudly rather than pretend the write succeeded.
  if (STORE_STATUS.productionWithoutStore) {
    throw new Error(
      "No durable store configured — set KV_REST_API_URL and KV_REST_API_TOKEN " +
        "(add the Upstash Redis integration in your Vercel project). Refusing to " +
        "write to the ephemeral file store in production, where it would silently vanish.",
    );
  }
  await fsp.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fsp.rename(tmp, DB_FILE);
}

/**
 * Whether writes will actually persist. `productionWithoutStore` is the danger
 * state: a deployed build with no Redis, where every admin edit is silently lost.
 * The admin UI surfaces this so it can never masquerade as "the toggle doesn't work".
 */
export const STORE_STATUS = {
  durable: USE_KV,
  productionWithoutStore: process.env.NODE_ENV === "production" && !USE_KV,
} as const;

/** First-run seed: prefer the bundled data/db.json, else build from the TS sources. */
async function seedInitial(): Promise<Db> {
  try {
    const bundled = JSON.parse(await fsp.readFile(SEED_FILE, "utf8")) as Db;
    return migrate(bundled).db;
  } catch {
    return seed();
  }
}

/** Read the current Db (uncached), seeding/migrating and persisting as needed. */
async function readDbFresh(): Promise<Db> {
  const existing = await loadRaw();
  if (!existing) {
    const fresh = await seedInitial();
    await saveRaw(fresh);
    return fresh;
  }
  const { db, changed } = migrate(existing);
  if (changed) await saveRaw(db);
  return db;
}

/**
 * Per-request-memoized read. React's cache() dedupes the many getContent/getTiles/…
 * calls a single page render makes down to one store round-trip.
 */
const loadDb = cache(readDbFresh);

export async function getDb(): Promise<Db> {
  return loadDb();
}

/**
 * Serializes read-modify-write calls within this instance. Without this, two
 * concurrent mutations can interleave (read, read, write, write) so the later
 * write clobbers the earlier one — losing an order or colliding on an
 * AT-YYYY-NNNN number. The queue makes each mutation see the previous one's
 * result. Cross-instance safety (multiple serverless lambdas hitting the same
 * Redis doc) is a separate concern noted in the README.
 */
let writeQueue: Promise<unknown> = Promise.resolve();

/** Read-modify-write helper; reads fresh and serializes to avoid clobbering concurrent edits. */
export async function mutateDb<T>(fn: (db: Db) => T): Promise<T> {
  const run = async (): Promise<T> => {
    const db = await readDbFresh();
    const result = fn(db);
    await saveRaw(db);
    return result;
  };
  // Chain onto the queue whether or not the previous op resolved, so one failed
  // mutation never wedges the whole queue.
  const result = writeQueue.then(run, run) as Promise<T>;
  writeQueue = result.catch(() => {});
  return result;
}

/* ── Convenience getters ───────────────────────────── */

export async function getTiles(): Promise<DbTile[]> {
  return (await getDb()).tiles;
}

export async function getTile(id: string): Promise<DbTile | undefined> {
  return (await getDb()).tiles.find((t) => t.id === id);
}

export async function getContent(): Promise<SiteContent> {
  return (await getDb()).content;
}

export async function getSettings(): Promise<Settings> {
  return (await getDb()).settings;
}

/**
 * Public, login-free order lookup for the tracking page. Requires BOTH the order
 * number and the email that placed it — order numbers are sequential and guessable
 * (AT-2026-0042), so the email is the shared secret that authorizes the lookup.
 */
export async function findOrderForTracking(
  numberInput: string,
  emailInput: string,
): Promise<Order | undefined> {
  const number = numberInput.trim().toLowerCase();
  const email = emailInput.trim().toLowerCase();
  if (!number || !email) return undefined;
  return (await getDb()).orders.find(
    (o) => o.number.toLowerCase() === number && o.customerEmail.toLowerCase() === email,
  );
}

/* ── Orders ────────────────────────────────────────── */

export function nextOrderNumber(db: Db): string {
  db.counters.order += 1;
  return `AT-${new Date().getFullYear()}-${String(db.counters.order).padStart(4, "0")}`;
}

export function nextTicketNumber(db: Db): string {
  db.counters.ticket += 1;
  return `ST-${new Date().getFullYear()}-${String(db.counters.ticket).padStart(4, "0")}`;
}
