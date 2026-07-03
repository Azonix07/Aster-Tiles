/**
 * Shared shop types and constants that are safe to import from client
 * components (no Node.js imports here — db.ts re-exports these for the server).
 */

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  county: string;
  postcode: string;
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out-for-delivery",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItem {
  tileId: string;
  name: string;
  image: string;
  pricePerSqm: number;
  sqm: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  /** human-friendly order number, e.g. AT-2026-0042 */
  number: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  address: Omit<Address, "id">;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currencySymbol: string;
  paymentMethod: "cod" | "razorpay";
  paymentStatus: "pending" | "paid" | "refunded";
  status: OrderStatus;
  timeline: { status: OrderStatus; note?: string; at: string }[];
  customerNote?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}
