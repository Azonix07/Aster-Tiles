const items = [
  "Free Nationwide Delivery",
  "Premium Quality Guaranteed",
  "Lifford Showroom Open Daily",
  "Expert Design Advice",
  "Same-Day Quotes",
  "500+ Tile Collections",
];

export default function TrustMarquee() {
  const row = items.map((t, i) => (
    <span key={i} className="flex items-center gap-6 pr-6">
      <span className="font-display text-sm font-semibold tracking-wide text-white/70">
        {t}
      </span>
      <span className="text-green">◆</span>
    </span>
  ));

  return (
    <div className="overflow-hidden border-y border-white/8 bg-ink py-4">
      <div className="marquee-track" aria-hidden="true">
        {row}
        {row}
      </div>
      <span className="sr-only">{items.join(" · ")}</span>
    </div>
  );
}
