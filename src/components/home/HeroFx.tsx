"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Scroll choreography for the hero. As the section scrolls away:
 * the video slowly zooms and sinks, the centred content lifts and fades
 * out faster than the page, and the scroll cue fades. Layers are tagged
 * with data-hero-* attributes on the section. No-op for reduced motion.
 */
export default function HeroFx() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = ref.current?.closest("section");
    if (!section) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const scrub = {
        trigger: section,
        start: "top top",
        end: "bottom top",
        scrub: true,
      } as const;

      gsap.to(section.querySelector("[data-hero-media]"), {
        scale: 1.08,
        yPercent: 4,
        ease: "none",
        scrollTrigger: scrub,
      });
      gsap.to(section.querySelector("[data-hero-content]"), {
        y: -60,
        opacity: 0,
        ease: "none",
        scrollTrigger: { ...scrub, end: "60% top" },
      });
      gsap.to(section.querySelector("[data-hero-cue]"), {
        opacity: 0,
        ease: "none",
        scrollTrigger: { ...scrub, end: "15% top" },
      });
    });

    return () => mm.revert();
  }, []);

  return <div ref={ref} className="hidden" aria-hidden="true" />;
}
