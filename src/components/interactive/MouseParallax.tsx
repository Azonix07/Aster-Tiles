"use client";

import { useEffect, useRef } from "react";

/**
 * Gentle mouse-follow drift: children translate toward (factor > 0) or
 * away from (factor < 0) the cursor, a few pixels at most — used to give
 * hero layers depth. Inert on touch devices and for reduced motion.
 */
export default function MouseParallax({
  children,
  className,
  factor = 12,
}: {
  children: React.ReactNode;
  className?: string;
  factor?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        el.style.transform = `translate3d(${(nx * factor).toFixed(1)}px, ${(ny * factor).toFixed(1)}px, 0)`;
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [factor]);

  return (
    <div ref={ref} className={className} style={{ transition: "transform 0.3s ease-out", willChange: "transform" }}>
      {children}
    </div>
  );
}
