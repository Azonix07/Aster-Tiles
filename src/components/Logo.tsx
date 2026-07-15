// The original Aster "A" mark, carried over exactly from the legacy site.
// `onLight` swaps the fills so the mark reads on light grounds: the A goes
// navy and the crossbar becomes the page colour (a negative-space cut, the
// same role the navy bar plays on dark grounds).
export function LogoMark({
  className,
  onLight = false,
}: {
  className?: string;
  onLight?: boolean;
}) {
  return (
    <svg
      viewBox="8 10 40 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <polygon
        points="10,52 28,12 46,52 40,52 28,22 16,52"
        fill={onLight ? "#16181d" : "#ffffff"}
      />
      <polygon points="28,30 44,52 28,52" fill="#2db87c" />
      <rect
        x="14"
        y="42"
        width="24"
        height="5"
        fill={onLight ? "#ffffff" : "#16181d"}
      />
    </svg>
  );
}

export function Logo({
  className,
  dark = false,
}: {
  className?: string;
  dark?: boolean;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark className="h-9 w-auto shrink-0" onLight={dark} />
      <span
        className={`font-display text-2xl font-extrabold tracking-[-0.03em] ${
          dark ? "text-navy" : "text-white"
        }`}
      >
        A<span className="text-green">ster</span>
      </span>
    </span>
  );
}
