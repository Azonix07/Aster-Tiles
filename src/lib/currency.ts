/** ISO currency code for the shop's display symbol (used in structured data). */
export function currencyCode(symbol: string): string {
  switch (symbol.trim()) {
    case "₹":
      return "INR";
    case "$":
      return "USD";
    case "£":
      return "GBP";
    case "€":
    default:
      return "EUR";
  }
}
