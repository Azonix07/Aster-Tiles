/** €1,234.50 style money formatting with the shop's configurable symbol. */
export function money(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString("en-IE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Order placed",
  confirmed: "Confirmed",
  processing: "Being prepared",
  shipped: "Shipped",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Plain-English explanation of what each status means for the customer. */
export const STATUS_DESCRIPTIONS: Record<string, string> = {
  pending: "We've received your order. We'll confirm it and ring you to arrange delivery.",
  confirmed: "Your order is confirmed and queued for our team to prepare.",
  processing: "We're carefully packing your tiles, ready for dispatch.",
  shipped: "Your order has left our Lifford showroom and is on its way to you.",
  "out-for-delivery": "Your tiles are out for delivery — they should arrive today.",
  delivered: "Delivered. Enjoy your new tiles!",
  cancelled: "This order has been cancelled. Nothing further will be charged.",
};

/** The ordered steps a live order moves through (excludes cancelled). */
export const ORDER_STEPS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out-for-delivery",
  "delivered",
] as const;
