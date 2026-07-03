// The original Aster "A" mark, carried over exactly from the legacy site.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <polygon points="10,52 28,12 46,52 40,52 28,22 16,52" fill="#ffffff" />
      <polygon points="28,30 44,52 28,52" fill="#2db87c" />
      <rect x="14" y="42" width="24" height="5" fill="#0c2340" />
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
      <LogoMark className="h-9 w-auto shrink-0" />
      <span
        className={`font-display text-2xl font-extrabold tracking-wide ${
          dark ? "text-navy" : "text-white"
        }`}
      >
        A<span className="text-green">ster</span>
      </span>
    </span>
  );
}
