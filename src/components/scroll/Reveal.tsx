"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Scroll-into-view reveal. Children carrying [data-reveal] rise and fade in,
 * staggered in DOM order. Initial hidden state comes from globals.css so
 * there is no flash before hydration.
 */
export default function Reveal({
  children,
  className,
  stagger = 0.12,
  start = "top 78%",
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  start?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!targets.length) return;

    const ctx = gsap.context(() => {
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger,
        scrollTrigger: { trigger: el, start, once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [stagger, start]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Splits its text into lines-in-masks that slide up on scroll. */
export function RevealLines({
  text,
  className,
  as: Tag = "h2",
  start = "top 80%",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  start?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const inners = el.querySelectorAll<HTMLElement>(".line-inner");
    const ctx = gsap.context(() => {
      gsap.to(inners, {
        y: 0,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.09,
        scrollTrigger: { trigger: el, start, once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [start]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className} aria-label={text}>
      {text.split("\n").map((line, i) => (
        <span data-reveal-line key={i} aria-hidden="true">
          <span className="line-inner">{line}</span>
        </span>
      ))}
    </Tag>
  );
}
