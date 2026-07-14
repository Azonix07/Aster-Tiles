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

export const TICKET_STATUSES = ["open", "pending", "resolved", "closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export interface TicketMessage {
  id: string;
  /** "customer" for the person who opened it, "staff" for an admin/manager/staff reply */
  author: "customer" | "staff";
  authorName: string;
  body: string;
  createdAt: string;
  /** true when this staff reply was successfully emailed to the customer */
  emailed?: boolean;
}

export interface Ticket {
  id: string;
  /** human-friendly ticket number, e.g. ST-2026-0007 */
  number: string;
  subject: string;
  category: string;
  customerName: string;
  customerEmail: string;
  /** set when opened by a signed-in customer */
  userId?: string;
  /** optionally references an order the ticket is about */
  orderId?: string;
  status: TicketStatus;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
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
