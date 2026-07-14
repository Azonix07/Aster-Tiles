/**
 * The architectural rings motif — compass-like circles in a brand
 * gradient, rotating almost imperceptibly. Used as a recurring signature
 * across the site's headers and bands. `id` must be unique per instance
 * so the SVG gradients don't collide.
 */
export default function Rings({
  id,
  className,
  from = "#2db87c",
  to = "#0c2340",
}: {
  id: string;
  className?: string;
  from?: string;
  to?: string;
}) {
  return (
    <div className={`pointer-events-none select-none ${className ?? ""}`} aria-hidden="true">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-[spin_90s_linear_infinite] motion-reduce:animate-none"
      >
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} stopOpacity="0.8" />
            <stop offset="100%" stopColor={to} stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="200" cy="200" r="180" stroke={`url(#${id})`} strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="200" cy="200" r="140" stroke={`url(#${id})`} strokeWidth="1.5" />
        <circle cx="200" cy="200" r="100" stroke={`url(#${id})`} strokeWidth="2" strokeDasharray="10 15" />
        <line x1="200" y1="0" x2="200" y2="400" stroke={`url(#${id})`} strokeWidth="1" />
        <line x1="0" y1="200" x2="400" y2="200" stroke={`url(#${id})`} strokeWidth="1" />
        <line x1="58.5" y1="58.5" x2="341.5" y2="341.5" stroke={`url(#${id})`} strokeWidth="1" />
        <line x1="341.5" y1="58.5" x2="58.5" y2="341.5" stroke={`url(#${id})`} strokeWidth="1" />
      </svg>
    </div>
  );
}
