"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

// Pinned triggers must be created/reverted in a layout effect: React removes
// DOM nodes before passive-effect cleanups run, so a pin-spacer still wrapping
// the section at that point crashes navigation with removeChild errors.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * A pinned, scroll-scrubbed video scene — the backbone of the cinematic
 * journey. While the section is pinned, scroll progress drives
 * video.currentTime (lerped each frame for a buttery feel; the source
 * files are re-encoded all-keyframe so seeking is instant).
 *
 * Overlay children opt into the timeline with data-window="start,end"
 * (progress fractions): they fade/rise in near `start` and fade out
 * after `end`, letting copy chapters hand over as the camera moves.
 */
export default function ScrubVideo({
  src,
  poster,
  pinHeight = 260,
  className,
  children,
  onProgress,
}: {
  src: string;
  poster?: string;
  /** how long the pin lasts, in vh (260 = 2.6 viewports of scroll) */
  pinHeight?: number;
  className?: string;
  children?: React.ReactNode;
  onProgress?: (p: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef(0);

  useIsomorphicLayoutEffect(() => {
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!wrap || !video) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let target = 0;
    let current = 0;
    let duration = 0;

    const onMeta = () => {
      duration = video.duration || 0;
    };
    video.addEventListener("loadedmetadata", onMeta);
    if (video.readyState >= 1) onMeta();
    // nudge browsers that lazily fetch metadata
    video.load();

    const tick = () => {
      if (!duration || video.readyState < 2) return;
      current += (target - current) * 0.14;
      const t = current * duration;
      if (Math.abs(video.currentTime - t) > 0.015) {
        video.currentTime = t;
      }
    };
    if (!prefersReduced) gsap.ticker.add(tick);

    const overlays = Array.from(
      wrap.querySelectorAll<HTMLElement>("[data-window]"),
    ).map((el) => {
      const [a, b] = (el.dataset.window ?? "0,1").split(",").map(Number);
      return { el, a, b };
    });

    const applyOverlays = (p: number) => {
      const fade = 0.07; // progress-fraction used to ease in/out
      for (const { el, a, b } of overlays) {
        // windows that start at 0 are fully visible on load; ones that end at 1 never fade out
        const rise = a <= 0 ? 1 : Math.min(1, Math.max(0, (p - a) / fade));
        const fall = b >= 1 ? 1 : Math.min(1, Math.max(0, 1 - (p - b) / fade));
        const o = p < a ? 0 : Math.min(rise, fall);
        el.style.opacity = String(o);
        el.style.transform = `translateY(${(1 - o) * 28}px)`;
        el.style.pointerEvents = o > 0.5 ? "auto" : "none";
      }
    };
    applyOverlays(0);

    const st = ScrollTrigger.create({
      trigger: wrap,
      start: "top top",
      end: `+=${pinHeight}%`,
      pin: true,
      scrub: true,
      onUpdate: (self) => {
        target = self.progress;
        progressRef.current = self.progress;
        applyOverlays(self.progress);
        onProgress?.(self.progress);
      },
    });

    return () => {
      // revert (true) unwraps the pin-spacer BEFORE React unmounts the
      // section — otherwise route changes crash with removeChild errors
      st.kill(true);
      gsap.ticker.remove(tick);
      video.removeEventListener("loadedmetadata", onMeta);
    };
  }, [pinHeight, onProgress]);

  return (
    <section
      ref={wrapRef}
      className={`relative h-screen w-full overflow-hidden grain vignette ${className ?? ""}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {children}
    </section>
  );
}
