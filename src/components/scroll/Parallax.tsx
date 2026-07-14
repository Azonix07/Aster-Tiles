"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function Parallax({
  children,
  speed = 1,
  className = "",
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const triggerEl = triggerRef.current;
    const targetEl = targetRef.current;
    if (!triggerEl || !targetEl) return;

    const yValue = window.innerWidth < 768 ? speed * 50 : speed * 150;

    const ctx = gsap.context(() => {
      gsap.to(targetEl, {
        y: yValue,
        ease: "none",
        scrollTrigger: {
          trigger: triggerEl,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, triggerEl);

    return () => ctx.revert();
  }, [speed]);

  return (
    <div ref={triggerRef} className={`overflow-visible ${className}`}>
      <div ref={targetRef} className="h-full w-full parallax-bg relative">
        {children}
      </div>
    </div>
  );
}
