"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/** Counts up from 0 when scrolled into view. */
export default function Counter({
  value,
  suffix = "",
  className,
  duration = 1.8,
}: {
  value: number;
  suffix?: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { n: 0 };
    const fmt = (n: number) =>
      n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : String(Math.round(n));
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        n: value,
        duration,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
        onUpdate: () => {
          el.textContent = fmt(obj.n) + suffix;
        },
      });
    }, el);
    return () => ctx.revert();
  }, [value, suffix, duration]);

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}
