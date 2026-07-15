/**
 * Subtle architectural tile-grid — thin hairlines on a soft radial fade.
 * On-brand for a tile shop and purely decorative: fills empty space without the
 * blobby "AI glow" look. Sits behind content at low opacity.
 */
export default function GridLines({
  className,
  size = 56,
  opacity = 0.6,
}: {
  className?: string;
  size?: number;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
      style={{
        opacity,
        backgroundImage:
          "linear-gradient(to right, var(--color-mist) 1px, transparent 1px), linear-gradient(to bottom, var(--color-mist) 1px, transparent 1px)",
        backgroundSize: `${size}px ${size}px`,
        maskImage: "radial-gradient(ellipse 70% 70% at center, #000 0%, transparent 78%)",
        WebkitMaskImage: "radial-gradient(ellipse 70% 70% at center, #000 0%, transparent 78%)",
      }}
    />
  );
}
